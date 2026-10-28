import { WorkspaceRole } from '@fluxo/shared';
import { prisma } from '../../config/prisma.js';

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async createUserWithDefaultWorkspace(data: {
    name: string;
    email: string;
    passwordHash: string;
    locale: string;
    workspaceName: string;
    workspaceSlug: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          locale: data.locale,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: data.workspaceName,
          slug: data.workspaceSlug,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
        include: {
          workspace: true,
        },
      });

      return {
        user,
        memberships: [membership],
      };
    });
  },

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({
      data,
    });
  },

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                workspace: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  },

  async rotateRefreshToken(params: {
    oldTokenId: string;
    newTokenHash: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: params.oldTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash: params.newTokenHash,
        },
      });

      return tx.refreshToken.create({
        data: {
          userId: params.userId,
          tokenHash: params.newTokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
        },
      });
    });
  },

  async revokeRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({
      data,
    });
  },

  async findPasswordResetTokenByHash(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  async updatePasswordAndConsumeToken(params: {
    userId: string;
    resetTokenId: string;
    passwordHash: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: params.userId },
        data: { passwordHash: params.passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: params.resetTokenId },
        data: { usedAt: new Date() },
      });

      await tx.refreshToken.updateMany({
        where: { userId: params.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  },
};
