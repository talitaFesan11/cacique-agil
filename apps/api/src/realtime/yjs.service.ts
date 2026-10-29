import * as Y from 'yjs';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

export class YjsService {
  private docs = new Map<string, Y.Doc>();
  private saveTimers = new Map<string, NodeJS.Timeout>();

  async getOrCreateDoc(docId: string): Promise<Y.Doc> {
    if (this.docs.has(docId)) {
      return this.docs.get(docId)!;
    }

    const ydoc = new Y.Doc();

    // Carrega snapshot existente do banco
    const dbDoc = await prisma.document.findUnique({
      where: { id: docId },
      select: { yjsState: true, title: true },
    });

    if (dbDoc?.yjsState) {
      try {
        Y.applyUpdate(ydoc, new Uint8Array(dbDoc.yjsState));
        logger.info({ docId }, 'Snapshot Yjs carregado do Postgres com sucesso');
      } catch (err) {
        logger.error({ err, docId }, 'Falha ao desserializar yjsState');
      }
    }

    this.docs.set(docId, ydoc);
    return ydoc;
  }

  async applyUpdate(docId: string, update: Uint8Array): Promise<void> {
    const ydoc = await this.getOrCreateDoc(docId);
    try {
      Y.applyUpdate(ydoc, update);
      this.scheduleSave(docId);
    } catch (err) {
      logger.error({ err, docId }, 'Erro ao aplicar update Yjs');
    }
  }

  async getDocState(docId: string): Promise<Uint8Array> {
    const ydoc = await this.getOrCreateDoc(docId);
    return Y.encodeStateAsUpdate(ydoc);
  }

  scheduleSave(docId: string) {
    if (this.saveTimers.has(docId)) {
      clearTimeout(this.saveTimers.get(docId)!);
    }

    const timer = setTimeout(async () => {
      this.saveTimers.delete(docId);
      await this.saveDocToDatabase(docId);
    }, 2000); // 2 segundos de debounce

    this.saveTimers.set(docId, timer);
  }

  async saveDocToDatabase(docId: string): Promise<void> {
    const ydoc = this.docs.get(docId);
    if (!ydoc) return;

    try {
      const binaryState = Y.encodeStateAsUpdate(ydoc);
      const buffer = Buffer.from(binaryState);

      await prisma.document.update({
        where: { id: docId },
        data: {
          yjsState: buffer,
        },
      });

      logger.info({ docId, size: buffer.length }, 'Documento Yjs persistido no banco com sucesso');
    } catch (err) {
      logger.error({ err, docId }, 'Erro ao persistir Yjs no banco');
    }
  }

  async flush(docId: string): Promise<void> {
    if (this.saveTimers.has(docId)) {
      clearTimeout(this.saveTimers.get(docId)!);
      this.saveTimers.delete(docId);
      await this.saveDocToDatabase(docId);
    }
  }
}

export const yjsService = new YjsService();
