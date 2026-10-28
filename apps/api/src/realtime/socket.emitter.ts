import { Server } from 'socket.io';
import {
  CommentDto,
  RealtimePresenceUpdatePayload,
  StatusDeletedEventPayload,
  TaskDeletedEventPayload,
  TaskDto,
  TaskMovedEventPayload,
  WorkflowStatusDto,
} from '@fluxo/shared';
import { logger } from '../config/logger.js';

class SocketEmitter {
  private io: Server | null = null;

  setServer(io: Server) {
    this.io = io;
  }

  getServer(): Server | null {
    return this.io;
  }

  emitToProject<T>(projectId: string, event: string, payload: T) {
    if (!this.io) {
      logger.debug({ projectId, event }, 'SocketEmitter chamado mas servidor Socket.IO não está ativo');
      return;
    }
    const room = `project:${projectId}`;
    this.io.to(room).emit(event, payload);
    logger.debug({ room, event }, 'Evento de tempo real emitido para sala');
  }

  emitToWorkspace<T>(workspaceId: string, event: string, payload: T) {
    if (!this.io) return;
    const room = `workspace:${workspaceId}`;
    this.io.to(room).emit(event, payload);
    logger.debug({ room, event }, 'Evento de tempo real emitido para workspace');
  }

  // Métodos com tipagem explícita dos eventos do projeto
  taskCreated(projectId: string, task: TaskDto) {
    this.emitToProject(projectId, 'task.created', task);
  }

  taskUpdated(projectId: string, task: TaskDto) {
    this.emitToProject(projectId, 'task.updated', task);
  }

  taskMoved(projectId: string, payload: TaskMovedEventPayload) {
    this.emitToProject(projectId, 'task.moved', payload);
  }

  taskDeleted(projectId: string, payload: TaskDeletedEventPayload) {
    this.emitToProject(projectId, 'task.deleted', payload);
  }

  statusCreated(projectId: string, status: WorkflowStatusDto) {
    this.emitToProject(projectId, 'status.created', status);
  }

  statusUpdated(projectId: string, status: WorkflowStatusDto) {
    this.emitToProject(projectId, 'status.updated', status);
  }

  statusDeleted(projectId: string, payload: StatusDeletedEventPayload) {
    this.emitToProject(projectId, 'status.deleted', payload);
  }

  commentCreated(projectId: string, comment: CommentDto) {
    this.emitToProject(projectId, 'comment.created', comment);
  }

  presenceUpdate(projectId: string, payload: RealtimePresenceUpdatePayload) {
    this.emitToProject(projectId, 'presence.update', payload);
  }
}

export const socketEmitter = new SocketEmitter();
