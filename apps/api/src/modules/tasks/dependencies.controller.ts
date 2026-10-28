import { Request, Response, NextFunction } from 'express';
import { CreateTaskDependencyRequestSchema } from '@fluxo/shared';
import { dependenciesService } from './dependencies.service.js';

export class DependenciesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId } = req.params;
      const dependencies = await dependenciesService.listDependencies(
        userId,
        projectId!,
      );
      return res.status(200).json({ data: dependencies });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId } = req.params;
      const validated = CreateTaskDependencyRequestSchema.parse(req.body);
      const dependency = await dependenciesService.createDependency(
        userId,
        projectId!,
        validated,
      );
      return res.status(201).json({ data: dependency });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId, dependencyId } = req.params;
      await dependenciesService.deleteDependency(
        userId,
        projectId!,
        dependencyId!,
      );
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  async autoReschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: projectId } = req.params;
      const result = await dependenciesService.autoReschedule(userId, projectId!);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }
}

export const dependenciesController = new DependenciesController();
