import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ProjectStatus, StatusCategory, TaskPriority } from '../enums/index.js';

extendZodWithOpenApi(z);

export const projectKeyRegex = /^[A-Z][A-Z0-9]{1,9}$/;
export const hexColorRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export const WorkflowStatusSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    category: z.nativeEnum(StatusCategory),
    position: z.number(),
    wipLimit: z.number().int().nullable().optional(),
    color: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .openapi('WorkflowStatus');

export type WorkflowStatusDto = z.infer<typeof WorkflowStatusSchema>;

export const CreateWorkflowStatusRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome do status é obrigatório').max(60),
    category: z.nativeEnum(StatusCategory).default(StatusCategory.TODO),
    position: z.number().optional(),
    wipLimit: z.number().int().min(1).nullable().optional(),
    color: z.string().regex(hexColorRegex, 'Cor inválida (use formato #RRGGBB)').optional(),
  })
  .openapi('CreateWorkflowStatusRequest');

export type CreateWorkflowStatusRequest = z.infer<typeof CreateWorkflowStatusRequestSchema>;

export const UpdateWorkflowStatusRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome do status é obrigatório').max(60).optional(),
    category: z.nativeEnum(StatusCategory).optional(),
    position: z.number().optional(),
    wipLimit: z.number().int().min(1).nullable().optional(),
    color: z.string().regex(hexColorRegex, 'Cor inválida (use formato #RRGGBB)').nullable().optional(),
  })
  .openapi('UpdateWorkflowStatusRequest');

export type UpdateWorkflowStatusRequest = z.infer<typeof UpdateWorkflowStatusRequestSchema>;

export const ReorderWorkflowStatusesRequestSchema = z
  .object({
    statusIds: z.array(z.string().min(1)).min(1, 'Lista de statusIds é obrigatória'),
  })
  .openapi('ReorderWorkflowStatusesRequest');

export type ReorderWorkflowStatusesRequest = z.infer<typeof ReorderWorkflowStatusesRequestSchema>;

export const ProjectSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    key: z.string(),
    description: z.string().nullable().optional(),
    status: z.nativeEnum(ProjectStatus),
    color: z.string().nullable().optional(),
    startDate: z.string().or(z.date()).nullable().optional(),
    dueDate: z.string().or(z.date()).nullable().optional(),
    ownerId: z.string(),
    deletedAt: z.string().or(z.date()).nullable().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    taskCount: z.number().optional(),
    completedTaskCount: z.number().optional(),
    statuses: z.array(WorkflowStatusSchema).optional(),
  })
  .openapi('Project');

export type ProjectDto = z.infer<typeof ProjectSchema>;

export const CreateProjectRequestSchema = z
  .object({
    workspaceId: z.string().min(1, 'Workspace é obrigatório'),
    name: z.string().trim().min(2, 'O nome do projeto deve ter pelo menos 2 caracteres').max(120),
    key: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'A chave deve ter entre 2 e 10 caracteres')
      .max(10, 'A chave deve ter entre 2 e 10 caracteres')
      .regex(
        projectKeyRegex,
        'A chave deve começar com letra maiúscula e conter apenas letras/números',
      ),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
    color: z
      .string()
      .regex(hexColorRegex, 'Cor inválida (use formato #RRGGBB)')
      .default('#2563EB')
      .optional(),
    startDate: z.string().datetime({ offset: true }).or(z.string()).nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).or(z.string()).nullable().optional(),
  })
  .openapi('CreateProjectRequest');

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'O nome do projeto deve ter pelo menos 2 caracteres')
      .max(120)
      .optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    color: z.string().regex(hexColorRegex, 'Cor inválida (use formato #RRGGBB)').nullable().optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
  })
  .openapi('UpdateProjectRequest');

export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;

export const SavedViewConfigSchema = z
  .object({
    search: z.string().optional(),
    statusId: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().optional(),
    labelId: z.string().optional(),
    groupBy: z.enum(['status', 'priority', 'none']).optional(),
    sortBy: z.enum(['position', 'dueDate', 'priority', 'number', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .openapi('SavedViewConfig');

export type SavedViewConfigDto = z.infer<typeof SavedViewConfigSchema>;

export const SavedViewSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    ownerId: z.string(),
    type: z.string(),
    name: z.string(),
    config: SavedViewConfigSchema,
    shared: z.boolean(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .openapi('SavedView');

export type SavedViewDto = z.infer<typeof SavedViewSchema>;

export const CreateSavedViewRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'O nome da visão salva é obrigatório').max(80),
    type: z.string().default('LIST'),
    config: SavedViewConfigSchema,
    shared: z.boolean().default(false),
  })
  .openapi('CreateSavedViewRequest');

export type CreateSavedViewRequest = z.infer<typeof CreateSavedViewRequestSchema>;
