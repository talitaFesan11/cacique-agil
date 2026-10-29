import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { whiteboardsController } from './whiteboards.controller.js';

export const whiteboardsRouter = Router();

// Todas as rotas exigem autenticação
whiteboardsRouter.use(requireAuth);

// Templates pré-definidos
whiteboardsRouter.get(
  '/whiteboards/templates',
  whiteboardsController.listTemplates.bind(whiteboardsController),
);

// Listagem por workspace
whiteboardsRouter.get(
  '/workspaces/:workspaceId/whiteboards',
  whiteboardsController.list.bind(whiteboardsController),
);

// Criação
whiteboardsRouter.post(
  '/workspaces/:workspaceId/whiteboards',
  whiteboardsController.create.bind(whiteboardsController),
);
whiteboardsRouter.post(
  '/whiteboards',
  whiteboardsController.create.bind(whiteboardsController),
);

// CRUD individual
whiteboardsRouter.get(
  '/whiteboards/:id',
  whiteboardsController.getById.bind(whiteboardsController),
);
whiteboardsRouter.patch(
  '/whiteboards/:id',
  whiteboardsController.update.bind(whiteboardsController),
);
whiteboardsRouter.delete(
  '/whiteboards/:id',
  whiteboardsController.delete.bind(whiteboardsController),
);

// Conversão de post-its em tarefas
whiteboardsRouter.post(
  '/whiteboards/:id/convert-sticky',
  whiteboardsController.convertSticky.bind(whiteboardsController),
);
whiteboardsRouter.post(
  '/whiteboards/:id/convert-selection',
  whiteboardsController.convertSelection.bind(whiteboardsController),
);

// Exportação (SVG ou JSON)
whiteboardsRouter.get(
  '/whiteboards/:id/export',
  whiteboardsController.export.bind(whiteboardsController),
);
