import { z } from 'zod';

export const EntityTypeEnum = z.enum([
  'whiteboard',
  'task',
  'document',
  'goal',
]);
export type EntityType = z.infer<typeof EntityTypeEnum>;

export const EntityLinkSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  fromType: z.string(),
  fromId: z.string(),
  toType: z.string(),
  toId: z.string(),
  createdAt: z.string().or(z.date()),
});
export type EntityLinkDto = z.infer<typeof EntityLinkSchema>;

export const CreateEntityLinkRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID é obrigatório'),
  fromType: z.string().min(1),
  fromId: z.string().min(1),
  toType: z.string().min(1),
  toId: z.string().min(1),
});
export type CreateEntityLinkRequest = z.infer<typeof CreateEntityLinkRequestSchema>;
