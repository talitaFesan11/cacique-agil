import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
      requestId,
    },
  });
};
