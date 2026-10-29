import { prisma } from '../../config/prisma.js';
import { Prisma } from '@prisma/client';

export class DocumentsRepository {
  async findById(id: string) {
    return prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: {
            children: { where: { deletedAt: null } },
            comments: true,
          },
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

    const where: Prisma.DocumentWhereInput = {
      workspaceId,
      deletedAt: null,
    };

    if (projectId !== undefined) {
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

    return prisma.document.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: {
            children: { where: { deletedAt: null } },
            comments: true,
          },
        },
      },
    });
  }

  async findTreeByWorkspace(workspaceId: string, projectId?: string | null) {
    const where: Prisma.DocumentWhereInput = {
      workspaceId,
      isTemplate: false,
      deletedAt: null,
    };

    if (projectId !== undefined) {
      where.projectId = projectId;
    }

    return prisma.document.findMany({
      where,
      orderBy: [{ title: 'asc' }],
      select: {
        id: true,
        workspaceId: true,
        projectId: true,
        parentId: true,
        title: true,
        icon: true,
        isTemplate: true,
        templateCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: {
            children: { where: { deletedAt: null } },
            comments: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.DocumentUpdateInput) {
    return prisma.document.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: {
            children: { where: { deletedAt: null } },
            comments: true,
          },
        },
      },
    });
  }

  async softDelete(id: string) {
    return prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async isFavorite(userId: string, docId: string) {
    const fav = await prisma.documentFavorite.findUnique({
      where: {
        userId_docId: { userId, docId },
      },
    });
    return Boolean(fav);
  }

  async getUserFavorites(userId: string, workspaceId: string) {
    const favorites = await prisma.documentFavorite.findMany({
      where: {
        userId,
        document: {
          workspaceId,
          deletedAt: null,
        },
      },
      select: { docId: true },
    });
    return new Set(favorites.map((f) => f.docId));
  }

  async setFavorite(userId: string, docId: string) {
    return prisma.documentFavorite.upsert({
      where: {
        userId_docId: { userId, docId },
      },
      create: { userId, docId },
      update: {},
    });
  }

  async removeFavorite(userId: string, docId: string) {
    return prisma.documentFavorite.deleteMany({
      where: { userId, docId },
    });
  }

  async countDescendants(parentId: string): Promise<number> {
    const children = await prisma.document.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true },
    });
    let count = children.length;
    for (const child of children) {
      count += await this.countDescendants(child.id);
    }
    return count;
  }
}

export const documentsRepository = new DocumentsRepository();
