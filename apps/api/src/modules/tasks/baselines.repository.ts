import { prisma } from '../../config/prisma.js';

export class BaselinesRepository {
  async listByProject(projectId: string) {
    return prisma.projectBaseline.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.projectBaseline.findUnique({
      where: { id },
      include: {
        items: true,
        project: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });
  }

  async create(data: {
    projectId: string;
    name: string;
    description?: string;
    items: Array<{
      taskId: string;
      startDate: Date | null;
      dueDate: Date | null;
    }>;
  }) {
    return prisma.projectBaseline.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        items: {
          create: data.items.map((i) => ({
            taskId: i.taskId,
            startDate: i.startDate,
            dueDate: i.dueDate,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.projectBaseline.delete({
      where: { id },
    });
  }

  async findProjectTasksForSnapshot(projectId: string) {
    return prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: {
        id: true,
        startDate: true,
        dueDate: true,
      },
    });
  }
}

export const baselinesRepository = new BaselinesRepository();
