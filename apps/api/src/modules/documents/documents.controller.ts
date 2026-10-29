import { Request, Response, NextFunction } from 'express';
import {
  CreateDocumentRequestSchema,
  DocumentExportFormatEnum,
  MoveDocumentRequestSchema,
  UpdateDocumentRequestSchema,
} from '@fluxo/shared';
import { documentsService } from './documents.service.js';

export class DocumentsController {
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = String(req.params.workspaceId);
      const { projectId, isTemplate, search } = req.query;

      const docs = await documentsService.getDocuments(userId, workspaceId, {
        projectId: projectId ? String(projectId) : undefined,
        isTemplate: isTemplate !== undefined ? isTemplate === 'true' : undefined,
        search: search ? String(search) : undefined,
      });

      res.json({ data: docs });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentTree(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = String(req.params.workspaceId);
      const { projectId } = req.query;

      const tree = await documentsService.getDocumentTree(
        userId,
        workspaceId,
        projectId ? String(projectId) : undefined,
      );

      res.json({ data: tree });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const doc = await documentsService.getDocumentById(userId, id);
      res.json({ data: doc });
    } catch (error) {
      next(error);
    }
  }

  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validated = CreateDocumentRequestSchema.parse(req.body);

      const doc = await documentsService.createDocument(userId, validated);
      res.status(201).json({ data: doc });
    } catch (error) {
      next(error);
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const validated = UpdateDocumentRequestSchema.parse(req.body);

      const doc = await documentsService.updateDocument(userId, id, validated);
      res.json({ data: doc });
    } catch (error) {
      next(error);
    }
  }

  async moveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const validated = MoveDocumentRequestSchema.parse(req.body);

      const doc = await documentsService.moveDocument(userId, id, validated.parentId);
      res.json({ data: doc });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      await documentsService.deleteDocument(userId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const result = await documentsService.toggleFavorite(userId, id);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaceId = String(req.params.workspaceId);

      const templates = await documentsService.getTemplates(userId, workspaceId);
      res.json({ data: templates });
    } catch (error) {
      next(error);
    }
  }

  async exportDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const format = DocumentExportFormatEnum.catch('markdown').parse(req.query.format);

      const exported = await documentsService.exportDocument(userId, id, format);
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      res.setHeader('Content-Type', exported.mimeType);
      res.send(exported.content);
    } catch (error) {
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();
