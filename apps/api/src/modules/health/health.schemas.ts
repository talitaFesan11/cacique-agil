import { z } from 'zod';
import { HealthCheckResponseSchema } from '@fluxo/shared';

export { HealthCheckResponseSchema };
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
