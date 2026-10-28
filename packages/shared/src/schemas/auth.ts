import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { WorkspaceRole } from '../enums/index.js';

extendZodWithOpenApi(z);

export const UserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
    locale: z.string().default('pt-BR'),
    createdAt: z.string().or(z.date()),
  })
  .openapi('User');

export type UserDto = z.infer<typeof UserSchema>;

export const UserWorkspaceMembershipSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    role: z.nativeEnum(WorkspaceRole),
    workspace: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      createdAt: z.string().or(z.date()),
    }),
  })
  .openapi('UserWorkspaceMembership');

export type UserWorkspaceMembershipDto = z.infer<typeof UserWorkspaceMembershipSchema>;

export const RegisterRequestSchema = z
  .object({
    name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres').max(100),
    email: z.string().trim().email('E-mail inválido').toLowerCase(),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .max(100, 'A senha deve ter no máximo 100 caracteres'),
    locale: z.enum(['pt-BR', 'en']).default('pt-BR').optional(),
  })
  .openapi('RegisterRequest');

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z
  .object({
    email: z.string().trim().email('E-mail inválido').toLowerCase(),
    password: z.string().min(1, 'A senha é obrigatória'),
  })
  .openapi('LoginRequest');

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const ForgotPasswordRequestSchema = z
  .object({
    email: z.string().trim().email('E-mail inválido').toLowerCase(),
  })
  .openapi('ForgotPasswordRequest');

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1, 'Token de recuperação é obrigatório'),
    password: z
      .string()
      .min(8, 'A nova senha deve ter no mínimo 8 caracteres')
      .max(100, 'A nova senha deve ter no máximo 100 caracteres'),
  })
  .openapi('ResetPasswordRequest');

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const AuthResponseSchema = z
  .object({
    accessToken: z.string(),
    user: UserSchema,
    workspaces: z.array(UserWorkspaceMembershipSchema).optional(),
  })
  .openapi('AuthResponse');

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MeResponseSchema = z
  .object({
    user: UserSchema,
    workspaces: z.array(UserWorkspaceMembershipSchema),
  })
  .openapi('MeResponse');

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const MessageResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi('MessageResponse');

export type MessageResponse = z.infer<typeof MessageResponseSchema>;
