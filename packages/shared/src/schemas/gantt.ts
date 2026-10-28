import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { TaskPriority } from '../enums/index.js';
import { TaskDependencySchema } from './dependency.js';

extendZodWithOpenApi(z);

export enum GanttZoomLevel {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
}

export const CPMTaskMetricsSchema = z.object({
  taskId: z.string(),
  durationDays: z.number(),
  earlyStart: z.string().or(z.date()),
  earlyFinish: z.string().or(z.date()),
  lateStart: z.string().or(z.date()),
  lateFinish: z.string().or(z.date()),
  totalFloat: z.number(),
  freeFloat: z.number(),
  isCritical: z.boolean(),
});

export type CPMTaskMetrics = z.infer<typeof CPMTaskMetricsSchema>;

export const GanttTaskItemSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    number: z.number().int(),
    key: z.string(),
    title: z.string(),
    statusId: z.string(),
    statusName: z.string(),
    statusCategory: z.string(),
    statusColor: z.string().nullable().optional(),
    priority: z.nativeEnum(TaskPriority),
    parentId: z.string().nullable().optional(),
    assigneeIds: z.array(z.string()),
    startDate: z.string().or(z.date()).nullable().optional(),
    dueDate: z.string().or(z.date()).nullable().optional(),
    estimateMinutes: z.number().int().nullable().optional(),
    progress: z.number().int(),
    isMilestone: z.boolean(),
    position: z.number(),
    baselineStartDate: z.string().or(z.date()).nullable().optional(),
    baselineDueDate: z.string().or(z.date()).nullable().optional(),
    varianceDays: z.number().nullable().optional(),
    isCritical: z.boolean().default(false).optional(),
    totalFloat: z.number().optional(),
    predecessorIds: z.array(z.string()).default([]).optional(),
    successorIds: z.array(z.string()).default([]).optional(),
  })
  .openapi('GanttTaskItem');

export type GanttTaskItemDto = z.infer<typeof GanttTaskItemSchema> & {
  subtasks?: GanttTaskItemDto[];
};

export const GanttProjectDataSchema = z
  .object({
    projectId: z.string(),
    projectName: z.string(),
    projectStartDate: z.string().or(z.date()).nullable().optional(),
    projectDueDate: z.string().or(z.date()).nullable().optional(),
    tasks: z.array(GanttTaskItemSchema),
    dependencies: z.array(TaskDependencySchema),
    criticalPathTaskIds: z.array(z.string()),
    totalProjectDurationDays: z.number().int(),
  })
  .openapi('GanttProjectData');

export type GanttProjectDataDto = z.infer<typeof GanttProjectDataSchema>;

export const AutoRescheduleRequestSchema = z
  .object({
    taskId: z.string().optional(),
    applyToProject: z.boolean().default(true),
  })
  .openapi('AutoRescheduleRequest');

export type AutoRescheduleRequest = z.infer<typeof AutoRescheduleRequestSchema>;

export const AutoRescheduleResultSchema = z
  .object({
    updatedCount: z.number().int(),
    affectedTaskIds: z.array(z.string()),
  })
  .openapi('AutoRescheduleResult');

export type AutoRescheduleResult = z.infer<typeof AutoRescheduleResultSchema>;
