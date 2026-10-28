import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { TaskPriority } from '../enums/index.js';
import { hexColorRegex, WorkflowStatusSchema } from './project.js';

extendZodWithOpenApi(z);

// -------------------------------------------------------------
// Etiquetas (Labels)
// -------------------------------------------------------------

export const LabelSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    color: z.string(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .openapi('Label');

export type LabelDto = z.infer<typeof LabelSchema>;

export const CreateLabelRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome da etiqueta é obrigatório').max(40),
    color: z
      .string()
      .regex(hexColorRegex, 'Cor inválida (use formato #RRGGBB)')
      .default('#3B82F6'),
  })
  .openapi('CreateLabelRequest');

export type CreateLabelRequest = z.infer<typeof CreateLabelRequestSchema>;

export const AttachLabelRequestSchema = z
  .object({
    labelId: z.string().min(1, 'labelId é obrigatório'),
  })
  .openapi('AttachLabelRequest');

export type AttachLabelRequest = z.infer<typeof AttachLabelRequestSchema>;

// -------------------------------------------------------------
// Checklists e ChecklistItems
// -------------------------------------------------------------

export const ChecklistItemSchema = z
  .object({
    id: z.string(),
    checklistId: z.string(),
    text: z.string(),
    done: z.boolean(),
    position: z.number(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .openapi('ChecklistItem');

export type ChecklistItemDto = z.infer<typeof ChecklistItemSchema>;

export const ChecklistSchema = z
  .object({
    id: z.string(),
    taskId: z.string(),
    title: z.string(),
    items: z.array(ChecklistItemSchema),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .openapi('Checklist');

export type ChecklistDto = z.infer<typeof ChecklistSchema>;

export const CreateChecklistRequestSchema = z
  .object({
    title: z.string().trim().min(1, 'Título da checklist é obrigatório').max(120),
  })
  .openapi('CreateChecklistRequest');

export type CreateChecklistRequest = z.infer<typeof CreateChecklistRequestSchema>;

export const CreateChecklistItemRequestSchema = z
  .object({
    text: z.string().trim().min(1, 'Texto do item é obrigatório').max(300),
    position: z.number().optional(),
  })
  .openapi('CreateChecklistItemRequest');

export type CreateChecklistItemRequest = z.infer<typeof CreateChecklistItemRequestSchema>;

export const UpdateChecklistItemRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(300).optional(),
    done: z.boolean().optional(),
    position: z.number().optional(),
  })
  .openapi('UpdateChecklistItemRequest');

export type UpdateChecklistItemRequest = z.infer<typeof UpdateChecklistItemRequestSchema>;

// -------------------------------------------------------------
// Comentários com Menções (@)
// -------------------------------------------------------------

export const CommentBodySchema = z
  .object({
    text: z.string().trim().min(1, 'Comentário não pode ser vazio').max(4000),
    mentions: z.array(z.string()).default([]).optional(),
  })
  .openapi('CommentBody');

export type CommentBodyDto = z.infer<typeof CommentBodySchema>;

export const CommentSchema = z
  .object({
    id: z.string(),
    taskId: z.string().nullable().optional(),
    docId: z.string().nullable().optional(),
    authorId: z.string(),
    body: CommentBodySchema,
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()).optional(),
    author: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().nullable().optional(),
      })
      .optional(),
  })
  .openapi('Comment');

export type CommentDto = z.infer<typeof CommentSchema>;

export const CreateCommentRequestSchema = z
  .object({
    text: z.string().trim().min(1, 'Comentário não pode ser vazio').max(4000),
    mentions: z.array(z.string()).default([]).optional(),
  })
  .openapi('CreateCommentRequest');

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

// -------------------------------------------------------------
// Anexos (Attachments)
// -------------------------------------------------------------

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (seção 4.1 / 9 da spec)

export const AttachmentSchema = z
  .object({
    id: z.string(),
    taskId: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    size: z.number().int(),
    storageKey: z.string(),
    createdAt: z.string().or(z.date()),
  })
  .openapi('Attachment');

export type AttachmentDto = z.infer<typeof AttachmentSchema>;

export const CreateAttachmentRequestSchema = z
  .object({
    fileName: z.string().trim().min(1, 'Nome do arquivo é obrigatório').max(255),
    mimeType: z
      .string()
      .trim()
      .refine(
        (val) =>
          (ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(val),
        'Tipo de arquivo não permitido',
      ),
    size: z
      .number()
      .int()
      .min(1, 'Tamanho deve ser maior que zero')
      .max(MAX_ATTACHMENT_SIZE_BYTES, 'Arquivo excede o limite de 25 MB'),
    contentBase64: z.string().optional(),
  })
  .openapi('CreateAttachmentRequest');

export type CreateAttachmentRequest = z.infer<typeof CreateAttachmentRequestSchema>;

// -------------------------------------------------------------
// Tarefas (Tasks)
// -------------------------------------------------------------

export const RichTextDescriptionSchema = z
  .object({
    type: z.string().default('doc'),
    text: z.string().optional(),
    content: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough()
  .openapi('RichTextDescription');

export type RichTextDescriptionDto = z.infer<typeof RichTextDescriptionSchema>;

export const SubtaskSummarySchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    number: z.number().int(),
    key: z.string(),
    title: z.string(),
    statusId: z.string(),
    priority: z.nativeEnum(TaskPriority),
    progress: z.number().int(),
    dueDate: z.string().or(z.date()).nullable().optional(),
    assigneeIds: z.array(z.string()),
  })
  .openapi('SubtaskSummary');

export type SubtaskSummaryDto = z.infer<typeof SubtaskSummarySchema>;

export const TaskSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    projectKey: z.string().optional(),
    number: z.number().int(),
    key: z.string(), // ex.: "FLX-12"
    title: z.string(),
    description: z.unknown().nullable().optional(),
    statusId: z.string(),
    status: WorkflowStatusSchema.optional(),
    priority: z.nativeEnum(TaskPriority),
    parentId: z.string().nullable().optional(),
    assigneeIds: z.array(z.string()),
    startDate: z.string().or(z.date()).nullable().optional(),
    dueDate: z.string().or(z.date()).nullable().optional(),
    estimateMinutes: z.number().int().nullable().optional(),
    progress: z.number().int(),
    isMilestone: z.boolean(),
    position: z.number(),
    labels: z.array(LabelSchema).default([]),
    checklistSummary: z
      .object({
        totalItems: z.number().int(),
        completedItems: z.number().int(),
      })
      .optional(),
    commentCount: z.number().int().optional(),
    attachmentCount: z.number().int().optional(),
    subtaskCount: z.number().int().optional(),
    subtasks: z.array(SubtaskSummarySchema).optional(),
    checklists: z.array(ChecklistSchema).optional(),
    comments: z.array(CommentSchema).optional(),
    attachments: z.array(AttachmentSchema).optional(),
    deletedAt: z.string().or(z.date()).nullable().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .openapi('Task');

export type TaskDto = z.infer<typeof TaskSchema>;

export const CreateTaskRequestSchema = z
  .object({
    title: z.string().trim().min(1, 'O título da tarefa é obrigatório').max(240),
    description: z.unknown().nullable().optional(),
    statusId: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.NONE),
    parentId: z.string().nullable().optional(),
    assigneeIds: z.array(z.string()).default([]),
    labelIds: z.array(z.string()).default([]).optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    estimateMinutes: z.number().int().min(0).nullable().optional(),
    progress: z.number().int().min(0).max(100).default(0).optional(),
    isMilestone: z.boolean().default(false).optional(),
  })
  .openapi('CreateTaskRequest');

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export const UpdateTaskRequestSchema = z
  .object({
    title: z.string().trim().min(1, 'O título da tarefa é obrigatório').max(240).optional(),
    description: z.unknown().nullable().optional(),
    statusId: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    parentId: z.string().nullable().optional(),
    assigneeIds: z.array(z.string()).optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    estimateMinutes: z.number().int().min(0).nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    isMilestone: z.boolean().optional(),
    position: z.number().optional(),
  })
  .openapi('UpdateTaskRequest');

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export const MoveTaskRequestSchema = z
  .object({
    statusId: z.string().optional(),
    position: z.number(),
  })
  .openapi('MoveTaskRequest');

export type MoveTaskRequest = z.infer<typeof MoveTaskRequestSchema>;

export const BulkTasksActionSchema = z
  .object({
    taskIds: z.array(z.string()).min(1, 'Selecione pelo menos uma tarefa'),
    statusId: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeIds: z.array(z.string()).optional(),
    delete: z.boolean().optional(),
  })
  .openapi('BulkTasksAction');

export type BulkTasksActionRequest = z.infer<typeof BulkTasksActionSchema>;

export const TaskFilterQuerySchema = z.object({
  search: z.string().optional(),
  statusId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().optional(),
  labelId: z.string().optional(),
  parentId: z.string().optional(),
  includeSubtasks: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['position', 'dueDate', 'priority', 'number', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type TaskFilterQuery = z.infer<typeof TaskFilterQuerySchema>;
