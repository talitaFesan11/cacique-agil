import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { dependenciesController } from './dependencies.controller.js';

const router = Router();

// /api/v1/projects/:id/dependencies
router.get(
  '/projects/:id/dependencies',
  requireAuth,
  dependenciesController.list.bind(dependenciesController),
);

router.post(
  '/projects/:id/dependencies',
  requireAuth,
  dependenciesController.create.bind(dependenciesController),
);

router.delete(
  '/projects/:id/dependencies/:dependencyId',
  requireAuth,
  dependenciesController.delete.bind(dependenciesController),
);

router.post(
  '/projects/:id/auto-reschedule',
  requireAuth,
  dependenciesController.autoReschedule.bind(dependenciesController),
);

export default router;
