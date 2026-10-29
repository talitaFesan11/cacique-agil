import { z } from 'zod';
import { TaskPriority } from '../enums/index.js';

export const TaskPriorityEnum = z.nativeEnum(TaskPriority);

export const WhiteboardTemplateCategoryEnum = z.enum([
  'brainstorming',
  'mindmap',
  'flowchart',
  'retrospective',
  'general',
]);
export type WhiteboardTemplateCategory = z.infer<typeof WhiteboardTemplateCategoryEnum>;

export const CanvasElementTypeEnum = z.enum([
  'sticky',
  'shape',
  'arrow',
  'text',
  'draw',
  'task_card',
  'frame',
]);
export type CanvasElementType = z.infer<typeof CanvasElementTypeEnum>;

export const CanvasShapeTypeEnum = z.enum([
  'rectangle',
  'ellipse',
  'diamond',
  'triangle',
]);
export type CanvasShapeType = z.infer<typeof CanvasShapeTypeEnum>;

export const CanvasStickyColorEnum = z.enum([
  'yellow',
  'blue',
  'green',
  'pink',
  'purple',
  'orange',
]);
export type CanvasStickyColor = z.infer<typeof CanvasStickyColorEnum>;

export const CanvasPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type CanvasPoint = z.infer<typeof CanvasPointSchema>;

export const CanvasElementSchema = z.object({
  id: z.string(),
  type: CanvasElementTypeEnum,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
  text: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  shapeType: CanvasShapeTypeEnum.optional(),
  strokeWidth: z.number().optional(),
  points: z.array(CanvasPointSchema).optional(),
  fromElementId: z.string().optional(),
  toElementId: z.string().optional(),
  fromPoint: CanvasPointSchema.optional(),
  toPoint: CanvasPointSchema.optional(),
  taskId: z.string().optional(),
  taskKey: z.string().optional(),
  taskTitle: z.string().optional(),
  taskPriority: TaskPriorityEnum.optional(),
  taskStatusName: z.string().optional(),
  taskStatusCategory: z.string().optional(),
  zIndex: z.number().optional(),
  locked: z.boolean().optional(),
});
export type CanvasElement = z.infer<typeof CanvasElementSchema>;

export const WhiteboardProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
});
export type WhiteboardProjectDto = z.infer<typeof WhiteboardProjectSchema>;

export const WhiteboardAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
});
export type WhiteboardAuthorDto = z.infer<typeof WhiteboardAuthorSchema>;

export const WhiteboardSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string().nullable().optional(),
  project: WhiteboardProjectSchema.nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  elementsJson: z.array(CanvasElementSchema).nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  isTemplate: z.boolean().default(false),
  templateCategory: WhiteboardTemplateCategoryEnum.nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdBy: WhiteboardAuthorSchema.nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  deletedAt: z.string().or(z.date()).nullable().optional(),
  linkedTasksCount: z.number().int().default(0),
  elementsCount: z.number().int().default(0),
});
export type WhiteboardDto = z.infer<typeof WhiteboardSchema>;

export const CreateWhiteboardRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID é obrigatório'),
  projectId: z.string().nullable().optional(),
  title: z.string().min(1, 'Título é obrigatório').default('Quadro sem título'),
  description: z.string().nullable().optional(),
  templateCategory: WhiteboardTemplateCategoryEnum.nullable().optional(),
  isTemplate: z.boolean().optional(),
  initialElements: z.array(CanvasElementSchema).optional(),
});
export type CreateWhiteboardRequest = z.infer<typeof CreateWhiteboardRequestSchema>;

export const UpdateWhiteboardRequestSchema = z.object({
  title: z.string().min(1, 'Título não pode ser vazio').optional(),
  description: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  elementsJson: z.array(CanvasElementSchema).optional(),
  thumbnailUrl: z.string().nullable().optional(),
  isTemplate: z.boolean().optional(),
  templateCategory: WhiteboardTemplateCategoryEnum.nullable().optional(),
});
export type UpdateWhiteboardRequest = z.infer<typeof UpdateWhiteboardRequestSchema>;

export const ConvertStickyToTaskRequestSchema = z.object({
  stickyId: z.string().min(1, 'ID da nota adesiva é obrigatório'),
  projectId: z.string().min(1, 'ID do projeto é obrigatório'),
  title: z.string().optional(),
  priority: TaskPriorityEnum.optional(),
  statusId: z.string().optional(),
});
export type ConvertStickyToTaskRequest = z.infer<typeof ConvertStickyToTaskRequestSchema>;

export const ConvertSelectionToTasksRequestSchema = z.object({
  stickyIds: z.array(z.string().min(1)).min(1, 'Selecione ao menos uma nota adesiva'),
  projectId: z.string().min(1, 'ID do projeto é obrigatório'),
  statusId: z.string().optional(),
});
export type ConvertSelectionToTasksRequest = z.infer<typeof ConvertSelectionToTasksRequestSchema>;

export const PredefinedWhiteboardTemplateSchema = z.object({
  id: WhiteboardTemplateCategoryEnum,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  elements: z.array(CanvasElementSchema),
});
export type PredefinedWhiteboardTemplateDto = z.infer<typeof PredefinedWhiteboardTemplateSchema>;
