import { prisma } from '../../config/prisma.js';
import { HealthCheckResponse } from './health.schemas.js';

export class HealthService {
  async getHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let latencyMs = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - startTime;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: '@fluxo/api',
      version: '0.1.0',
      database: {
        status: dbStatus,
        latencyMs,
      },
    };
  }

  async getReady(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

export const healthService = new HealthService();
