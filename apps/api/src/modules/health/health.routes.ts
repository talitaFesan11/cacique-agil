import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res, next) => healthController.getHealth(req, res, next));
healthRouter.get('/ready', (req, res, next) => healthController.getReady(req, res, next));
