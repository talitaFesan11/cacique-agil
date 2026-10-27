import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';

const app = createApp();
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Servidor FluxoPro API rodando na porta ${PORT} [${env.NODE_ENV}]`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`OpenAPI docs: http://localhost:${PORT}/api/docs`);
});

// Encerramento Gracioso (Graceful Shutdown)
const gracefulShutdown = async (signal: string) => {
  logger.info(`Recebido ${signal}. Encerrando servidor graciosamente...`);

  server.close(async () => {
    logger.info('Servidor HTTP encerrado.');
    try {
      await prisma.$disconnect();
      logger.info('Conexão com PostgreSQL desconectada.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Erro ao desconectar do PostgreSQL');
      process.exit(1);
    }
  });

  // Força encerramento se passar de 10s
  setTimeout(() => {
    logger.error('Encerramento forçado após timeout de 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
