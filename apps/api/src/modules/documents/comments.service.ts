import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { CreateDocumentCommentRequest, DocumentCommentDto, UpdateDocumentCommentRequest } from '@fluxo/shared';

export class CommentsService {
  async checkDocumentAccess(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: docId, deletedAt: null },
      select: { id: true, workspaceId: true },
    });
    if (!doc) {
      throw createHttpError(404, 'NOT_FOUND', 'Documento não encontrado');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: doc.workspaceId },
      },
    });
    if (!membership) {
      throw createHttpError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este documento');
    }

    return { doc, membership };
  }

  async getComments(userId: string, docId: string): Promise<DocumentCommentDto[]> {
    await this.checkDocumentAccess(userId, docId);

    const comments = await prisma.comment.findMany({
      where: { docId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      docId: c.docId!,
      authorId: c.authorId,
      author: c.author,
      body: c.body,
      selectedText: c.selectedText,
      resolvedAt: c.resolvedAt?.toISOString() || null,
      resolvedById: c.resolvedById,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createComment(
    userId: string,
    docId: string,
    data: CreateDocumentCommentRequest,
  ): Promise<DocumentCommentDto> {
    await this.checkDocumentAccess(userId, docId);

    const comment = await prisma.comment.create({
      data: {
        docId,
        authorId: userId,
        body: (typeof data.body === 'string'
          ? { text: data.body }
          : data.body) as Prisma.InputJsonValue,
        selectedText: data.selectedText || null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      id: comment.id,
      docId: comment.docId!,
      authorId: comment.authorId,
      author: comment.author,
      body: comment.body,
      selectedText: comment.selectedText,
      resolvedAt: comment.resolvedAt?.toISOString() || null,
      resolvedById: comment.resolvedById,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  async updateComment(
    userId: string,
    commentId: string,
    data: UpdateDocumentCommentRequest,
  ): Promise<DocumentCommentDto> {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: { select: { workspaceId: true } },
      },
    });
    if (!existing || !existing.docId) {
      throw createHttpError(404, 'NOT_FOUND', 'Comentário não encontrado');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: existing.document!.workspaceId },
      },
    });
    if (!membership) {
      throw createHttpError(403, 'FORBIDDEN', 'Sem permissão');
    }

    const updateData: {
      body?: Prisma.InputJsonValue;
      resolvedAt?: Date | null;
      resolvedById?: string | null;
    } = {};
    if (data.body !== undefined) {
      if (existing.authorId !== userId && membership.role === 'MEMBER') {
        throw createHttpError(403, 'FORBIDDEN', 'Apenas o autor pode editar o texto do comentário');
      }
      updateData.body = (typeof data.body === 'string'
        ? { text: data.body }
        : data.body) as Prisma.InputJsonValue;
    }

    if (data.resolved !== undefined) {
      updateData.resolvedAt = data.resolved ? new Date() : null;
      updateData.resolvedById = data.resolved ? userId : null;
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      id: updated.id,
      docId: updated.docId!,
      authorId: updated.authorId,
      author: updated.author,
      body: updated.body,
      selectedText: updated.selectedText,
      resolvedAt: updated.resolvedAt?.toISOString() || null,
      resolvedById: updated.resolvedById,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: { select: { workspaceId: true } },
      },
    });
    if (!existing || !existing.docId) {
      throw createHttpError(404, 'NOT_FOUND', 'Comentário não encontrado');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: existing.document!.workspaceId },
      },
    });
    if (!membership) {
      throw createHttpError(403, 'FORBIDDEN', 'Sem permissão');
    }

    if (existing.authorId !== userId && membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw createHttpError(403, 'FORBIDDEN', 'Você só pode excluir seus próprios comentários');
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }
}

export const commentsService = new CommentsService();
