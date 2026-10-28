import { Prisma, ProjectStatus, StatusCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const projectsRepository = {
  async findWorkspaceByIdOrSlug(identifier: string) {
    return prisma.workspace.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });
  },

  async findMembership(userId: string, workspaceId: string) {
    return prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  },

  async listByWorkspace(workspaceId: string) {
    return prisma.project.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      include: {
        statuses: {
          orderBy: { position: 'asc' },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            statusId: true,
            progress: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        statuses: {
          orderBy: { position: 'asc' },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            statusId: true,
            progress: true,
          },
        },
      },
    });
  },

  async findByKey(workspaceId: string, key: string) {
    return prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key,
        },
      },
    });
  },

  async createWithDefaultStatuses(data: {
    workspaceId: string;
    name: string;
    key: string;
    description?: string | null;
    status: ProjectStatus;
    color?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    ownerId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId: data.workspaceId,
          name: data.name,
          key: data.key,
          description: data.description ?? null,
          status: data.status,
          color: data.color ?? '#2563EB',
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          ownerId: data.ownerId,
        },
      });

      const statusTodo = await tx.workflowStatus.create({
        data: {
          projectId: project.id,
          name: 'A Fazer',
          category: StatusCategory.TODO,
          position: 1000,
          color: '#64748B',
        },
      });

      const statusInProgress = await tx.workflowStatus.create({
        data: {
          projectId: project.id,
          name: 'Em Andamento',
          category: StatusCategory.IN_PROGRESS,
          position: 2000,
          wipLimit: 5,
          color: '#F59E0B',
        },
      });

      const statusDone = await tx.workflowStatus.create({
        data: {
          projectId: project.id,
          name: 'Concluído',
          category: StatusCategory.DONE,
          position: 3000,
          color: '#10B981',
        },
      });

      return {
        ...project,
        statuses: [statusTodo, statusInProgress, statusDone],
      };
    });
  },

  async update(
    projectId: string,
    data: {
      name?: string;
      description?: string | null;
      status?: ProjectStatus;
      color?: string | null;
      startDate?: Date | null;
      dueDate?: Date | null;
    },
  ) {
    return prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        statuses: {
          orderBy: { position: 'asc' },
        },
      },
    });
  },

  async softDelete(projectId: string) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { projectId, deletedAt: null },
        data: { deletedAt: now },
      });

      return tx.project.update({
        where: { id: projectId },
        data: { deletedAt: now },
      });
    });
  },

  async listStatuses(projectId: string) {
    return prisma.workflowStatus.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  },

  async createStatus(data: {
    projectId: string;
    name: string;
    category: StatusCategory;
    position: number;
    wipLimit?: number | null;
    color?: string | null;
  }) {
    return prisma.workflowStatus.create({
      data,
    });
  },

  async findStatusById(statusId: string) {
    return prisma.workflowStatus.findUnique({
      where: { id: statusId },
      include: {
        project: {
          select: {
            id: true,
            workspaceId: true,
            deletedAt: true,
          },
        },
      },
    });
  },

  async countTasksByStatus(statusId: string) {
    return prisma.task.count({
      where: {
        statusId,
        deletedAt: null,
      },
    });
  },

  async updateStatus(
    statusId: string,
    data: {
      name?: string;
      category?: StatusCategory;
      position?: number;
      wipLimit?: number | null;
      color?: string | null;
    },
  ) {
    return prisma.workflowStatus.update({
      where: { id: statusId },
      data,
    });
  },

  async deleteStatus(statusId: string) {
    return prisma.workflowStatus.delete({
      where: { id: statusId },
    });
  },

  async reorderStatuses(projectId: string, statusIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const updates = statusIds.map((id, index) =>
        tx.workflowStatus.update({
          where: { id },
          data: { position: (index + 1) * 1000 },
        }),
      );
      await Promise.all(updates);
      return tx.workflowStatus.findMany({
        where: { projectId },
        orderBy: { position: 'asc' },
      });
    });
  },

  // Visões Salvas (SavedViews)
  async listSavedViews(projectId: string, userId: string) {
    return prisma.savedView.findMany({
      where: {
        projectId,
        OR: [{ ownerId: userId }, { shared: true }],
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findSavedViewById(viewId: string) {
    return prisma.savedView.findUnique({
      where: { id: viewId },
      include: {
        project: {
          select: { id: true, workspaceId: true },
        },
      },
    });
  },

  async createSavedView(data: {
    projectId: string;
    ownerId: string;
    type: string;
    name: string;
    config: Prisma.InputJsonValue;
    shared: boolean;
  }) {
    return prisma.savedView.create({
      data,
    });
  },

  async deleteSavedView(viewId: string) {
    return prisma.savedView.delete({
      where: { id: viewId },
    });
  },

  // Etiquetas do Workspace (Labels)
  async listLabelsByWorkspace(workspaceId: string) {
    return prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  },

  async findLabelById(labelId: string) {
    return prisma.label.findUnique({
      where: { id: labelId },
    });
  },

  async findLabelByName(workspaceId: string, name: string) {
    return prisma.label.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
    });
  },

  async createLabel(data: { workspaceId: string; name: string; color: string }) {
    return prisma.label.create({
      data,
    });
  },

  async deleteLabel(labelId: string) {
    return prisma.label.delete({
      where: { id: labelId },
    });
  },
};
