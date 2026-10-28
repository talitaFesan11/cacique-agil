import { Prisma, TaskPriority } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const tasksRepository = {
  async findProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        statuses: {
          orderBy: { position: 'asc' },
        },
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

  async listByProject(projectId: string) {
    return prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, key: true, workspaceId: true },
        },
        status: true,
        labels: {
          include: {
            label: true,
          },
        },
        checklists: {
          include: {
            items: {
              orderBy: { position: 'asc' },
            },
          },
        },
        subtasks: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
        },
        comments: {
          select: { id: true },
        },
        attachments: {
          select: { id: true },
        },
      },
      orderBy: [{ position: 'asc' }, { number: 'asc' }],
    });
  },

  async findById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, key: true, workspaceId: true },
        },
        status: true,
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
        },
        checklists: {
          include: {
            items: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async findManyByIds(taskIds: string[]) {
    return prisma.task.findMany({
      where: {
        id: { in: taskIds },
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, key: true, workspaceId: true },
        },
      },
    });
  },

  async getNextNumberAndPosition(projectId: string, statusId: string) {
    const existingTasks = await prisma.task.findMany({
      where: { projectId },
      select: { number: true, statusId: true, position: true, deletedAt: true },
    });

    const maxNumber = existingTasks.reduce((max, t) => Math.max(max, t.number), 0);
    const maxPos = existingTasks
      .filter((t) => t.statusId === statusId)
      .reduce((max, t) => Math.max(max, t.position), 0);

    return {
      nextNumber: maxNumber + 1,
      nextPosition: maxPos + 1000,
    };
  },

  async create(data: {
    projectId: string;
    number: number;
    title: string;
    description?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    statusId: string;
    priority: TaskPriority;
    parentId?: string | null;
    assigneeIds: string[];
    startDate?: Date | null;
    dueDate?: Date | null;
    estimateMinutes?: number | null;
    progress: number;
    isMilestone: boolean;
    position: number;
    labelIds?: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          projectId: data.projectId,
          number: data.number,
          title: data.title,
          description: data.description,
          statusId: data.statusId,
          priority: data.priority,
          parentId: data.parentId ?? null,
          assigneeIds: data.assigneeIds,
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          estimateMinutes: data.estimateMinutes ?? null,
          progress: data.progress,
          isMilestone: data.isMilestone,
          position: data.position,
        },
      });

      if (data.labelIds && data.labelIds.length > 0) {
        for (const labelId of data.labelIds) {
          await tx.taskLabel.create({
            data: {
              taskId: created.id,
              labelId,
            },
          });
        }
      }

      return created;
    });
  },

  async update(
    taskId: string,
    data: {
      title?: string;
      description?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
      statusId?: string;
      priority?: TaskPriority;
      parentId?: string | null;
      assigneeIds?: string[];
      startDate?: Date | null;
      dueDate?: Date | null;
      estimateMinutes?: number | null;
      progress?: number;
      isMilestone?: boolean;
      position?: number;
    },
  ) {
    return prisma.task.update({
      where: { id: taskId },
      data,
    });
  },

  async softDelete(taskId: string) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { parentId: taskId, deletedAt: null },
        data: { deletedAt: now },
      });

      return tx.task.update({
        where: { id: taskId },
        data: { deletedAt: now },
      });
    });
  },

  async bulkUpdate(
    taskIds: string[],
    data: {
      statusId?: string;
      priority?: TaskPriority;
      assigneeIds?: string[];
      deletedAt?: Date;
    },
  ) {
    return prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data,
    });
  },

  // Etiquetas da Tarefa (TaskLabel)
  async findLabelById(labelId: string) {
    return prisma.label.findUnique({
      where: { id: labelId },
    });
  },

  async attachLabel(taskId: string, labelId: string) {
    const existing = await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: { taskId, labelId },
      },
    });
    if (existing) return existing;

    return prisma.taskLabel.create({
      data: { taskId, labelId },
    });
  },

  async detachLabel(taskId: string, labelId: string) {
    return prisma.taskLabel.delete({
      where: {
        taskId_labelId: { taskId, labelId },
      },
    });
  },

  // Checklists
  async createChecklist(taskId: string, title: string) {
    return prisma.checklist.create({
      data: { taskId, title },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  },

  async findChecklistById(checklistId: string) {
    return prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        task: {
          include: {
            project: { select: { id: true, workspaceId: true } },
          },
        },
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  },

  async deleteChecklist(checklistId: string) {
    return prisma.checklist.delete({
      where: { id: checklistId },
    });
  },

  async createChecklistItem(data: {
    checklistId: string;
    text: string;
    position: number;
  }) {
    return prisma.checklistItem.create({
      data: {
        checklistId: data.checklistId,
        text: data.text,
        done: false,
        position: data.position,
      },
    });
  },

  async findChecklistItemById(itemId: string) {
    return prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            task: {
              include: {
                project: { select: { id: true, workspaceId: true } },
              },
            },
          },
        },
      },
    });
  },

  async updateChecklistItem(
    itemId: string,
    data: { text?: string; done?: boolean; position?: number },
  ) {
    return prisma.checklistItem.update({
      where: { id: itemId },
      data,
    });
  },

  async deleteChecklistItem(itemId: string) {
    return prisma.checklistItem.delete({
      where: { id: itemId },
    });
  },

  // Comentários
  async listCommentsByTask(taskId: string) {
    return prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
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

  async createComment(data: {
    taskId: string;
    authorId: string;
    body: Prisma.InputJsonValue;
  }) {
    return prisma.comment.create({
      data,
      include: {
        author: {
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

  async findCommentById(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: { select: { id: true, workspaceId: true } },
          },
        },
      },
    });
  },

  async deleteComment(commentId: string) {
    return prisma.comment.delete({
      where: { id: commentId },
    });
  },

  // Anexos
  async listAttachmentsByTask(taskId: string) {
    return prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createAttachment(data: {
    taskId: string;
    fileName: string;
    mimeType: string;
    size: number;
    storageKey: string;
  }) {
    return prisma.attachment.create({
      data,
    });
  },

  async findAttachmentById(attachmentId: string) {
    return prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: {
            project: { select: { id: true, workspaceId: true } },
          },
        },
      },
    });
  },

  async deleteAttachment(attachmentId: string) {
    return prisma.attachment.delete({
      where: { id: attachmentId },
    });
  },
};
