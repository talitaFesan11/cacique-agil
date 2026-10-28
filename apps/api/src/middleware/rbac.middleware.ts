import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@fluxo/shared';
import { prisma } from '../config/prisma.js';
import { createHttpError } from './auth.middleware.js';

export const ALL_WORKSPACE_ROLES: WorkspaceRole[] = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.MEMBER,
  WorkspaceRole.GUEST,
];

export const ADMIN_WORKSPACE_ROLES: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN];

export const MEMBER_WORKSPACE_ROLES: WorkspaceRole[] = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.MEMBER,
];

/**
 * Middleware de RBAC por Workspace.
 * Verifica se o usuário autenticado pertence ao workspace informado (em req.params[paramName] ou req.body.workspaceId)
 * e se possui um dos papéis permitidos. Garante isolamento estrito multi-tenant (seção 6.1 e 9 da Spec).
 */
export const requireWorkspaceRole = (
  allowedRoles: WorkspaceRole[] = ALL_WORKSPACE_ROLES,
  paramName = 'id',
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(createHttpError(401, 'UNAUTHORIZED', 'Usuário não autenticado'));
      }

      const workspaceIdentifier =
        req.params[paramName] ||
        req.params.workspaceId ||
        (req.body && typeof req.body.workspaceId === 'string' ? req.body.workspaceId : undefined) ||
        (req.query && typeof req.query.workspaceId === 'string' ? req.query.workspaceId : undefined);

      if (!workspaceIdentifier) {
        return next(createHttpError(400, 'WORKSPACE_REQUIRED', 'Identificador do workspace é obrigatório'));
      }

      // Suporta busca tanto por id quanto por slug
      const workspace = await prisma.workspace.findFirst({
        where: {
          OR: [{ id: workspaceIdentifier }, { slug: workspaceIdentifier }],
        },
        select: { id: true },
      });

      if (!workspace) {
        return next(
          createHttpError(
            403,
            'FORBIDDEN_WORKSPACE_ACCESS',
            'Você não tem permissão para acessar este workspace',
          ),
        );
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: workspace.id,
          },
        },
      });

      if (!membership) {
        return next(
          createHttpError(
            403,
            'FORBIDDEN_WORKSPACE_ACCESS',
            'Você não pertence a este workspace',
          ),
        );
      }

      const userRole = membership.role as WorkspaceRole;

      if (!allowedRoles.includes(userRole)) {
        return next(
          createHttpError(
            403,
            'INSUFFICIENT_ROLE',
            `Esta ação requer um dos seguintes papéis: ${allowedRoles.join(', ')}`,
          ),
        );
      }

      req.workspaceMembership = {
        id: membership.id,
        workspaceId: membership.workspaceId,
        userId: membership.userId,
        role: userRole,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
