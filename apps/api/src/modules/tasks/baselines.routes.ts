import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { baselinesController } from './baselines.controller.js';

const router = Router();

// /api/v1/projects/:id/baselines
router.get(
  '/projects/:id/baselines',
  requireAuth,
  baselinesController.list.bind(baselinesController),
);

router.get(
  '/projects/:id/baselines/:baselineId',
  requireAuth,
  baselinesController.get.bind(baselinesController),
);

router.post(
  '/projects/:id/baselines',
  requireAuth,
  baselinesController.create.bind(baselinesController),
);

router.delete(
  '/projects/:id/baselines/:baselineId',
  requireAuth,
  baselinesController.delete.bind(baselinesController),
);

export default router;
