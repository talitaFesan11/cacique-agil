import { Request, Response, NextFunction } from 'express';
import { TaskFilterQuerySchema } from '@fluxo/shared';
import { tasksService } from './tasks.service.js';

export const tasksController = {
  async listByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = TaskFilterQuerySchema.parse(req.query);
      const tasks = await tasksService.listProjectTasks(
        req.user!.id,
        String(req.params.projectId),
        filters,
      );
      return res.status(200).json(tasks);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.createTask(
        req.user!.id,
        String(req.params.projectId),
        req.body,
      );
      return res.status(201).json(task);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.getTaskById(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(task);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.updateTask(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(200).json(task);
    } catch (error) {
      return next(error);
    }
  },

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.moveTask(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(200).json(task);
    } catch (error) {
      return next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteTask(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async bulkAction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.bulkAction(req.user!.id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async attachLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.attachLabelToTask(
        req.user!.id,
        String(req.params.id),
        String(req.body.labelId),
      );
      return res.status(200).json(task);
    } catch (error) {
      return next(error);
    }
  },

  async detachLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.detachLabelFromTask(
        req.user!.id,
        String(req.params.id),
        String(req.params.labelId),
      );
      return res.status(200).json(task);
    } catch (error) {
      return next(error);
    }
  },

  async createChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const checklist = await tasksService.createChecklist(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(201).json(checklist);
    } catch (error) {
      return next(error);
    }
  },

  async deleteChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteChecklist(
        req.user!.id,
        String(req.params.checklistId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async addChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await tasksService.addChecklistItem(
        req.user!.id,
        String(req.params.checklistId),
        req.body,
      );
      return res.status(201).json(item);
    } catch (error) {
      return next(error);
    }
  },

  async updateChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await tasksService.updateChecklistItem(
        req.user!.id,
        String(req.params.itemId),
        req.body,
      );
      return res.status(200).json(item);
    } catch (error) {
      return next(error);
    }
  },

  async deleteChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteChecklistItem(
        req.user!.id,
        String(req.params.itemId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async listComments(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await tasksService.listComments(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(comments);
    } catch (error) {
      return next(error);
    }
  },

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await tasksService.createComment(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(201).json(comment);
    } catch (error) {
      return next(error);
    }
  },

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteComment(
        req.user!.id,
        String(req.params.commentId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async listAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      const attachments = await tasksService.listAttachments(
        req.user!.id,
        String(req.params.id),
      );
      return res.status(200).json(attachments);
    } catch (error) {
      return next(error);
    }
  },

  async createAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const attachment = await tasksService.createAttachment(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      return res.status(201).json(attachment);
    } catch (error) {
      return next(error);
    }
  },

  async deleteAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteAttachment(
        req.user!.id,
        String(req.params.attachmentId),
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
};
