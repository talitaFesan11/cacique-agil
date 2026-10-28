import { Request, Response, NextFunction } from 'express';
import { CreateBaselineRequestSchema } from '@fluxo/shared';
import { baselinesService } from './baselines.service.js';

export class BaselinesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId } = req.params;
      const baselines = await baselinesService.listBaselines(userId, projectId!);
      return res.status(200).json({ data: baselines });
    } catch (error) {
      return next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId, baselineId } = req.params;
      const baseline = await baselinesService.getBaseline(
        userId,
        projectId!,
        baselineId!,
      );
      return res.status(200).json({ data: baseline });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId } = req.params;
      const validated = CreateBaselineRequestSchema.parse(req.body);
      const baseline = await baselinesService.createBaseline(
        userId,
        projectId!,
        validated,
      );
      return res.status(201).json({ data: baseline });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId, baselineId } = req.params;
      await baselinesService.deleteBaseline(userId, projectId!, baselineId!);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export const baselinesController = new BaselinesController();
