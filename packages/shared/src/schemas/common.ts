import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const ErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ErrorDetailSchema).optional(),
    requestId: z.string(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
