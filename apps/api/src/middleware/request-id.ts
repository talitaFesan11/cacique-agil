import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const existingId = req.headers['x-request-id'] as string | undefined;
  const requestId = existingId || randomUUID();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};
