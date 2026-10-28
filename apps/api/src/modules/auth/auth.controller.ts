import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { authService } from './auth.service.js';

export const REFRESH_COOKIE_NAME = 'fluxopro_refresh_token';

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      setRefreshTokenCookie(res, result.refreshToken);

      return res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
        workspaces: result.workspaces,
      });
    } catch (error) {
      return next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      setRefreshTokenCookie(res, result.refreshToken);

      return res.status(200).json({
        accessToken: result.accessToken,
        user: result.user,
        workspaces: result.workspaces,
      });
    } catch (error) {
      return next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken =
        (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) ||
        (req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : undefined);

      const result = await authService.refresh(rawToken, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      setRefreshTokenCookie(res, result.refreshToken);

      return res.status(200).json({
        accessToken: result.accessToken,
        user: result.user,
        workspaces: result.workspaces,
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      return next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken =
        (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) ||
        (req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : undefined);

      const result = await authService.logout(rawToken);
      clearRefreshTokenCookie(res);

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
};
