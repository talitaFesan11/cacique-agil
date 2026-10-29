import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { RealtimeUserPresence } from '@fluxo/shared';
import { getSocket } from './socket';
import { Socket } from 'socket.io-client';

export type ProviderStatus = 'connecting' | 'connected' | 'disconnected';

export class YjsSocketProvider {
  public doc: Y.Doc;
  public awareness: awarenessProtocol.Awareness;
  public docId: string;
  public status: ProviderStatus = 'connecting';
  private socket: Socket;
  private statusListeners = new Set<(status: ProviderStatus) => void>();
  private isDestroyed = false;

  constructor(docId: string, ydoc?: Y.Doc) {
    this.docId = docId;
    this.doc = ydoc || new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.socket = getSocket()!;

    this.init();
  }

  private init() {
    // 1. Conecta e ingressa na sala do documento
    if (this.socket.connected) {
      this.joinRoom();
    }

    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('doc-sync-init', this.onDocSyncInit);
    this.socket.on('doc-update', this.onDocUpdate);
    this.socket.on('doc-awareness', this.onDocAwareness);

    // 2. Quando o Y.Doc local for alterado pelo TipTap, transmite o delta binário
    this.doc.on('update', this.onLocalDocUpdate);

    // 3. Quando o awareness local mudar (cursor, seleção), transmite para a sala
    this.awareness.on('update', this.onLocalAwarenessUpdate);
  }

  private joinRoom = () => {
    this.setStatus('connecting');
    this.socket.emit('join-doc', { docId: this.docId });
  };

  private onConnect = () => {
    this.joinRoom();
  };

  private onDisconnect = () => {
    this.setStatus('disconnected');
  };

  private onDocSyncInit = (data: { docId: string; update: ArrayBuffer | Uint8Array }) => {
    if (data.docId !== this.docId) return;
    try {
      const uint8 = new Uint8Array(data.update);
      if (uint8.length > 0) {
        Y.applyUpdate(this.doc, uint8, 'server');
      }
      this.setStatus('connected');
    } catch (err) {
      console.error('[YjsSocketProvider] Erro ao aplicar doc-sync-init:', err);
    }
  };

  private onDocUpdate = (data: { docId: string; update: ArrayBuffer | Uint8Array }) => {
    if (data.docId !== this.docId) return;
    try {
      const uint8 = new Uint8Array(data.update);
      Y.applyUpdate(this.doc, uint8, 'server');
    } catch (err) {
      console.error('[YjsSocketProvider] Erro ao aplicar doc-update:', err);
    }
  };

  private onDocAwareness = (data: { docId: string; awarenessUpdate: ArrayBuffer | Uint8Array }) => {
    if (data.docId !== this.docId) return;
    try {
      const uint8 = new Uint8Array(data.awarenessUpdate);
      awarenessProtocol.applyAwarenessUpdate(this.awareness, uint8, 'server');
    } catch (err) {
      console.error('[YjsSocketProvider] Erro ao aplicar doc-awareness:', err);
    }
  };

  private onLocalDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === 'server' || this.isDestroyed) return;
    this.socket.emit('doc-update', {
      docId: this.docId,
      update: update.buffer ? update : new Uint8Array(update),
    });
  };

  private onLocalAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    if (origin === 'server' || this.isDestroyed) return;
    const changedClients = added.concat(updated, removed);
    const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
    this.socket.emit('doc-awareness', {
      docId: this.docId,
      awarenessUpdate: update,
    });
  };

  public setStatus(newStatus: ProviderStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => listener(newStatus));
    }
  }

  public onStatusChange(listener: (status: ProviderStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public onPresenceChange(listener: (users: RealtimeUserPresence[]) => void): () => void {
    const handler = () => {
      const states = Array.from(this.awareness.getStates().values());
      const userMap = new Map<string, RealtimeUserPresence>();
      states.forEach((s) => {
        if (s && typeof s === 'object' && 'user' in s) {
          const u = (s as { user?: RealtimeUserPresence }).user;
          if (u && u.userId) {
            userMap.set(u.userId, u);
          }
        }
      });
      listener(Array.from(userMap.values()));
    };
    this.awareness.on('change', handler);
    return () => {
      this.awareness.off('change', handler);
    };
  }

  public destroy() {
    this.isDestroyed = true;
    this.socket.emit('leave-doc', { docId: this.docId });

    this.socket.off('connect', this.onConnect);
    this.socket.off('disconnect', this.onDisconnect);
    this.socket.off('doc-sync-init', this.onDocSyncInit);
    this.socket.off('doc-update', this.onDocUpdate);
    this.socket.off('doc-awareness', this.onDocAwareness);

    this.doc.off('update', this.onLocalDocUpdate);
    this.awareness.off('update', this.onLocalAwarenessUpdate);
    this.statusListeners.clear();
    this.awareness.destroy();
  }
}
