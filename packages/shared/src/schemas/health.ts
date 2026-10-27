import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.string(),
  uptime: z.number(),
  service: z.string(),
  version: z.string(),
  database: z.object({
    status: z.enum(['connected', 'disconnected']),
    latencyMs: z.number().optional(),
  }),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
