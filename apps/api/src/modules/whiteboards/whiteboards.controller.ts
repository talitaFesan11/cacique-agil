import { Request, Response, NextFunction } from 'express';
import { whiteboardsService } from './whiteboards.service.js';
import {
  ConvertSelectionToTasksRequestSchema,
  ConvertStickyToTaskRequestSchema,
  CreateWhiteboardRequestSchema,
  UpdateWhiteboardRequestSchema,
} from '@fluxo/shared';

export class WhiteboardsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = String(req.params.workspaceId || req.query.workspaceId || '');
      const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const isTemplate = req.query.isTemplate ? req.query.isTemplate === 'true' : undefined;

      const whiteboards = await whiteboardsService.listWhiteboards(userId, workspaceId, {
        projectId,
        search,
        isTemplate,
      });

      return res.status(200).json({ data: whiteboards });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const whiteboard = await whiteboardsService.getWhiteboardById(userId, id);
      return res.status(200).json({ data: whiteboard });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = String(req.params.workspaceId || req.body.workspaceId || '');

      const parsed = CreateWhiteboardRequestSchema.parse({
        ...req.body,
        workspaceId,
      });

      const created = await whiteboardsService.createWhiteboard(userId, parsed);
      return res.status(201).json({ data: created });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const parsed = UpdateWhiteboardRequestSchema.parse(req.body);
      const updated = await whiteboardsService.updateWhiteboard(userId, id, parsed);

      return res.status(200).json({ data: updated });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      await whiteboardsService.deleteWhiteboard(userId, id);
      return res.status(200).json({ data: { message: 'Quadro branco excluído com sucesso' } });
    } catch (error) {
      return next(error);
    }
  }

  listTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = whiteboardsService.listTemplates();
      return res.status(200).json({ data: templates });
    } catch (error) {
      return next(error);
    }
  }

  async convertSticky(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const parsed = ConvertStickyToTaskRequestSchema.parse(req.body);
      const result = await whiteboardsService.convertStickyToTask(userId, id, parsed);

      return res.status(201).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async convertSelection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const parsed = ConvertSelectionToTasksRequestSchema.parse(req.body);
      const result = await whiteboardsService.convertSelectionToTasks(userId, id, parsed);

      return res.status(201).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const format = (req.query.format as 'svg' | 'json') || 'svg';

      const content = await whiteboardsService.exportWhiteboard(userId, id, format);

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        return res.send(content);
      }

      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(content);
    } catch (error) {
      return next(error);
    }
  }
}

export const whiteboardsController = new WhiteboardsController();
