import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  WorkspaceRole,
} from '@fluxo/shared';
import { env } from '../../config/env.js';
import { mailer } from '../../config/mailer.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { authRepository } from './auth.repository.js';

const BCRYPT_ROUNDS = env.NODE_ENV === 'test' ? 4 : 12;

export const hashOpaqueToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateOpaqueToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

const signAccessToken = (user: { id: string; email: string; name: string }): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  );
};

const slugifyWorkspaceName = (name: string): string => {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'workspace'}-${suffix}`;
};

export const authService = {
  async register(
    input: RegisterRequest,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw createHttpError(409, 'EMAIL_ALREADY_IN_USE', 'Este endereço de e-mail já está cadastrado');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const workspaceName = `Workspace de ${input.name.split(' ')[0]}`;
    const workspaceSlug = slugifyWorkspaceName(workspaceName);

    const { user, memberships } = await authRepository.createUserWithDefaultWorkspace({
      name: input.name,
      email: input.email,
      passwordHash,
      locale: input.locale || 'pt-BR',
      workspaceName,
      workspaceSlug,
    });

    const accessToken = signAccessToken(user);
    const rawRefreshToken = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      },
      workspaces: memberships.map((m) => ({
        id: m.id,
        workspaceId: m.workspaceId,
        role: m.role as WorkspaceRole,
        workspace: {
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          createdAt: m.workspace.createdAt.toISOString(),
        },
      })),
    };
  },

  async login(
    input: LoginRequest,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw createHttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw createHttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }

    const accessToken = signAccessToken(user);
    const rawRefreshToken = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      },
      workspaces: user.memberships.map((m) => ({
        id: m.id,
        workspaceId: m.workspaceId,
        role: m.role as WorkspaceRole,
        workspace: {
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          createdAt: m.workspace.createdAt.toISOString(),
        },
      })),
    };
  },

  async refresh(
    rawRefreshToken: string | undefined,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    if (!rawRefreshToken) {
      throw createHttpError(401, 'REFRESH_TOKEN_MISSING', 'Refresh token ausente');
    }

    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw createHttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token inválido');
    }

    // Se o token já foi revogado, revogamos todos os tokens do usuário por segurança (reuse detection)
    if (storedToken.revokedAt) {
      await authRepository.revokeAllUserRefreshTokens(storedToken.userId);
      throw createHttpError(
        401,
        'REFRESH_TOKEN_REUSED',
        'Sessão inválida: refresh token já utilizado ou revogado',
      );
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      await authRepository.revokeRefreshTokenByHash(tokenHash);
      throw createHttpError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token expirado');
    }

    const newRawRefreshToken = generateOpaqueToken();
    const newTokenHash = hashOpaqueToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await authRepository.rotateRefreshToken({
      oldTokenId: storedToken.id,
      newTokenHash,
      userId: storedToken.userId,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    const user = storedToken.user;
    const accessToken = signAccessToken(user);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      },
      workspaces: user.memberships.map((m) => ({
        id: m.id,
        workspaceId: m.workspaceId,
        role: m.role as WorkspaceRole,
        workspace: {
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          createdAt: m.workspace.createdAt.toISOString(),
        },
      })),
    };
  },

  async logout(rawRefreshToken: string | undefined) {
    if (rawRefreshToken) {
      const tokenHash = hashOpaqueToken(rawRefreshToken);
      await authRepository.revokeRefreshTokenByHash(tokenHash);
    }
    return { message: 'Sessão encerrada com sucesso' };
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw createHttpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      },
      workspaces: user.memberships.map((m) => ({
        id: m.id,
        workspaceId: m.workspaceId,
        role: m.role as WorkspaceRole,
        workspace: {
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          createdAt: m.workspace.createdAt.toISOString(),
        },
      })),
    };
  },

  async forgotPassword(input: ForgotPasswordRequest) {
    const user = await authRepository.findUserByEmail(input.email);

    // Sempre retornamos mensagem genérica para evitar enumeração de usuários
    const genericResponse = {
      message: 'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.',
    };

    if (!user) {
      return genericResponse;
    }

    const rawResetToken = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.WEB_URL}/${user.locale || 'pt-BR'}/reset-password?token=${rawResetToken}`;

    await mailer.sendMail({
      to: user.email,
      subject: 'Cacique Agil — Recuperação de Senha',
      text: `Olá ${user.name}, acesse o link para redefinir sua senha: ${resetUrl}`,
      html: `<p>Olá <strong>${user.name}</strong>,</p><p>Recebemos uma solicitação para redefinir sua senha no Cacique Agil.</p><p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p><p>Este link expira em 1 hora.</p>`,
    });

    return genericResponse;
  },

  async resetPassword(input: ResetPasswordRequest) {
    const tokenHash = hashOpaqueToken(input.token);
    const storedResetToken = await authRepository.findPasswordResetTokenByHash(tokenHash);

    if (!storedResetToken || storedResetToken.usedAt) {
      throw createHttpError(400, 'INVALID_RESET_TOKEN', 'Token de recuperação inválido ou já utilizado');
    }

    if (storedResetToken.expiresAt.getTime() < Date.now()) {
      throw createHttpError(400, 'EXPIRED_RESET_TOKEN', 'Token de recuperação expirado');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    await authRepository.updatePasswordAndConsumeToken({
      userId: storedResetToken.userId,
      resetTokenId: storedResetToken.id,
      passwordHash,
    });

    return {
      message: 'Senha redefinida com sucesso. Você já pode entrar com a nova senha.',
    };
  },
};
