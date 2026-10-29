import { prisma } from '../../config/prisma.js';
import { Prisma } from '@prisma/client';

export class WhiteboardsRepository {
  async findById(id: string) {
    return prisma.whiteboard.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    });
  }

  async findByWorkspace(params: {
    workspaceId: string;
    projectId?: string | null;
    isTemplate?: boolean;
    search?: string;
  }) {
    const { workspaceId, projectId, isTemplate, search } = params;

    const where: Prisma.WhiteboardWhereInput = {
      workspaceId,
      deletedAt: null,
    };

    if (projectId !== undefined && projectId !== null) {
      where.projectId = projectId;
    }

    if (isTemplate !== undefined) {
      where.isTemplate = isTemplate;
    }

    if (search && search.trim()) {
      where.title = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    return prisma.whiteboard.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    });
  }

  async create(data: Prisma.WhiteboardCreateInput) {
    return prisma.whiteboard.create({
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.WhiteboardUpdateInput) {
    return prisma.whiteboard.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    });
  }

  async softDelete(id: string) {
    return prisma.whiteboard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Entity Links (Whiteboard <-> Tasks)
  async findLinksByWhiteboard(whiteboardId: string) {
    return prisma.entityLink.findMany({
      where: {
        fromType: 'whiteboard',
        fromId: whiteboardId,
        toType: 'task',
      },
    });
  }

  async createEntityLink(params: {
    workspaceId: string;
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
  }) {
    return prisma.entityLink.create({
      data: params,
    });
  }

  async deleteEntityLink(params: {
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
  }) {
    return prisma.entityLink.deleteMany({
      where: params,
    });
  }
}

export const whiteboardsRepository = new WhiteboardsRepository();
