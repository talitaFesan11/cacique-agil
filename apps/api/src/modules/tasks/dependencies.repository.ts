import { DependencyType } from '@fluxo/shared';
import { prisma } from '../../config/prisma.js';

export class DependenciesRepository {
  async listByProject(projectId: string) {
    return prisma.taskDependency.findMany({
      where: {
        predecessor: { projectId, deletedAt: null },
        successor: { projectId, deletedAt: null },
      },
      include: {
        predecessor: {
          select: {
            id: true,
            number: true,
            title: true,
            startDate: true,
            dueDate: true,
            progress: true,
            project: { select: { key: true } },
          },
        },
        successor: {
          select: {
            id: true,
            number: true,
            title: true,
            startDate: true,
            dueDate: true,
            progress: true,
            project: { select: { key: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listProjectEdges(projectId: string) {
    return prisma.taskDependency.findMany({
      where: {
        predecessor: { projectId, deletedAt: null },
        successor: { projectId, deletedAt: null },
      },
      select: {
        id: true,
        predecessorId: true,
        successorId: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.taskDependency.findUnique({
      where: { id },
      include: {
        predecessor: { select: { id: true, projectId: true } },
        successor: { select: { id: true, projectId: true } },
      },
    });
  }

  async findEdge(predecessorId: string, successorId: string) {
    return prisma.taskDependency.findUnique({
      where: {
        predecessorId_successorId: {
          predecessorId,
          successorId,
        },
      },
    });
  }

  async create(data: {
    predecessorId: string;
    successorId: string;
    type: DependencyType;
    lagDays: number;
  }) {
    return prisma.taskDependency.create({
      data,
      include: {
        predecessor: {
          select: {
            id: true,
            number: true,
            title: true,
            startDate: true,
            dueDate: true,
            progress: true,
            project: { select: { key: true } },
          },
        },
        successor: {
          select: {
            id: true,
            number: true,
            title: true,
            startDate: true,
            dueDate: true,
            progress: true,
            project: { select: { key: true } },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.taskDependency.delete({
      where: { id },
    });
  }

  async findProjectAndMembership(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        key: true,
        startDate: true,
        dueDate: true,
      },
    });

    if (!project) return { project: null, membership: null };

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    return { project, membership };
  }

  async findTaskInProject(taskId: string, projectId: string) {
    return prisma.task.findFirst({
      where: { id: taskId, projectId, deletedAt: null },
    });
  }
}

export const dependenciesRepository = new DependenciesRepository();
