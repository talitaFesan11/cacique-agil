import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { healthService } from '../src/modules/health/health.service.js';

describe('Health Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /health retorna 200 quando saudável', async () => {
    vi.spyOn(healthService, 'getHealth').mockResolvedValueOnce({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 12.34,
      service: '@fluxo/api',
      version: '0.1.0',
      database: {
        status: 'connected',
        latencyMs: 5,
      },
    });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('@fluxo/api');
    expect(res.body.database.status).toBe('connected');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /health retorna 503 quando degradado', async () => {
    vi.spyOn(healthService, 'getHealth').mockResolvedValueOnce({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: 12.34,
      service: '@fluxo/api',
      version: '0.1.0',
      database: {
        status: 'disconnected',
      },
    });

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
  });

  it('GET /ready retorna 200 quando banco está pronto', async () => {
    vi.spyOn(healthService, 'getReady').mockResolvedValueOnce(true);

    const res = await request(app).get('/ready');

    expect(res.status).toBe(200);
    expect(res.text).toBe('READY');
  });

  it('GET /api/docs.json retorna especificação OpenAPI válida', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toBe('Cacique Agil API');
    expect(res.body.paths['/health']).toBeDefined();
  });

  it('GET /rota-inexistente retorna 404 no formato padrão da spec', async () => {
    const res = await request(app).get('/rota-inexistente');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });
});
