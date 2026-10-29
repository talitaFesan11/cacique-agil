import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { DocumentVersionDto } from '@fluxo/shared';

export class VersionsService {
  async checkDocumentAccess(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: docId, deletedAt: null },
      select: { id: true, workspaceId: true, title: true, contentJson: true, yjsState: true },
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

  async getVersions(userId: string, docId: string): Promise<DocumentVersionDto[]> {
    await this.checkDocumentAccess(userId, docId);

    const versions = await prisma.documentVersion.findMany({
      where: { docId },
      orderBy: { versionNumber: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      docId: v.docId,
      versionNumber: v.versionNumber,
      name: v.name,
      contentJson: v.contentJson,
      createdById: v.createdById,
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async createVersion(
    userId: string,
    docId: string,
    name: string,
  ): Promise<DocumentVersionDto> {
    const { doc, membership } = await this.checkDocumentAccess(userId, docId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem criar versões de documentos');
    }

    // Determina próximo número de versão
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { docId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextNumber = (lastVersion?.versionNumber || 0) + 1;

    const created = await prisma.documentVersion.create({
      data: {
        docId,
        versionNumber: nextNumber,
        name: name.trim(),
        contentJson: (doc.contentJson ?? undefined) as Prisma.InputJsonValue,
        yjsState: doc.yjsState,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      id: created.id,
      docId: created.docId,
      versionNumber: created.versionNumber,
      name: created.name,
      contentJson: created.contentJson,
      createdById: created.createdById,
      createdBy: created.createdBy,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async restoreVersion(userId: string, docId: string, versionId: string) {
    const { doc, membership } = await this.checkDocumentAccess(userId, docId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem restaurar versões');
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });
    if (!version || version.docId !== docId) {
      throw createHttpError(404, 'NOT_FOUND', 'Versão não encontrada');
    }

    // Salva versão automática do estado atual antes da restauração
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { docId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const backupNumber = (lastVersion?.versionNumber || 0) + 1;

    await prisma.documentVersion.create({
      data: {
        docId,
        versionNumber: backupNumber,
        name: `Backup antes de restaurar v${version.versionNumber}`,
        contentJson: (doc.contentJson ?? undefined) as Prisma.InputJsonValue,
        yjsState: doc.yjsState,
        createdById: userId,
      },
    });

    // Atualiza documento com o snapshot restaurado
    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        contentJson: (version.contentJson ?? undefined) as Prisma.InputJsonValue,
        yjsState: version.yjsState,
      },
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

    return {
      message: `Versão ${version.versionNumber} restaurada com sucesso`,
      document: {
        id: updated.id,
        workspaceId: updated.workspaceId,
        projectId: updated.projectId,
        parentId: updated.parentId,
        title: updated.title,
        icon: updated.icon,
        contentJson: updated.contentJson,
        isTemplate: updated.isTemplate,
        templateCategory: updated.templateCategory,
        createdById: updated.createdById,
        createdBy: updated.createdBy,
        isFavorite: false,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }
}

export const versionsService = new VersionsService();
