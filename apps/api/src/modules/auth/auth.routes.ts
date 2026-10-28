import { Router } from 'express';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
} from '@fluxo/shared';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post(
  '/auth/register',
  validateRequest({ body: RegisterRequestSchema }),
  authController.register,
);

authRouter.post(
  '/auth/login',
  validateRequest({ body: LoginRequestSchema }),
  authController.login,
);

authRouter.post('/auth/refresh', authController.refresh);

authRouter.post('/auth/logout', authController.logout);

authRouter.get('/auth/me', requireAuth, authController.me);

authRouter.post(
  '/auth/forgot-password',
  validateRequest({ body: ForgotPasswordRequestSchema }),
  authController.forgotPassword,
);

authRouter.post(
  '/auth/reset-password',
  validateRequest({ body: ResetPasswordRequestSchema }),
  authController.resetPassword,
);
