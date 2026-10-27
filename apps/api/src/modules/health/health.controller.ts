import { Request, Response, NextFunction } from 'express';
import { healthService } from './health.service.js';

export class HealthController {
  async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await healthService.getHealth();
      const statusCode = health.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (err) {
      next(err);
    }
  }

  async getReady(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isReady = await healthService.getReady();
      if (isReady) {
        res.status(200).send('READY');
      } else {
        res.status(503).send('NOT READY');
      }
    } catch (err) {
      next(err);
    }
  }
}

export const healthController = new HealthController();
