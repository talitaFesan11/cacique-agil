import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// -------------------------------------------------------------
// Linha de Base (Baseline) do Projeto
// -------------------------------------------------------------

export const TaskBaselineItemSchema = z
  .object({
    id: z.string(),
    baselineId: z.string(),
    taskId: z.string(),
    startDate: z.string().or(z.date()).nullable().optional(),
    dueDate: z.string().or(z.date()).nullable().optional(),
    createdAt: z.string().or(z.date()).optional(),
  })
  .openapi('TaskBaselineItem');

export type TaskBaselineItemDto = z.infer<typeof TaskBaselineItemSchema>;

export const ProjectBaselineSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()),
    items: z.array(TaskBaselineItemSchema).optional(),
    itemCount: z.number().int().optional(),
  })
  .openapi('ProjectBaseline');

export type ProjectBaselineDto = z.infer<typeof ProjectBaselineSchema>;

export const CreateBaselineRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome da linha de base é obrigatório').max(100),
    description: z.string().trim().max(500).optional(),
  })
  .openapi('CreateBaselineRequest');

export type CreateBaselineRequest = z.infer<typeof CreateBaselineRequestSchema>;
