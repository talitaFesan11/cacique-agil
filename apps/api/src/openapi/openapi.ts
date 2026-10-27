import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { HealthCheckResponseSchema, ApiErrorResponseSchema } from '@fluxo/shared';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Registra Schemas Comuns
registry.register('HealthCheckResponse', HealthCheckResponseSchema);
registry.register('ApiErrorResponse', ApiErrorResponseSchema);

// Registra Rota /health
registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health Check da API e Conexão com o Banco',
  description:
    'Retorna status de saúde da aplicação, uptime e latência da base de dados PostgreSQL.',
  responses: {
    200: {
      description: 'API saudável e conectada',
      content: {
        'application/json': {
          schema: HealthCheckResponseSchema,
        },
      },
    },
    503: {
      description: 'API degradada ou banco indisponível',
      content: {
        'application/json': {
          schema: HealthCheckResponseSchema,
        },
      },
    },
  },
});

// Registra Rota /ready
registry.registerPath({
  method: 'get',
  path: '/ready',
  summary: 'Readiness Probe para Kubernetes/Docker',
  responses: {
    200: {
      description: 'Pronto para receber tráfego',
    },
    503: {
      description: 'Não pronto',
    },
  },
});

export const getOpenApiDocumentation = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'FluxoPro API',
      version: '1.0.0',
      description:
        'Documentação da API REST do FluxoPro (Plataforma de Gerenciamento e Fluxo de Projetos)',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor Local de Desenvolvimento',
      },
    ],
  });
};
