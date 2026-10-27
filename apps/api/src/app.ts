import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './modules/health/health.routes.js';
import { getOpenApiDocumentation } from './openapi/openapi.js';

export const createApp = (): Express => {
  const app = express();

  // Habilita trust proxy para proxy reverso Nginx (seção 4.1 da spec)
  app.set('trust proxy', 1);

  // Middlewares de Segurança e Rastreabilidade
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permite Swagger UI sem bloqueios inline
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // Logging de Requisições
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req.headers['x-request-id'] as string) || 'unknown',
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      }),
    );
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(rateLimiter);

  // Health and Readiness (tanto na raiz quanto sob /api/v1 para compatibilidade)
  app.use(healthRouter);
  app.use('/api/v1', healthRouter);

  // Documentação OpenAPI / Swagger UI
  const swaggerDocs = getOpenApiDocumentation();
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
  });

  // Manipuladores de 404 e Erros
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
