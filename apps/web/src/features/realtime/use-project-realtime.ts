'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePresenceUpdatePayload, RealtimeUserPresence, TaskMovedEventPayload } from '@fluxo/shared';
import { useAuthStore } from '@/features/auth/auth-store';
import { getSocket } from '@/lib/socket';

export interface UseProjectRealtimeResult {
  isConnected: boolean;
  activeUsers: RealtimeUserPresence[];
}

export function useProjectRealtime(projectId: string | null | undefined): UseProjectRealtimeResult {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<RealtimeUserPresence[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket(accessToken);
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join-project', { projectId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handlePresenceUpdate = (payload: RealtimePresenceUpdatePayload) => {
      if (payload.projectId === projectId) {
        setActiveUsers(payload.users);
      }
    };

    const handleTaskCreated = () => {
      void queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    };

    const handleTaskUpdated = (task: { id: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['task-detail', task.id] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    };

    const handleTaskMoved = (payload: TaskMovedEventPayload) => {
      if (payload.projectId === projectId) {
        void queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
        void queryClient.invalidateQueries({ queryKey: ['task-detail', payload.taskId] });
      }
    };

    const handleTaskDeleted = () => {
      void queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    };

    const handleStatusChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    };

    const handleCommentCreated = (comment: { taskId?: string | null }) => {
      if (comment.taskId) {
        void queryClient.invalidateQueries({ queryKey: ['task-detail', comment.taskId] });
        void queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      }
    };

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join-project', { projectId });
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('presence.update', handlePresenceUpdate);
    socket.on('task.created', handleTaskCreated);
    socket.on('task.updated', handleTaskUpdated);
    socket.on('task.moved', handleTaskMoved);
    socket.on('task.deleted', handleTaskDeleted);
    socket.on('status.created', handleStatusChanged);
    socket.on('status.updated', handleStatusChanged);
    socket.on('status.deleted', handleStatusChanged);
    socket.on('comment.created', handleCommentCreated);

    return () => {
      socket.emit('leave-project', { projectId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence.update', handlePresenceUpdate);
      socket.off('task.created', handleTaskCreated);
      socket.off('task.updated', handleTaskUpdated);
      socket.off('task.moved', handleTaskMoved);
      socket.off('task.deleted', handleTaskDeleted);
      socket.off('status.created', handleStatusChanged);
      socket.off('status.updated', handleStatusChanged);
      socket.off('status.deleted', handleStatusChanged);
      socket.off('comment.created', handleCommentCreated);
    };
  }, [projectId, accessToken, queryClient]);

  return { isConnected, activeUsers };
}
