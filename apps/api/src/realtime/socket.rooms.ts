import { Server } from 'socket.io';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { RealtimeUserPresence } from '@fluxo/shared';
import { AuthenticatedSocket } from './socket.auth.js';

// Map: projectId -> (userId -> RealtimeUserPresence)
const activePresence = new Map<string, Map<string, RealtimeUserPresence>>();

// Map: projectId -> (userId -> Set<socketId>)
const userSocketCount = new Map<string, Map<string, Set<string>>>();

export const getProjectPresenceList = (projectId: string): RealtimeUserPresence[] => {
  const usersMap = activePresence.get(projectId);
  if (!usersMap) return [];
  return Array.from(usersMap.values());
};

export const registerRoomHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('join-project', async (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      if (!projectId || typeof projectId !== 'string') return;

      // Verifica se o usuário tem acesso ao workspace do projeto
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          workspaceId: true,
          deletedAt: true,
        },
      });

      if (!project || project.deletedAt) {
        socket.emit('error', { code: 'PROJECT_NOT_FOUND', message: 'Projeto não encontrado' });
        return;
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: project.workspaceId,
          },
        },
      });

      if (!membership) {
        socket.emit('error', {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para acessar este projeto',
        });
        return;
      }

      const roomName = `project:${projectId}`;
      await socket.join(roomName);
      socket.data.projectRooms?.add(projectId);

      // Atualiza presença
      if (!activePresence.has(projectId)) {
        activePresence.set(projectId, new Map());
      }
      if (!userSocketCount.has(projectId)) {
        userSocketCount.set(projectId, new Map());
      }

      const socketsForUser = userSocketCount.get(projectId)!;
      if (!socketsForUser.has(user.id)) {
        socketsForUser.set(user.id, new Set());
      }
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

      logger.info(
        { userId: user.id, projectId, socketId: socket.id },
        'Usuário entrou na sala do projeto',
      );

      // Emite presença atualizada para a sala
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

  socket.on('disconnect', () => {
    try {
      if (socket.data.projectRooms) {
        for (const projectId of socket.data.projectRooms) {
          handleUserLeave(io, socket, projectId);
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
