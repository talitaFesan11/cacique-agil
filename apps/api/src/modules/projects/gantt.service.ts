import {
  calculateCPM,
  CPMInputDependency,
  CPMInputTask,
  DependencyType,
  diffDays,
  GanttProjectDataDto,
  GanttTaskItemDto,
  TaskPriority,
  WorkspaceRole,
} from '@fluxo/shared';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { ALL_WORKSPACE_ROLES } from '../../middleware/rbac.middleware.js';
import { dependenciesRepository } from '../tasks/dependencies.repository.js';
import { baselinesRepository } from '../tasks/baselines.repository.js';

export class GanttService {
  async getGanttData(
    userId: string,
    projectId: string,
    baselineId?: string,
  ): Promise<GanttProjectDataDto> {
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

    // Carregar todas as tarefas não deletadas do projeto
    const tasks = await prisma.task.findMany({
      where: { projectId, deletedAt: null },
      include: {
        status: {
          select: {
            id: true,
            name: true,
            category: true,
            color: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { number: 'asc' }],
    });

    // Carregar todas as dependências
    const deps = await dependenciesRepository.listByProject(projectId);

    // Carregar dados de linha de base se solicitado
    const baselineItemsMap = new Map<
      string,
      { startDate: Date | null; dueDate: Date | null }
    >();
    if (baselineId) {
      const baseline = await baselinesRepository.findById(baselineId);
      if (baseline && baseline.projectId === projectId) {
        for (const item of baseline.items) {
          baselineItemsMap.set(item.taskId, {
            startDate: item.startDate ? new Date(item.startDate) : null,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
          });
        }
      }
    }

    // Executar algoritmo CPM
    const cpmTasks: CPMInputTask[] = tasks.map((t) => ({
      id: t.id,
      startDate: t.startDate,
      dueDate: t.dueDate,
      isMilestone: t.isMilestone,
    }));

    const cpmDeps: CPMInputDependency[] = deps.map((d) => ({
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: d.type as DependencyType,
      lagDays: d.lagDays,
    }));

    const cpmResult = calculateCPM(
      cpmTasks,
      cpmDeps,
      project.startDate || undefined,
    );

    // Mapear relacionamentos de dependências por tarefa
    const predecessorsByTaskId = new Map<string, string[]>();
    const successorsByTaskId = new Map<string, string[]>();
    for (const d of deps) {
      const pList = predecessorsByTaskId.get(d.successorId) || [];
      pList.push(d.predecessorId);
      predecessorsByTaskId.set(d.successorId, pList);

      const sList = successorsByTaskId.get(d.predecessorId) || [];
      sList.push(d.successorId);
      successorsByTaskId.set(d.predecessorId, sList);
    }

    // Montar DTO enriquecido
    const taskDtos: GanttTaskItemDto[] = tasks.map((t) => {
      const cpmMetric = cpmResult.metricsByTaskId.get(t.id);
      const isCritical = cpmMetric?.isCritical || false;
      const totalFloat = cpmMetric?.totalFloat;

      const baselineItem = baselineItemsMap.get(t.id);
      let varianceDays: number | null = null;
      if (baselineItem?.dueDate && t.dueDate) {
        // variance: real vs planejado (positivo = atrasado)
        varianceDays = diffDays(new Date(baselineItem.dueDate), new Date(t.dueDate));
      }

      return {
        id: t.id,
        projectId: t.projectId,
        number: t.number,
        key: `${project.key}-${t.number}`,
        title: t.title,
        statusId: t.statusId,
        statusName: t.status.name,
        statusCategory: t.status.category,
        statusColor: t.status.color,
        priority: t.priority as TaskPriority,
        parentId: t.parentId,
        assigneeIds: t.assigneeIds,
        startDate: t.startDate?.toISOString() || null,
        dueDate: t.dueDate?.toISOString() || null,
        estimateMinutes: t.estimateMinutes,
        progress: t.progress,
        isMilestone: t.isMilestone,
        position: t.position,
        baselineStartDate: baselineItem?.startDate?.toISOString() || null,
        baselineDueDate: baselineItem?.dueDate?.toISOString() || null,
        varianceDays,
        isCritical,
        totalFloat,
        predecessorIds: predecessorsByTaskId.get(t.id) || [],
        successorIds: successorsByTaskId.get(t.id) || [],
      };
    });

    const dependencyDtos = deps.map((d) => ({
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: d.type as DependencyType,
      lagDays: d.lagDays,
      createdAt: d.createdAt.toISOString(),
      predecessor: {
        id: d.predecessor.id,
        number: d.predecessor.number,
        key: `${d.predecessor.project.key}-${d.predecessor.number}`,
        title: d.predecessor.title,
        startDate: d.predecessor.startDate?.toISOString() || null,
        dueDate: d.predecessor.dueDate?.toISOString() || null,
        progress: d.predecessor.progress,
      },
      successor: {
        id: d.successor.id,
        number: d.successor.number,
        key: `${d.successor.project.key}-${d.successor.number}`,
        title: d.successor.title,
        startDate: d.successor.startDate?.toISOString() || null,
        dueDate: d.successor.dueDate?.toISOString() || null,
        progress: d.successor.progress,
      },
    }));

    return {
      projectId: project.id,
      projectName: project.name,
      projectStartDate: project.startDate?.toISOString() || null,
      projectDueDate: project.dueDate?.toISOString() || null,
      tasks: taskDtos,
      dependencies: dependencyDtos,
      criticalPathTaskIds: cpmResult.criticalPathTaskIds,
      totalProjectDurationDays: cpmResult.projectDurationDays,
    };
  }
}

export const ganttService = new GanttService();
