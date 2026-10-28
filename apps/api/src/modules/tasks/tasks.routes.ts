import { Router } from 'express';
import {
  AttachLabelRequestSchema,
  BulkTasksActionSchema,
  CreateAttachmentRequestSchema,
  CreateChecklistItemRequestSchema,
  CreateChecklistRequestSchema,
  CreateCommentRequestSchema,
  CreateTaskRequestSchema,
  MoveTaskRequestSchema,
  UpdateChecklistItemRequestSchema,
  UpdateTaskRequestSchema,
} from '@fluxo/shared';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { tasksController } from './tasks.controller.js';

export const tasksRouter = Router();

// Listagem e criação de tarefas por projeto
tasksRouter.get(
  '/projects/:projectId/tasks',
  requireAuth,
  tasksController.listByProject,
);

tasksRouter.post(
  '/projects/:projectId/tasks',
  requireAuth,
  validateRequest({ body: CreateTaskRequestSchema }),
  tasksController.create,
);

// Ações em massa (importante vir antes de /tasks/:id para não colidir com :id = 'bulk')
tasksRouter.post(
  '/tasks/bulk',
  requireAuth,
  validateRequest({ body: BulkTasksActionSchema }),
  tasksController.bulkAction,
);

// Operações em uma tarefa
tasksRouter.get('/tasks/:id', requireAuth, tasksController.getById);

tasksRouter.patch(
  '/tasks/:id',
  requireAuth,
  validateRequest({ body: UpdateTaskRequestSchema }),
  tasksController.update,
);

tasksRouter.post(
  '/tasks/:id/move',
  requireAuth,
  validateRequest({ body: MoveTaskRequestSchema }),
  tasksController.move,
);

tasksRouter.delete('/tasks/:id', requireAuth, tasksController.remove);

// Etiquetas na tarefa
tasksRouter.post(
  '/tasks/:id/labels',
  requireAuth,
  validateRequest({ body: AttachLabelRequestSchema }),
  tasksController.attachLabel,
);

tasksRouter.delete(
  '/tasks/:id/labels/:labelId',
  requireAuth,
  tasksController.detachLabel,
);

// Checklists
tasksRouter.post(
  '/tasks/:id/checklists',
  requireAuth,
  validateRequest({ body: CreateChecklistRequestSchema }),
  tasksController.createChecklist,
);

tasksRouter.delete(
  '/checklists/:checklistId',
  requireAuth,
  tasksController.deleteChecklist,
);

tasksRouter.post(
  '/checklists/:checklistId/items',
  requireAuth,
  validateRequest({ body: CreateChecklistItemRequestSchema }),
  tasksController.addChecklistItem,
);

tasksRouter.patch(
  '/checklist-items/:itemId',
  requireAuth,
  validateRequest({ body: UpdateChecklistItemRequestSchema }),
  tasksController.updateChecklistItem,
);

tasksRouter.delete(
  '/checklist-items/:itemId',
  requireAuth,
  tasksController.deleteChecklistItem,
);

// Comentários
tasksRouter.get('/tasks/:id/comments', requireAuth, tasksController.listComments);

tasksRouter.post(
  '/tasks/:id/comments',
  requireAuth,
  validateRequest({ body: CreateCommentRequestSchema }),
  tasksController.createComment,
);

tasksRouter.delete('/comments/:commentId', requireAuth, tasksController.deleteComment);

// Anexos
tasksRouter.get(
  '/tasks/:id/attachments',
  requireAuth,
  tasksController.listAttachments,
);

tasksRouter.post(
  '/tasks/:id/attachments',
  requireAuth,
  validateRequest({ body: CreateAttachmentRequestSchema }),
  tasksController.createAttachment,
);

tasksRouter.delete(
  '/attachments/:attachmentId',
  requireAuth,
  tasksController.deleteAttachment,
);
