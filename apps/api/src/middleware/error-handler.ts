import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Array<{ path: string; message: string }>;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({ requestId, details }, 'Validation error');

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details,
        requestId,
      },
    });
  }

  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const code = appErr.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = statusCode === 500 ? 'Ocorreu um erro interno no servidor' : appErr.message;

  if (statusCode >= 500) {
    logger.error({ err, requestId }, 'Internal server error');
  } else {
    logger.warn({ code, message, requestId }, 'Handled error');
  }

  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: appErr.details,
      requestId,
    },
  });
};
