import { Server } from 'socket.io';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { RealtimeUserPresence } from '@fluxo/shared';
import { AuthenticatedSocket } from './socket.auth.js';
import { yjsService } from './yjs.service.js';

// Project presence
// Map: projectId -> (userId -> RealtimeUserPresence)
const activePresence = new Map<string, Map<string, RealtimeUserPresence>>();
const userSocketCount = new Map<string, Map<string, Set<string>>>();

// Document presence
// Map: docId -> (userId -> RealtimeUserPresence)
const activeDocPresence = new Map<string, Map<string, RealtimeUserPresence>>();
const docUserSocketCount = new Map<string, Map<string, Set<string>>>();

export const getProjectPresenceList = (projectId: string): RealtimeUserPresence[] => {
  const usersMap = activePresence.get(projectId);
  if (!usersMap) return [];
  return Array.from(usersMap.values());
};

export const getDocPresenceList = (docId: string): RealtimeUserPresence[] => {
  const usersMap = activeDocPresence.get(docId);
  if (!usersMap) return [];
  return Array.from(usersMap.values());
};

export const registerRoomHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const user = socket.data.user;
  if (!user) return;

  // Project Room Handlers
  socket.on('join-project', async (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      if (!projectId || typeof projectId !== 'string') return;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, workspaceId: true, deletedAt: true },
      });

      if (!project || project.deletedAt) {
        socket.emit('error', { code: 'PROJECT_NOT_FOUND', message: 'Projeto não encontrado' });
        return;
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: { userId: user.id, workspaceId: project.workspaceId },
        },
      });

      if (!membership) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Acesso negado ao projeto' });
        return;
      }

      const roomName = `project:${projectId}`;
      await socket.join(roomName);
      socket.data.projectRooms?.add(projectId);

      if (!activePresence.has(projectId)) activePresence.set(projectId, new Map());
      if (!userSocketCount.has(projectId)) userSocketCount.set(projectId, new Map());

      const socketsForUser = userSocketCount.get(projectId)!;
      if (!socketsForUser.has(user.id)) socketsForUser.set(user.id, new Set());
      socketsForUser.get(user.id)!.add(socket.id);

      const now = new Date().toISOString();
      const presenceEntry: RealtimeUserPresence = {
        userId: user.id,
        name: user.name,
        avatarUrl: null,
        joinedAt: now,
        lastActive: now,
      };

      activePresence.get(projectId)!.set(user.id, presenceEntry);

      io.to(roomName).emit('presence.update', {
        projectId,
        users: getProjectPresenceList(projectId),
      });
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Erro ao ingressar na sala do projeto');
    }
  });

  socket.on('leave-project', (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      if (!projectId) return;
      handleUserLeave(io, socket, projectId);
    } catch (error) {
      logger.error({ error }, 'Erro ao sair da sala do projeto');
    }
  });

  // Document Room Handlers (Yjs & Collaborative Editing)
  socket.on('join-doc', async (data: { docId: string }) => {
    try {
      const { docId } = data;
      if (!docId || typeof docId !== 'string') return;

      const doc = await prisma.document.findUnique({
        where: { id: docId },
        select: { id: true, workspaceId: true, deletedAt: true },
      });

      if (!doc || doc.deletedAt) {
        socket.emit('error', { code: 'DOC_NOT_FOUND', message: 'Documento não encontrado' });
        return;
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: { userId: user.id, workspaceId: doc.workspaceId },
        },
      });

      if (!membership) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Acesso negado ao documento' });
        return;
      }

      const roomName = `doc:${docId}`;
      await socket.join(roomName);
      socket.data.docRooms?.add(docId);

      // Doc presence
      if (!activeDocPresence.has(docId)) activeDocPresence.set(docId, new Map());
      if (!docUserSocketCount.has(docId)) docUserSocketCount.set(docId, new Map());

      const socketsForUser = docUserSocketCount.get(docId)!;
      if (!socketsForUser.has(user.id)) socketsForUser.set(user.id, new Set());
      socketsForUser.get(user.id)!.add(socket.id);

      const now = new Date().toISOString();
      const presenceEntry: RealtimeUserPresence = {
        userId: user.id,
        name: user.name,
        avatarUrl: null,
        joinedAt: now,
        lastActive: now,
      };

      activeDocPresence.get(docId)!.set(user.id, presenceEntry);

      // Emite presença do documento
      io.to(roomName).emit('doc-presence.update', {
        docId,
        users: getDocPresenceList(docId),
      });

      // Envia estado inicial do Yjs para o cliente conectado
      const binaryState = await yjsService.getDocState(docId);
      socket.emit('doc-sync-init', {
        docId,
        update: Buffer.from(binaryState),
      });

      logger.info({ userId: user.id, docId, socketId: socket.id }, 'Usuário entrou na sala do documento');
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Erro ao entrar na sala do documento');
    }
  });

  socket.on('doc-update', async (data: { docId: string; update: Buffer | Uint8Array }) => {
    try {
      const { docId, update } = data;
      if (!docId || !update) return;

      const uint8Update = new Uint8Array(update);

      // Aplica update no Y.Doc do servidor
      await yjsService.applyUpdate(docId, uint8Update);

      // Propaga o delta para todos os outros clientes na mesma sala
      socket.to(`doc:${docId}`).emit('doc-update', {
        docId,
        update: Buffer.from(uint8Update),
      });
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Erro ao processar doc-update Yjs');
    }
  });

  socket.on('doc-awareness', (data: { docId: string; awarenessUpdate: Buffer | Uint8Array }) => {
    try {
      const { docId, awarenessUpdate } = data;
      if (!docId || !awarenessUpdate) return;

      // Retransmite awareness (cursores e seleções) para os demais clientes
      socket.to(`doc:${docId}`).emit('doc-awareness', {
        docId,
        awarenessUpdate: Buffer.from(awarenessUpdate),
      });
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Erro ao retransmitir doc-awareness');
    }
  });

  socket.on('leave-doc', (data: { docId: string }) => {
    try {
      const { docId } = data;
      if (!docId) return;
      handleDocLeave(io, socket, docId);
    } catch (error) {
      logger.error({ error }, 'Erro ao sair da sala do documento');
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    try {
      if (socket.data.projectRooms) {
        for (const projectId of socket.data.projectRooms) {
          handleUserLeave(io, socket, projectId);
        }
      }
      if (socket.data.docRooms) {
        for (const docId of socket.data.docRooms) {
          handleDocLeave(io, socket, docId);
        }
      }
      logger.info({ userId: user.id, socketId: socket.id }, 'Socket desconectado');
    } catch (error) {
      logger.error({ error }, 'Erro no evento de disconnect do socket');
    }
  });
};

const handleUserLeave = (
  io: Server,
  socket: AuthenticatedSocket,
  projectId: string,
) => {
  const user = socket.data.user;
  if (!user) return;

  const roomName = `project:${projectId}`;
  socket.leave(roomName);
  socket.data.projectRooms?.delete(projectId);

  const socketsForUser = userSocketCount.get(projectId)?.get(user.id);
  if (socketsForUser) {
    socketsForUser.delete(socket.id);
    if (socketsForUser.size === 0) {
      userSocketCount.get(projectId)?.delete(user.id);
      activePresence.get(projectId)?.delete(user.id);

      io.to(roomName).emit('presence.update', {
        projectId,
        users: getProjectPresenceList(projectId),
      });
    }
  }
};

const handleDocLeave = (
  io: Server,
  socket: AuthenticatedSocket,
  docId: string,
) => {
  const user = socket.data.user;
  if (!user) return;

  const roomName = `doc:${docId}`;
  socket.leave(roomName);
  socket.data.docRooms?.delete(docId);

  const socketsForUser = docUserSocketCount.get(docId)?.get(user.id);
  if (socketsForUser) {
    socketsForUser.delete(socket.id);
    if (socketsForUser.size === 0) {
      docUserSocketCount.get(docId)?.delete(user.id);
      activeDocPresence.get(docId)?.delete(user.id);

      io.to(roomName).emit('doc-presence.update', {
        docId,
        users: getDocPresenceList(docId),
      });
    }
  }

  // Persiste no banco ao esvaziar a sala
  const remaining = docUserSocketCount.get(docId);
  if (!remaining || remaining.size === 0) {
    yjsService.flush(docId).catch(() => {});
  }
};
