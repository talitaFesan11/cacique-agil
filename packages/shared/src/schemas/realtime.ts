import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { WorkflowStatusSchema } from './project.js';
import { CommentSchema, TaskSchema } from './task.js';

extendZodWithOpenApi(z);

export const RealtimeUserPresenceSchema = z
  .object({
    userId: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
    joinedAt: z.string().or(z.date()),
    lastActive: z.string().or(z.date()),
  })
  .openapi('RealtimeUserPresence');

export type RealtimeUserPresence = z.infer<typeof RealtimeUserPresenceSchema>;

export const TaskMovedEventPayloadSchema = z
  .object({
    taskId: z.string(),
    projectId: z.string(),
    statusId: z.string(),
    position: z.number(),
    actorId: z.string(),
  })
  .openapi('TaskMovedEventPayload');

export type TaskMovedEventPayload = z.infer<typeof TaskMovedEventPayloadSchema>;

export const TaskDeletedEventPayloadSchema = z
  .object({
    taskId: z.string(),
    projectId: z.string(),
    actorId: z.string(),
  })
  .openapi('TaskDeletedEventPayload');

export type TaskDeletedEventPayload = z.infer<typeof TaskDeletedEventPayloadSchema>;

export const StatusDeletedEventPayloadSchema = z
  .object({
    statusId: z.string(),
    projectId: z.string(),
    actorId: z.string(),
  })
  .openapi('StatusDeletedEventPayload');

export type StatusDeletedEventPayload = z.infer<typeof StatusDeletedEventPayloadSchema>;

export const RealtimePresenceUpdatePayloadSchema = z
  .object({
    projectId: z.string(),
    users: z.array(RealtimeUserPresenceSchema),
  })
  .openapi('RealtimePresenceUpdatePayload');

export type RealtimePresenceUpdatePayload = z.infer<typeof RealtimePresenceUpdatePayloadSchema>;

export interface ServerToClientEvents {
  'task.created': (task: z.infer<typeof TaskSchema>) => void;
  'task.updated': (task: z.infer<typeof TaskSchema>) => void;
  'task.moved': (payload: TaskMovedEventPayload) => void;
  'task.deleted': (payload: TaskDeletedEventPayload) => void;
  'status.created': (status: z.infer<typeof WorkflowStatusSchema>) => void;
  'status.updated': (status: z.infer<typeof WorkflowStatusSchema>) => void;
  'status.deleted': (payload: StatusDeletedEventPayload) => void;
  'comment.created': (comment: z.infer<typeof CommentSchema>) => void;
  'presence.update': (payload: RealtimePresenceUpdatePayload) => void;
}

export interface ClientToServerEvents {
  'join-project': (data: { projectId: string }) => void;
  'leave-project': (data: { projectId: string }) => void;
}
