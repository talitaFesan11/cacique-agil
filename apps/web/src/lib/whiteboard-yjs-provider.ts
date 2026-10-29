import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { RealtimeUserPresence } from '@fluxo/shared';
import { getSocket } from './socket';
import { Socket } from 'socket.io-client';

export type WhiteboardProviderStatus = 'connecting' | 'connected' | 'disconnected';

export class WhiteboardYjsSocketProvider {
  public doc: Y.Doc;
  public awareness: awarenessProtocol.Awareness;
  public whiteboardId: string;
  public status: WhiteboardProviderStatus = 'connecting';
  private socket: Socket;
  private statusListeners = new Set<(status: WhiteboardProviderStatus) => void>();
  private presenceListeners = new Set<(users: RealtimeUserPresence[]) => void>();
  private isDestroyed = false;

  constructor(whiteboardId: string, ydoc?: Y.Doc) {
    this.whiteboardId = whiteboardId;
    this.doc = ydoc || new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.socket = getSocket()!;

    this.init();
  }

  private init() {
    if (!this.socket) return;

    if (this.socket.connected) {
      this.joinRoom();
    }

    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('whiteboard-sync-init', this.onSyncInit);
    this.socket.on('whiteboard-update', this.onRemoteUpdate);
    this.socket.on('whiteboard-awareness', this.onRemoteAwareness);
    this.socket.on('whiteboard-presence.update', this.onPresenceUpdate);

    // Quando o Y.Doc local for modificado no canvas
    this.doc.on('update', this.onLocalDocUpdate);

    // Quando o awareness local (cursor/seleção) mudar
    this.awareness.on('update', this.onLocalAwarenessUpdate);
  }

  private joinRoom = () => {
    this.setStatus('connecting');
    this.socket.emit('join-whiteboard', { whiteboardId: this.whiteboardId });
  };

  private onConnect = () => {
    this.joinRoom();
  };

  private onDisconnect = () => {
    this.setStatus('disconnected');
  };

  private onSyncInit = (data: { whiteboardId: string; update: ArrayBuffer | Uint8Array }) => {
    if (data.whiteboardId !== this.whiteboardId) return;
    try {
      const uint8 = new Uint8Array(data.update);
      if (uint8.length > 0) {
        Y.applyUpdate(this.doc, uint8, 'server');
      }
      this.setStatus('connected');
    } catch (err) {
      console.error('[WhiteboardProvider] Erro ao aplicar whiteboard-sync-init:', err);
    }
  };

  private onRemoteUpdate = (data: { whiteboardId: string; update: ArrayBuffer | Uint8Array }) => {
    if (data.whiteboardId !== this.whiteboardId) return;
    try {
      const uint8 = new Uint8Array(data.update);
      Y.applyUpdate(this.doc, uint8, 'server');
    } catch (err) {
      console.error('[WhiteboardProvider] Erro ao aplicar whiteboard-update:', err);
    }
  };

  private onRemoteAwareness = (data: { whiteboardId: string; awarenessUpdate: ArrayBuffer | Uint8Array }) => {
    if (data.whiteboardId !== this.whiteboardId) return;
    try {
      const uint8 = new Uint8Array(data.awarenessUpdate);
      awarenessProtocol.applyAwarenessUpdate(this.awareness, uint8, 'server');
    } catch (err) {
      console.error('[WhiteboardProvider] Erro ao aplicar whiteboard-awareness:', err);
    }
  };

  private onPresenceUpdate = (data: { whiteboardId: string; users: RealtimeUserPresence[] }) => {
    if (data.whiteboardId !== this.whiteboardId) return;
    for (const listener of this.presenceListeners) {
      listener(data.users);
    }
  };

  private onLocalDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === 'server' || this.isDestroyed || !this.socket?.connected) return;
    this.socket.emit('whiteboard-update', {
      whiteboardId: this.whiteboardId,
      update: update.buffer ? update : new Uint8Array(update),
    });
  };

  private onLocalAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    if (origin === 'server' || this.isDestroyed || !this.socket?.connected) return;
    const changedClients = added.concat(updated).concat(removed);
    const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
    this.socket.emit('whiteboard-awareness', {
      whiteboardId: this.whiteboardId,
      awarenessUpdate,
    });
  };

  private setStatus(status: WhiteboardProviderStatus) {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  public onStatusChange(callback: (status: WhiteboardProviderStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public onPresenceChange(callback: (users: RealtimeUserPresence[]) => void): () => void {
    this.presenceListeners.add(callback);
    return () => {
      this.presenceListeners.delete(callback);
    };
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.socket) {
      this.socket.emit('leave-whiteboard', { whiteboardId: this.whiteboardId });
      this.socket.off('connect', this.onConnect);
      this.socket.off('disconnect', this.onDisconnect);
      this.socket.off('whiteboard-sync-init', this.onSyncInit);
      this.socket.off('whiteboard-update', this.onRemoteUpdate);
      this.socket.off('whiteboard-awareness', this.onRemoteAwareness);
      this.socket.off('whiteboard-presence.update', this.onPresenceUpdate);
    }
    this.doc.off('update', this.onLocalDocUpdate);
    this.awareness.off('update', this.onLocalAwarenessUpdate);
    this.awareness.destroy();
    this.statusListeners.clear();
    this.presenceListeners.clear();
  }
}
