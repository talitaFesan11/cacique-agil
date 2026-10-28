import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const WorkloadDayBucketSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  allocatedMinutes: z.number().int(),
  capacityMinutes: z.number().int(),
  isOverallocated: z.boolean(),
  taskIds: z.array(z.string()),
});

export type WorkloadDayBucket = z.infer<typeof WorkloadDayBucketSchema>;

export const MemberWorkloadSchema = z
  .object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable().optional(),
    dailyCapacityMinutes: z.number().int().default(480), // 8h padrão
    totalAllocatedMinutes: z.number().int(),
    totalCapacityMinutes: z.number().int(),
    isOverallocated: z.boolean(),
    taskCount: z.number().int(),
    days: z.array(WorkloadDayBucketSchema),
  })
  .openapi('MemberWorkload');

export type MemberWorkloadDto = z.infer<typeof MemberWorkloadSchema>;

export const ProjectWorkloadSummarySchema = z
  .object({
    projectId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    members: z.array(MemberWorkloadSchema),
    unassignedTaskCount: z.number().int(),
    unassignedMinutes: z.number().int(),
  })
  .openapi('ProjectWorkloadSummary');

export type ProjectWorkloadSummaryDto = z.infer<
  typeof ProjectWorkloadSummarySchema
>;
