import { Router } from 'express';
import {
  CreateWorkspaceRequestSchema,
  UpdateWorkspaceRequestSchema,
  CreateWorkspaceInviteRequestSchema,
  UpdateMemberRoleRequestSchema,
  WorkspaceRole,
} from '@fluxo/shared';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  requireWorkspaceRole,
  ALL_WORKSPACE_ROLES,
  ADMIN_WORKSPACE_ROLES,
} from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { workspacesController } from './workspaces.controller.js';

export const workspacesRouter = Router();

// Rotas públicas/autenticadas de convite por token
workspacesRouter.get('/workspaces/invites/:token', workspacesController.getInviteInfo);
workspacesRouter.post(
  '/workspaces/invites/:token/accept',
  requireAuth,
  workspacesController.acceptInvite,
);

// Listagem e criação de workspaces do usuário autenticado
workspacesRouter.get('/workspaces', requireAuth, workspacesController.list);
workspacesRouter.post(
  '/workspaces',
  requireAuth,
  validateRequest({ body: CreateWorkspaceRequestSchema }),
  workspacesController.create,
);

// Operações em um workspace específico (com verificação de isolamento e RBAC)
workspacesRouter.get(
  '/workspaces/:id',
  requireAuth,
  requireWorkspaceRole(ALL_WORKSPACE_ROLES, 'id'),
  workspacesController.getById,
);

workspacesRouter.patch(
  '/workspaces/:id',
  requireAuth,
  requireWorkspaceRole(ADMIN_WORKSPACE_ROLES, 'id'),
  validateRequest({ body: UpdateWorkspaceRequestSchema }),
  workspacesController.update,
);

workspacesRouter.delete(
  '/workspaces/:id',
  requireAuth,
  requireWorkspaceRole([WorkspaceRole.OWNER], 'id'),
  workspacesController.remove,
);

// Membros do workspace
workspacesRouter.get(
  '/workspaces/:id/members',
  requireAuth,
  requireWorkspaceRole(ALL_WORKSPACE_ROLES, 'id'),
  workspacesController.listMembers,
);

workspacesRouter.patch(
  '/workspaces/:id/members/:memberId',
  requireAuth,
  requireWorkspaceRole(ADMIN_WORKSPACE_ROLES, 'id'),
  validateRequest({ body: UpdateMemberRoleRequestSchema }),
  workspacesController.updateMemberRole,
);

workspacesRouter.delete(
  '/workspaces/:id/members/:memberId',
  requireAuth,
  requireWorkspaceRole(ADMIN_WORKSPACE_ROLES, 'id'),
  workspacesController.removeMember,
);

// Convites do workspace
workspacesRouter.get(
  '/workspaces/:id/invites',
  requireAuth,
  requireWorkspaceRole(ALL_WORKSPACE_ROLES, 'id'),
  workspacesController.listInvites,
);

workspacesRouter.post(
  '/workspaces/:id/invites',
  requireAuth,
  requireWorkspaceRole(ADMIN_WORKSPACE_ROLES, 'id'),
  validateRequest({ body: CreateWorkspaceInviteRequestSchema }),
  workspacesController.createInvite,
);
