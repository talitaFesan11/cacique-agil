import { Request, Response, NextFunction } from 'express';
import { workspacesService } from './workspaces.service.js';

export const workspacesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaces = await workspacesService.listWorkspaces(req.user!.id);
      return res.status(200).json(workspaces);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = await workspacesService.createWorkspace(req.user!.id, req.body);
      return res.status(201).json(workspace);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const workspace = await workspacesService.getWorkspace(
        membership.workspaceId,
        membership.role,
      );
      return res.status(200).json(workspace);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const workspace = await workspacesService.updateWorkspace(
        membership.workspaceId,
        membership.role,
        req.body,
      );
      return res.status(200).json(workspace);
    } catch (error) {
      return next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const result = await workspacesService.deleteWorkspace(membership.workspaceId);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const members = await workspacesService.listMembers(membership.workspaceId);
      return res.status(200).json(members);
    } catch (error) {
      return next(error);
    }
  },

  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const updated = await workspacesService.updateMemberRole({
        workspaceId: membership.workspaceId,
        memberId: String(req.params.memberId),
        actorRole: membership.role,
        input: req.body,
      });
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const result = await workspacesService.removeMember({
        workspaceId: membership.workspaceId,
        memberId: String(req.params.memberId),
        actorRole: membership.role,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async createInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const invite = await workspacesService.createInvite({
        workspaceId: membership.workspaceId,
        actorId: req.user!.id,
        actorRole: membership.role,
        input: req.body,
      });
      return res.status(201).json(invite);
    } catch (error) {
      return next(error);
    }
  },

  async listInvites(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const invites = await workspacesService.listInvites(membership.workspaceId);
      return res.status(200).json(invites);
    } catch (error) {
      return next(error);
    }
  },

  async getInviteInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const invite = await workspacesService.getInviteByToken(String(req.params.token));
      return res.status(200).json(invite);
    } catch (error) {
      return next(error);
    }
  },

  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await workspacesService.acceptInvite(String(req.params.token), req.user!);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
};
