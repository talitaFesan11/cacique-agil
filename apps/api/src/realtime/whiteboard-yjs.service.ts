import * as Y from 'yjs';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { CanvasElement } from '@fluxo/shared';

export class WhiteboardYjsService {
  private boards = new Map<string, Y.Doc>();
  private saveTimers = new Map<string, NodeJS.Timeout>();

  async getOrCreateBoardDoc(boardId: string): Promise<Y.Doc> {
    if (this.boards.has(boardId)) {
      return this.boards.get(boardId)!;
    }

    const ydoc = new Y.Doc();

    // Carrega snapshot existente do banco
    const dbBoard = await prisma.whiteboard.findUnique({
      where: { id: boardId },
      select: { yjsState: true, elementsJson: true, title: true },
    });

    if (dbBoard?.yjsState) {
      try {
        Y.applyUpdate(ydoc, new Uint8Array(dbBoard.yjsState));
        logger.info({ boardId }, 'Snapshot Yjs do quadro carregado do Postgres com sucesso');
      } catch (err) {
        logger.error({ err, boardId }, 'Falha ao desserializar yjsState do quadro');
      }
    } else if (dbBoard?.elementsJson && Array.isArray(dbBoard.elementsJson)) {
      // Se não houver yjsState mas houver elementsJson, inicializa o Y.Array
      const yelements = ydoc.getArray<CanvasElement>('elements');
      yelements.insert(0, dbBoard.elementsJson as CanvasElement[]);
    }

    this.boards.set(boardId, ydoc);
    return ydoc;
  }

  async applyUpdate(boardId: string, update: Uint8Array): Promise<void> {
    const ydoc = await this.getOrCreateBoardDoc(boardId);
    try {
      Y.applyUpdate(ydoc, update);
      this.scheduleSave(boardId);
    } catch (err) {
      logger.error({ err, boardId }, 'Erro ao aplicar update Yjs no quadro');
    }
  }

  async getBoardState(boardId: string): Promise<Uint8Array> {
    const ydoc = await this.getOrCreateBoardDoc(boardId);
    return Y.encodeStateAsUpdate(ydoc);
  }

  scheduleSave(boardId: string) {
    if (this.saveTimers.has(boardId)) {
      clearTimeout(this.saveTimers.get(boardId)!);
    }

    const timer = setTimeout(async () => {
      this.saveTimers.delete(boardId);
      await this.saveBoardToDatabase(boardId);
    }, 2000); // 2 segundos de debounce

    this.saveTimers.set(boardId, timer);
  }

  async saveBoardToDatabase(boardId: string): Promise<void> {
    const ydoc = this.boards.get(boardId);
    if (!ydoc) return;

    try {
      const binaryState = Y.encodeStateAsUpdate(ydoc);
      const buffer = Buffer.from(binaryState);

      const yelements = ydoc.getArray<CanvasElement>('elements');
      const elements = yelements.toArray();

      await prisma.whiteboard.update({
        where: { id: boardId },
        data: {
          yjsState: buffer,
          ...(elements.length > 0 ? { elementsJson: JSON.parse(JSON.stringify(elements)) } : {}),
        },
      });

      logger.info(
        { boardId, size: buffer.length, elementsCount: elements.length },
        'Quadro Yjs persistido no banco com sucesso',
      );
    } catch (err) {
      logger.error({ err, boardId }, 'Erro ao persistir quadro Yjs no banco');
    }
  }

  async flush(boardId: string): Promise<void> {
    if (this.saveTimers.has(boardId)) {
      clearTimeout(this.saveTimers.get(boardId)!);
      this.saveTimers.delete(boardId);
      await this.saveBoardToDatabase(boardId);
    }
  }
}

export const whiteboardYjsService = new WhiteboardYjsService();
