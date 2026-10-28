import {
  CreateBaselineRequest,
  ProjectBaselineDto,
  WorkspaceRole,
} from '@fluxo/shared';
import { createHttpError } from '../../middleware/auth.middleware.js';
import {
  ALL_WORKSPACE_ROLES,
  MEMBER_WORKSPACE_ROLES,
} from '../../middleware/rbac.middleware.js';
import { dependenciesRepository } from './dependencies.repository.js';
import { baselinesRepository } from './baselines.repository.js';

export class BaselinesService {
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

  async listBaselines(
    userId: string,
    projectId: string,
  ): Promise<ProjectBaselineDto[]> {
    await this.ensureProjectAccess(userId, projectId, ALL_WORKSPACE_ROLES);
    const baselines = await baselinesRepository.listByProject(projectId);

    return baselines.map((b) => ({
      id: b.id,
      projectId: b.projectId,
      name: b.name,
      description: b.description,
      createdAt: b.createdAt.toISOString(),
      itemCount: b._count.items,
    }));
  }

  async getBaseline(
    userId: string,
    projectId: string,
    baselineId: string,
  ): Promise<ProjectBaselineDto> {
    await this.ensureProjectAccess(userId, projectId, ALL_WORKSPACE_ROLES);
    const baseline = await baselinesRepository.findById(baselineId);

    if (!baseline || baseline.projectId !== projectId) {
      throw createHttpError(
        404,
        'BASELINE_NOT_FOUND',
        'Linha de base não encontrada.',
      );
    }

    return {
      id: baseline.id,
      projectId: baseline.projectId,
      name: baseline.name,
      description: baseline.description,
      createdAt: baseline.createdAt.toISOString(),
      items: baseline.items.map((i) => ({
        id: i.id,
        baselineId: i.baselineId,
        taskId: i.taskId,
        startDate: i.startDate?.toISOString() || null,
        dueDate: i.dueDate?.toISOString() || null,
        createdAt: i.createdAt.toISOString(),
      })),
      itemCount: baseline.items.length,
    };
  }

  async createBaseline(
    userId: string,
    projectId: string,
    input: CreateBaselineRequest,
  ): Promise<ProjectBaselineDto> {
    await this.ensureProjectAccess(userId, projectId, MEMBER_WORKSPACE_ROLES);

    const tasks = await baselinesRepository.findProjectTasksForSnapshot(projectId);

    const created = await baselinesRepository.create({
      projectId,
      name: input.name,
      description: input.description,
      items: tasks.map((t) => ({
        taskId: t.id,
        startDate: t.startDate ? new Date(t.startDate) : null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      })),
    });

    return {
      id: created.id,
      projectId: created.projectId,
      name: created.name,
      description: created.description,
      createdAt: created.createdAt.toISOString(),
      items: created.items.map((i) => ({
        id: i.id,
        baselineId: i.baselineId,
        taskId: i.taskId,
        startDate: i.startDate?.toISOString() || null,
        dueDate: i.dueDate?.toISOString() || null,
        createdAt: i.createdAt.toISOString(),
      })),
      itemCount: created.items.length,
    };
  }

  async deleteBaseline(
    userId: string,
    projectId: string,
    baselineId: string,
  ): Promise<void> {
    await this.ensureProjectAccess(userId, projectId, MEMBER_WORKSPACE_ROLES);

    const baseline = await baselinesRepository.findById(baselineId);
    if (!baseline || baseline.projectId !== projectId) {
      throw createHttpError(
        404,
        'BASELINE_NOT_FOUND',
        'Linha de base não encontrada.',
      );
    }

    await baselinesRepository.delete(baselineId);
  }
}

export const baselinesService = new BaselinesService();
