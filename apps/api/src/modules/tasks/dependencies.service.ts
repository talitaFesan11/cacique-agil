import {
  CreateTaskDependencyRequest,
  DependencyType,
  detectDependencyCycle,
  TaskDependencyDto,
  WorkspaceRole,
  addDays,
  diffDays,
} from '@fluxo/shared';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import {
  ALL_WORKSPACE_ROLES,
  MEMBER_WORKSPACE_ROLES,
} from '../../middleware/rbac.middleware.js';
import { socketEmitter } from '../../realtime/socket.emitter.js';
import { dependenciesRepository } from './dependencies.repository.js';

export class DependenciesService {
  private async ensureProjectAccess(
    userId: string,
    projectId: string,
    allowedRoles: WorkspaceRole[] = ALL_WORKSPACE_ROLES,
  ) {
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
    if (!allowedRoles.includes(role)) {
      throw createHttpError(
        403,
        'INSUFFICIENT_ROLE',
        `Esta ação requer um dos seguintes papéis: ${allowedRoles.join(', ')}`,
      );
    }

    return { project, role };
  }

  async listDependencies(userId: string, projectId: string): Promise<TaskDependencyDto[]> {
    await this.ensureProjectAccess(userId, projectId, ALL_WORKSPACE_ROLES);
    const deps = await dependenciesRepository.listByProject(projectId);

    return deps.map((d) => ({
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
  }

  async createDependency(
    userId: string,
    projectId: string,
    input: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyDto> {
    await this.ensureProjectAccess(userId, projectId, MEMBER_WORKSPACE_ROLES);

    if (input.predecessorId === input.successorId) {
      throw createHttpError(
        422,
        'SELF_DEPENDENCY_NOT_ALLOWED',
        'Uma tarefa não pode depender de si mesma.',
      );
    }

    // Verificar se ambas as tarefas pertencem ao projeto
    const [pred, succ] = await Promise.all([
      dependenciesRepository.findTaskInProject(input.predecessorId, projectId),
      dependenciesRepository.findTaskInProject(input.successorId, projectId),
    ]);

    if (!pred || !succ) {
      throw createHttpError(
        404,
        'TASK_NOT_FOUND',
        'Tarefa predecessora ou sucessora não encontrada no projeto.',
      );
    }

    // Verificar se já existe dependência
    const existingEdge = await dependenciesRepository.findEdge(
      input.predecessorId,
      input.successorId,
    );
    if (existingEdge) {
      throw createHttpError(
        409,
        'DEPENDENCY_ALREADY_EXISTS',
        'Esta dependência já existe.',
      );
    }

    // Detecção de Ciclo no Grafo de Tarefas
    const existingEdges = await dependenciesRepository.listProjectEdges(projectId);
    const cycleCheck = detectDependencyCycle(existingEdges, {
      predecessorId: input.predecessorId,
      successorId: input.successorId,
    });

    if (cycleCheck.hasCycle) {
      throw createHttpError(
        422,
        'DEPENDENCY_CYCLE_DETECTED',
        cycleCheck.message ||
          'A dependência criaria um ciclo no grafo e não pôde ser adicionada.',
      );
    }

    const created = await dependenciesRepository.create({
      predecessorId: input.predecessorId,
      successorId: input.successorId,
      type: input.type,
      lagDays: input.lagDays,
    });

    socketEmitter.emitToProject(projectId, 'task.updated', {
      id: succ.id,
      title: succ.title,
      statusId: succ.statusId,
      priority: succ.priority,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: created.id,
      predecessorId: created.predecessorId,
      successorId: created.successorId,
      type: created.type as DependencyType,
      lagDays: created.lagDays,
      createdAt: created.createdAt.toISOString(),
      predecessor: {
        id: created.predecessor.id,
        number: created.predecessor.number,
        key: `${created.predecessor.project.key}-${created.predecessor.number}`,
        title: created.predecessor.title,
        startDate: created.predecessor.startDate?.toISOString() || null,
        dueDate: created.predecessor.dueDate?.toISOString() || null,
        progress: created.predecessor.progress,
      },
      successor: {
        id: created.successor.id,
        number: created.successor.number,
        key: `${created.successor.project.key}-${created.successor.number}`,
        title: created.successor.title,
        startDate: created.successor.startDate?.toISOString() || null,
        dueDate: created.successor.dueDate?.toISOString() || null,
        progress: created.successor.progress,
      },
    };
  }

  async deleteDependency(
    userId: string,
    projectId: string,
    dependencyId: string,
  ): Promise<void> {
    await this.ensureProjectAccess(userId, projectId, MEMBER_WORKSPACE_ROLES);

    const dep = await dependenciesRepository.findById(dependencyId);
    if (!dep) {
      throw createHttpError(
        404,
        'DEPENDENCY_NOT_FOUND',
        'Dependência não encontrada.',
      );
    }

    if (
      dep.predecessor.projectId !== projectId ||
      dep.successor.projectId !== projectId
    ) {
      throw createHttpError(
        403,
        'FORBIDDEN_PROJECT_ACCESS',
        'Dependência não pertence ao projeto indicado.',
      );
    }

    await dependenciesRepository.delete(dependencyId);
  }

  /**
   * Reagenda tarefas sucessoras em cadeia respeitando suas dependências e lagDays.
   */
  async autoReschedule(
    userId: string,
    projectId: string,
  ): Promise<{ updatedCount: number; affectedTaskIds: string[] }> {
    await this.ensureProjectAccess(userId, projectId, MEMBER_WORKSPACE_ROLES);

    const tasks = await prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: {
        id: true,
        startDate: true,
        dueDate: true,
        isMilestone: true,
      },
    });

    const deps = await dependenciesRepository.listByProject(projectId);
    if (deps.length === 0) {
      return { updatedCount: 0, affectedTaskIds: [] };
    }

    const taskMap = new Map(
      tasks.map((t) => [
        t.id,
        {
          startDate: t.startDate ? new Date(t.startDate) : null,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          durationDays:
            t.startDate && t.dueDate
              ? Math.max(1, diffDays(new Date(t.startDate), new Date(t.dueDate)) + 1)
              : 1,
          isMilestone: t.isMilestone,
        },
      ]),
    );

    const affectedIds = new Set<string>();

    // Passar pelas dependências e ajustar sucessores se necessário
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = tasks.length + 5;

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false;
      iterations++;

      for (const dep of deps) {
        const pred = taskMap.get(dep.predecessorId);
        const succ = taskMap.get(dep.successorId);
        if (!pred || !succ || !pred.dueDate) continue;

        const lag = dep.lagDays || 0;
        let requiredSuccStart: Date | null = null;

        if (dep.type === DependencyType.FS) {
          // Finish-to-Start: succ Start >= pred Due + lag + 1
          const minDate = addDays(pred.dueDate, lag + 1);
          if (!succ.startDate || succ.startDate < minDate) {
            requiredSuccStart = minDate;
          }
        } else if (dep.type === DependencyType.SS && pred.startDate) {
          // Start-to-Start: succ Start >= pred Start + lag
          const minDate = addDays(pred.startDate, lag);
          if (!succ.startDate || succ.startDate < minDate) {
            requiredSuccStart = minDate;
          }
        }

        if (requiredSuccStart) {
          const shiftDays = succ.startDate
            ? diffDays(succ.startDate, requiredSuccStart)
            : 0;

          succ.startDate = requiredSuccStart;
          if (succ.isMilestone) {
            succ.dueDate = requiredSuccStart;
          } else if (succ.dueDate) {
            succ.dueDate = addDays(succ.dueDate, shiftDays);
          } else {
            succ.dueDate = addDays(requiredSuccStart, succ.durationDays - 1);
          }

          affectedIds.add(dep.successorId);
          changed = true;
        }
      }
    }

    // Persistir tarefas modificadas
    const affectedArray = Array.from(affectedIds);
    if (affectedArray.length > 0) {
      await prisma.$transaction(
        affectedArray.map((id) => {
          const t = taskMap.get(id)!;
          return prisma.task.update({
            where: { id },
            data: {
              startDate: t.startDate,
              dueDate: t.dueDate,
            },
          });
        }),
      );
    }

    return {
      updatedCount: affectedArray.length,
      affectedTaskIds: affectedArray,
    };
  }
}

export const dependenciesService = new DependenciesService();
