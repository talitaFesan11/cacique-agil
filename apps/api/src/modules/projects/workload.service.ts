import {
  addDays,
  diffDays,
  getDaysBetween,
  isWeekend,
  MemberWorkloadDto,
  ProjectWorkloadSummaryDto,
  startOfDay,
  toIsoDate,
  WorkloadDayBucket,
  WorkspaceRole,
} from '@fluxo/shared';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { ALL_WORKSPACE_ROLES } from '../../middleware/rbac.middleware.js';
import { dependenciesRepository } from '../tasks/dependencies.repository.js';

export class WorkloadService {
  async getProjectWorkload(
    userId: string,
    projectId: string,
    startQuery?: string,
    endQuery?: string,
  ): Promise<ProjectWorkloadSummaryDto> {
    const { project, membership } =
      await dependenciesRepository.findProjectAndMembership(userId, projectId);

    if (!project) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    if (!membership) {
      throw createHttpError(
        403,
        'FORBIDDEN_WORKSPACE_ACCESS',
        'Você não tem acesso a este workspace',
      );
    }

    const role = membership.role as WorkspaceRole;
    if (!ALL_WORKSPACE_ROLES.includes(role)) {
      throw createHttpError(403, 'INSUFFICIENT_ROLE', 'Permissão insuficiente');
    }

    // Intervalo padrão: 14 dias (hoje até hoje + 13 dias)
    const today = startOfDay(new Date());
    const startDate = startQuery ? startOfDay(new Date(startQuery)) : today;
    const endDate = endQuery ? startOfDay(new Date(endQuery)) : addDays(startDate, 13);

    const days = getDaysBetween(startDate, endDate);

    // Carregar membros do workspace
    const workspaceMemberships = await prisma.membership.findMany({
      where: { workspaceId: project.workspaceId },
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

    // Carregar todas as tarefas não concluídas/não deletadas do projeto
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        startDate: true,
        dueDate: true,
        estimateMinutes: true,
        assigneeIds: true,
        progress: true,
      },
    });

    const DAILY_CAPACITY = 480; // 8 horas padrão em minutos

    let unassignedTaskCount = 0;
    let unassignedMinutes = 0;

    for (const t of tasks) {
      if (t.assigneeIds.length === 0) {
        unassignedTaskCount++;
        unassignedMinutes += t.estimateMinutes || 0;
      }
    }

    const members: MemberWorkloadDto[] = workspaceMemberships.map((m) => {
      const memberUser = m.user;
      const assignedTasks = tasks.filter((t) =>
        t.assigneeIds.includes(memberUser.id),
      );

      let totalAllocated = 0;
      let totalCapacity = 0;

      const dayBuckets: WorkloadDayBucket[] = days.map((day) => {
        const dateStr = toIsoDate(day);
        const capacity = isWeekend(day) ? 0 : DAILY_CAPACITY;
        totalCapacity += capacity;

        let allocatedForDay = 0;
        const taskIdsForDay: string[] = [];

        for (const t of assignedTasks) {
          const tStart = t.startDate ? startOfDay(new Date(t.startDate)) : null;
          const tEnd = t.dueDate ? startOfDay(new Date(t.dueDate)) : tStart;

          if (!tStart && !tEnd) continue;

          const spanStart = tStart || tEnd!;
          const spanEnd = tEnd || tStart!;

          if (day >= spanStart && day <= spanEnd) {
            taskIdsForDay.push(t.id);
            const totalSpanDays = Math.max(1, diffDays(spanStart, spanEnd) + 1);
            const taskMinutes = t.estimateMinutes || 120; // default 2h se não estimado
            // Distribuição diária proporcional
            const dailySlice = Math.round(
              taskMinutes / (totalSpanDays * t.assigneeIds.length),
            );
            allocatedForDay += dailySlice;
          }
        }

        totalAllocated += allocatedForDay;

        return {
          date: dateStr,
          allocatedMinutes: allocatedForDay,
          capacityMinutes: capacity,
          isOverallocated: allocatedForDay > capacity,
          taskIds: taskIdsForDay,
        };
      });

      const memberOverallocated = dayBuckets.some((b) => b.isOverallocated);

      return {
        userId: memberUser.id,
        name: memberUser.name,
        email: memberUser.email,
        avatarUrl: memberUser.avatarUrl,
        dailyCapacityMinutes: DAILY_CAPACITY,
        totalAllocatedMinutes: totalAllocated,
        totalCapacityMinutes: totalCapacity,
        isOverallocated: memberOverallocated,
        taskCount: assignedTasks.length,
        days: dayBuckets,
      };
    });

    return {
      projectId: project.id,
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
      members,
      unassignedTaskCount,
      unassignedMinutes,
    };
  }
}

export const workloadService = new WorkloadService();
