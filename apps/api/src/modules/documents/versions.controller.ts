import { Request, Response, NextFunction } from 'express';
import { CreateDocumentVersionRequestSchema } from '@fluxo/shared';
import { versionsService } from './versions.service.js';

export class VersionsController {
  async getVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const docId = String(req.params.id);

      const versions = await versionsService.getVersions(userId, docId);
      res.json({ data: versions });
    } catch (error) {
      next(error);
    }
  }

  async createVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const docId = String(req.params.id);
      const validated = CreateDocumentVersionRequestSchema.parse(req.body);

      const version = await versionsService.createVersion(userId, docId, validated.name);
      res.status(201).json({ data: version });
    } catch (error) {
      next(error);
    }
  }

  async restoreVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const docId = String(req.params.id);
      const versionId = String(req.params.versionId);

      const result = await versionsService.restoreVersion(userId, docId, versionId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const versionsController = new VersionsController();
