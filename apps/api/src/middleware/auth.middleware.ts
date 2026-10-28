import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { WorkspaceRole } from '@fluxo/shared';
import { env } from '../config/env.js';
import { AppError } from './error-handler.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface WorkspaceMembershipContext {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      workspaceMembership?: WorkspaceMembershipContext;
    }
  }
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export const createHttpError = (
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ path: string; message: string }>,
): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.code = code;
  if (details) {
    err.details = details;
  }
  return err;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, 'UNAUTHORIZED', 'Token de autenticação ausente ou inválido'));
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return next(createHttpError(401, 'UNAUTHORIZED', 'Token de autenticação ausente'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtAccessPayload;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch {
    return next(createHttpError(401, 'TOKEN_EXPIRED_OR_INVALID', 'Token de acesso inválido ou expirado'));
  }
};
