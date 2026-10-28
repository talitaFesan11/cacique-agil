import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { WorkspaceRole } from '../enums/index.js';

extendZodWithOpenApi(z);

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const WorkspaceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    role: z.nativeEnum(WorkspaceRole).optional(),
    memberCount: z.number().optional(),
    projectCount: z.number().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .openapi('Workspace');

export type WorkspaceDto = z.infer<typeof WorkspaceSchema>;

export const CreateWorkspaceRequestSchema = z
  .object({
    name: z.string().trim().min(2, 'O nome do workspace deve ter pelo menos 2 caracteres').max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, 'O slug deve ter pelo menos 2 caracteres')
      .max(60)
      .regex(slugRegex, 'O slug deve conter apenas letras minúsculas, números e hífens')
      .optional(),
  })
  .openapi('CreateWorkspaceRequest');

export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;

export const UpdateWorkspaceRequestSchema = z
  .object({
    name: z.string().trim().min(2, 'O nome do workspace deve ter pelo menos 2 caracteres').max(80).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, 'O slug deve ter pelo menos 2 caracteres')
      .max(60)
      .regex(slugRegex, 'O slug deve conter apenas letras minúsculas, números e hífens')
      .optional(),
  })
  .openapi('UpdateWorkspaceRequest');

export type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceRequestSchema>;

export const WorkspaceMemberSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    workspaceId: z.string(),
    role: z.nativeEnum(WorkspaceRole),
    createdAt: z.string().or(z.date()),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      avatarUrl: z.string().nullable().optional(),
    }),
  })
  .openapi('WorkspaceMember');

export type WorkspaceMemberDto = z.infer<typeof WorkspaceMemberSchema>;

export const UpdateMemberRoleRequestSchema = z
  .object({
    role: z.nativeEnum(WorkspaceRole),
  })
  .openapi('UpdateMemberRoleRequest');

export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleRequestSchema>;

export const CreateWorkspaceInviteRequestSchema = z
  .object({
    email: z.string().trim().email('E-mail inválido').toLowerCase(),
    role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
  })
  .openapi('CreateWorkspaceInviteRequest');

export type CreateWorkspaceInviteRequest = z.infer<typeof CreateWorkspaceInviteRequestSchema>;

export const WorkspaceInviteSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(WorkspaceRole),
    token: z.string(),
    invitedById: z.string(),
    expiresAt: z.string().or(z.date()),
    acceptedAt: z.string().or(z.date()).nullable().optional(),
    createdAt: z.string().or(z.date()),
    workspace: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      })
      .optional(),
    invitedBy: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      })
      .optional(),
  })
  .openapi('WorkspaceInvite');

export type WorkspaceInviteDto = z.infer<typeof WorkspaceInviteSchema>;
