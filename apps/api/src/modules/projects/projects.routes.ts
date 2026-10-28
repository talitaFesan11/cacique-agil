import { Router } from 'express';
import {
  CreateLabelRequestSchema,
  CreateProjectRequestSchema,
  CreateSavedViewRequestSchema,
  CreateWorkflowStatusRequestSchema,
  UpdateProjectRequestSchema,
} from '@fluxo/shared';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { projectsController } from './projects.controller.js';

export const projectsRouter = Router();

// Listagem e criação de projetos (via query/body workspaceId ou /workspaces/:workspaceId/projects)
projectsRouter.get('/projects', requireAuth, projectsController.list);
projectsRouter.get(
  '/workspaces/:workspaceId/projects',
  requireAuth,
  projectsController.list,
);

projectsRouter.post(
  '/projects',
  requireAuth,
  validateRequest({ body: CreateProjectRequestSchema }),
  projectsController.create,
);

projectsRouter.post(
  '/workspaces/:workspaceId/projects',
  requireAuth,
  validateRequest({
    body: CreateProjectRequestSchema.omit({ workspaceId: true }),
  }),
  projectsController.create,
);

// Operações por projeto
projectsRouter.get('/projects/:id', requireAuth, projectsController.getById);

projectsRouter.patch(
  '/projects/:id',
  requireAuth,
  validateRequest({ body: UpdateProjectRequestSchema }),
  projectsController.update,
);

projectsRouter.delete('/projects/:id', requireAuth, projectsController.remove);

// Status do fluxo do projeto (WorkflowStatuses)
projectsRouter.get('/projects/:id/statuses', requireAuth, projectsController.listStatuses);

projectsRouter.post(
  '/projects/:id/statuses',
  requireAuth,
  validateRequest({ body: CreateWorkflowStatusRequestSchema }),
  projectsController.createStatus,
);

// Visões Salvas do projeto (SavedViews)
projectsRouter.get(
  '/projects/:id/saved-views',
  requireAuth,
  projectsController.listSavedViews,
);

projectsRouter.post(
  '/projects/:id/saved-views',
  requireAuth,
  validateRequest({ body: CreateSavedViewRequestSchema }),
  projectsController.createSavedView,
);

projectsRouter.delete(
  '/saved-views/:viewId',
  requireAuth,
  projectsController.deleteSavedView,
);

// Etiquetas (Labels) do Workspace
projectsRouter.get(
  '/workspaces/:workspaceId/labels',
  requireAuth,
  projectsController.listWorkspaceLabels,
);

projectsRouter.post(
  '/workspaces/:workspaceId/labels',
  requireAuth,
  validateRequest({ body: CreateLabelRequestSchema }),
  projectsController.createWorkspaceLabel,
);

projectsRouter.delete(
  '/labels/:labelId',
  requireAuth,
  projectsController.deleteWorkspaceLabel,
);
