import { Request, Response, NextFunction } from 'express';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { projectsService } from './projects.service.js';
import { ganttService } from './gantt.service.js';
import { workloadService } from './workload.service.js';

export const projectsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId =
        req.params.workspaceId ||
        (typeof req.query.workspaceId === 'string' ? req.query.workspaceId : '');

      if (!workspaceId) {
        return next(
          createHttpError(400, 'WORKSPACE_REQUIRED', 'O parâmetro workspaceId é obrigatório'),
        );
      }

      const projects = await projectsService.listProjects(req.user!.id, workspaceId);
      return res.status(200).json(projects);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId || req.body?.workspaceId;
      const project = await projectsService.createProject(req.user!.id, {
        ...req.body,
        workspaceId,
      });
      return res.status(201).json(project);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.getProjectById(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(project);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.updateProject(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(200).json(project);
    } catch (error) {
      return next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectsService.deleteProject(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async listStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await projectsService.listStatuses(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(statuses);
    } catch (error) {
      return next(error);
    }
  },

  async createStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await projectsService.createStatus(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(201).json(status);
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await projectsService.updateStatus(
        req.user!.id,
        String(req.params.id),
        String(req.params.statusId),
        req.body,
      );
      return res.status(200).json(status);
    } catch (error) {
      return next(error);
    }
  },

  async deleteStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectsService.deleteStatus(
        req.user!.id,
        String(req.params.id),
        String(req.params.statusId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async reorderStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await projectsService.reorderStatuses(
        req.user!.id,
        String(req.params.id),
        req.body.statusIds,
      );
      return res.status(200).json(statuses);
    } catch (error) {
      return next(error);
    }
  },

  async listSavedViews(req: Request, res: Response, next: NextFunction) {
    try {
      const views = await projectsService.listSavedViews(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(views);
    } catch (error) {
      return next(error);
    }
  },

  async createSavedView(req: Request, res: Response, next: NextFunction) {
    try {
      const view = await projectsService.createSavedView(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(201).json(view);
    } catch (error) {
      return next(error);
    }
  },

  async deleteSavedView(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectsService.deleteSavedView(
        req.user!.id,
        String(req.params.viewId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async listWorkspaceLabels(req: Request, res: Response, next: NextFunction) {
    try {
      const labels = await projectsService.listWorkspaceLabels(
        req.user!.id,
        String(req.params.workspaceId),
      );
      return res.status(200).json(labels);
    } catch (error) {
      return next(error);
    }
  },

  async createWorkspaceLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const label = await projectsService.createWorkspaceLabel(
        req.user!.id,
        String(req.params.workspaceId),
        req.body,
      );
      return res.status(201).json(label);
    } catch (error) {
      return next(error);
    }
  },

  async deleteWorkspaceLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectsService.deleteWorkspaceLabel(
        req.user!.id,
        String(req.params.labelId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async getGantt(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ganttService.getGanttData(
        req.user!.id,
        String(req.params.id),
        typeof req.query.baselineId === 'string' ? req.query.baselineId : undefined,
      );
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },

  async getWorkload(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workloadService.getProjectWorkload(
        req.user!.id,
        String(req.params.id),
        typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
        typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
      );
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },
};
