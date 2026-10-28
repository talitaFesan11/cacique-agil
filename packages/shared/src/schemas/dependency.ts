import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { DependencyType } from '../enums/index.js';

extendZodWithOpenApi(z);

// -------------------------------------------------------------
// Dependências de Tarefas (Task Dependencies)
// -------------------------------------------------------------

export const TaskDependencySchema = z
  .object({
    id: z.string(),
    predecessorId: z.string(),
    successorId: z.string(),
    type: z.nativeEnum(DependencyType).default(DependencyType.FS),
    lagDays: z.number().int().default(0),
    createdAt: z.string().or(z.date()).optional(),
    predecessor: z
      .object({
        id: z.string(),
        number: z.number().int(),
        key: z.string(),
        title: z.string(),
        startDate: z.string().or(z.date()).nullable().optional(),
        dueDate: z.string().or(z.date()).nullable().optional(),
        progress: z.number().int().optional(),
      })
      .optional(),
    successor: z
      .object({
        id: z.string(),
        number: z.number().int(),
        key: z.string(),
        title: z.string(),
        startDate: z.string().or(z.date()).nullable().optional(),
        dueDate: z.string().or(z.date()).nullable().optional(),
        progress: z.number().int().optional(),
      })
      .optional(),
  })
  .openapi('TaskDependency');

export type TaskDependencyDto = z.infer<typeof TaskDependencySchema>;

export const CreateTaskDependencyRequestSchema = z
  .object({
    predecessorId: z.string().min(1, 'predecessorId é obrigatório'),
    successorId: z.string().min(1, 'successorId é obrigatório'),
    type: z.nativeEnum(DependencyType).default(DependencyType.FS),
    lagDays: z.number().int().default(0),
  })
  .refine((data) => data.predecessorId !== data.successorId, {
    message: 'Uma tarefa não pode depender de si mesma',
    path: ['successorId'],
  })
  .openapi('CreateTaskDependencyRequest');

export type CreateTaskDependencyRequest = z.infer<
  typeof CreateTaskDependencyRequestSchema
>;

export const UpdateTaskDependencyRequestSchema = z
  .object({
    type: z.nativeEnum(DependencyType).optional(),
    lagDays: z.number().int().optional(),
  })
  .openapi('UpdateTaskDependencyRequest');

export type UpdateTaskDependencyRequest = z.infer<
  typeof UpdateTaskDependencyRequestSchema
>;
