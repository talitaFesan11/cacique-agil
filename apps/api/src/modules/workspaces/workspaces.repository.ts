import { WorkspaceRole } from '@fluxo/shared';
import { prisma } from '../../config/prisma.js';

export const workspacesRepository = {
  async listUserWorkspaces(userId: string) {
    return prisma.membership.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                memberships: true,
                projects: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findWorkspaceBySlug(slug: string) {
    return prisma.workspace.findUnique({
      where: { slug },
    });
  },

  async findWorkspaceById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memberships: true,
            projects: { where: { deletedAt: null } },
          },
        },
      },
    });
  },

  async createWorkspaceWithOwner(data: { name: string; slug: string; ownerId: string }) {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      await tx.membership.create({
        data: {
          userId: data.ownerId,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return workspace;
    });
  },

  async updateWorkspace(id: string, data: { name?: string; slug?: string }) {
    return prisma.workspace.update({
      where: { id },
      data,
    });
  },

  async deleteWorkspace(id: string) {
    return prisma.workspace.delete({
      where: { id },
    });
  },

  async listMembers(workspaceId: string) {
    return prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findMembershipById(memberId: string, workspaceId: string) {
    return prisma.membership.findFirst({
      where: { id: memberId, workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  async findMembershipByUserAndWorkspace(userId: string, workspaceId: string) {
    return prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  },

  async countOwners(workspaceId: string) {
    return prisma.membership.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
      },
    });
  },

  async updateMemberRole(memberId: string, role: WorkspaceRole) {
    return prisma.membership.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  async deleteMember(memberId: string) {
    return prisma.membership.delete({
      where: { id: memberId },
    });
  },

  async createInvite(data: {
    workspaceId: string;
    email: string;
    role: WorkspaceRole;
    token: string;
    invitedById: string;
    expiresAt: Date;
  }) {
    return prisma.workspaceInvite.create({
      data,
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async listInvites(workspaceId: string) {
    return prisma.workspaceInvite.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findInviteByToken(token: string) {
    return prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async acceptInviteTransaction(params: {
    inviteId: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.update({
        where: { id: params.inviteId },
        data: { acceptedAt: new Date() },
      });

      const existing = await tx.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: params.userId,
            workspaceId: params.workspaceId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      return tx.membership.create({
        data: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          role: params.role,
        },
      });
    });
  },
};
