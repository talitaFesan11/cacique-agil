import {
  CreateLabelRequest,
  CreateProjectRequest,
  CreateSavedViewRequest,
  CreateWorkflowStatusRequest,
  ProjectDto,
  ProjectStatus,
  SavedViewConfigDto,
  StatusCategory,
  UpdateProjectRequest,
  UpdateWorkflowStatusRequest,
  WorkflowStatusDto,
  WorkspaceRole,
} from '@fluxo/shared';
import { Prisma } from '@prisma/client';
import { createHttpError } from '../../middleware/auth.middleware.js';
import {
  ALL_WORKSPACE_ROLES,
  MEMBER_WORKSPACE_ROLES,
} from '../../middleware/rbac.middleware.js';
import { socketEmitter } from '../../realtime/socket.emitter.js';
import { projectsRepository } from './projects.repository.js';

async function verifyWorkspaceAccess(
  userId: string,
  workspaceIdOrSlug: string,
  allowedRoles: WorkspaceRole[] = ALL_WORKSPACE_ROLES,
) {
  const workspace = await projectsRepository.findWorkspaceByIdOrSlug(workspaceIdOrSlug);
  if (!workspace) {
    throw createHttpError(
      403,
      'FORBIDDEN_WORKSPACE_ACCESS',
      'Você não tem permissão para acessar este workspace',
    );
  }

  const membership = await projectsRepository.findMembership(userId, workspace.id);
  if (!membership) {
    throw createHttpError(
      403,
      'FORBIDDEN_WORKSPACE_ACCESS',
      'Você não pertence a este workspace',
    );
  }

  const userRole = membership.role as WorkspaceRole;
  if (!allowedRoles.includes(userRole)) {
    throw createHttpError(
      403,
      'INSUFFICIENT_ROLE',
      `Esta ação requer um dos seguintes papéis: ${allowedRoles.join(', ')}`,
    );
  }

  return { workspaceId: workspace.id, role: userRole };
}

function mapProjectToDto(project: {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  color: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  ownerId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  statuses?: Array<{
    id: string;
    projectId: string;
    name: string;
    category: string;
    position: number;
    wipLimit: number | null;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tasks?: Array<{
    id: string;
    statusId: string;
    progress: number;
  }>;
}): ProjectDto {
  const doneStatusIds = new Set(
    (project.statuses || [])
      .filter((s) => s.category === StatusCategory.DONE)
      .map((s) => s.id),
  );

  const tasks = project.tasks || [];
  const completedTaskCount = tasks.filter(
    (t) => doneStatusIds.has(t.statusId) || t.progress === 100,
  ).length;

  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    key: project.key,
    description: project.description,
    status: project.status as ProjectStatus,
    color: project.color,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    ownerId: project.ownerId,
    deletedAt: project.deletedAt ? project.deletedAt.toISOString() : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    taskCount: tasks.length,
    completedTaskCount,
    statuses: project.statuses?.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      category: s.category as StatusCategory,
      position: s.position,
      wipLimit: s.wipLimit,
      color: s.color,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}

export const projectsService = {
  async listProjects(userId: string, workspaceIdOrSlug: string) {
    const { workspaceId } = await verifyWorkspaceAccess(
      userId,
      workspaceIdOrSlug,
      ALL_WORKSPACE_ROLES,
    );

    const projects = await projectsRepository.listByWorkspace(workspaceId);
    return projects.map(mapProjectToDto);
  },

  async createProject(userId: string, input: CreateProjectRequest) {
    const { workspaceId } = await verifyWorkspaceAccess(
      userId,
      input.workspaceId,
      MEMBER_WORKSPACE_ROLES,
    );

    const normalizedKey = input.key.trim().toUpperCase();
    const existing = await projectsRepository.findByKey(workspaceId, normalizedKey);
    if (existing) {
      throw createHttpError(
        409,
        'PROJECT_KEY_ALREADY_EXISTS',
        `Já existe um projeto com a chave ${normalizedKey} neste workspace`,
      );
    }

    const project = await projectsRepository.createWithDefaultStatuses({
      workspaceId,
      name: input.name,
      key: normalizedKey,
      description: input.description ?? null,
      status: input.status,
      color: input.color ?? '#2563EB',
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      ownerId: userId,
    });

    return mapProjectToDto({ ...project, tasks: [] });
  },

  async getProjectById(userId: string, projectId: string) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, ALL_WORKSPACE_ROLES);
    return mapProjectToDto(project);
  },

  async updateProject(userId: string, projectId: string, input: UpdateProjectRequest) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const updated = await projectsRepository.update(projectId, {
      name: input.name,
      description: input.description !== undefined ? input.description : undefined,
      status: input.status,
      color: input.color !== undefined ? input.color : undefined,
      startDate:
        input.startDate !== undefined
          ? input.startDate
            ? new Date(input.startDate)
            : null
          : undefined,
      dueDate:
        input.dueDate !== undefined
          ? input.dueDate
            ? new Date(input.dueDate)
            : null
          : undefined,
    });

    return mapProjectToDto({ ...updated, tasks: project.tasks });
  },

  async deleteProject(userId: string, projectId: string) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);
    await projectsRepository.softDelete(projectId);

    return { message: 'Projeto excluído com sucesso' };
  },

  async listStatuses(userId: string, projectId: string) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, ALL_WORKSPACE_ROLES);

    const statuses = await projectsRepository.listStatuses(projectId);
    return statuses.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      category: s.category as StatusCategory,
      position: s.position,
      wipLimit: s.wipLimit,
      color: s.color,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  },

  async createStatus(
    userId: string,
    projectId: string,
    input: CreateWorkflowStatusRequest,
  ) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const existingStatuses = await projectsRepository.listStatuses(projectId);
    const maxPosition = existingStatuses.reduce((max, s) => Math.max(max, s.position), 0);
    const position = input.position ?? maxPosition + 1000;

    const created = await projectsRepository.createStatus({
      projectId,
      name: input.name,
      category: input.category,
      position,
      wipLimit: input.wipLimit ?? null,
      color: input.color ?? '#64748B',
    });

    const statusDto: WorkflowStatusDto = {
      id: created.id,
      projectId: created.projectId,
      name: created.name,
      category: created.category as StatusCategory,
      position: created.position,
      wipLimit: created.wipLimit,
      color: created.color,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    socketEmitter.statusCreated(projectId, statusDto);

    return statusDto;
  },

  async updateStatus(
    userId: string,
    projectId: string,
    statusId: string,
    input: UpdateWorkflowStatusRequest,
  ): Promise<WorkflowStatusDto> {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const status = await projectsRepository.findStatusById(statusId);
    if (!status || status.projectId !== projectId) {
      throw createHttpError(404, 'STATUS_NOT_FOUND', 'Status não encontrado no projeto');
    }

    const updated = await projectsRepository.updateStatus(statusId, {
      name: input.name,
      category: input.category,
      position: input.position,
      wipLimit: input.wipLimit !== undefined ? input.wipLimit : undefined,
      color: input.color !== undefined ? input.color : undefined,
    });

    const statusDto: WorkflowStatusDto = {
      id: updated.id,
      projectId: updated.projectId,
      name: updated.name,
      category: updated.category as StatusCategory,
      position: updated.position,
      wipLimit: updated.wipLimit,
      color: updated.color,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    socketEmitter.statusUpdated(projectId, statusDto);

    return statusDto;
  },

  async deleteStatus(userId: string, projectId: string, statusId: string) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const status = await projectsRepository.findStatusById(statusId);
    if (!status || status.projectId !== projectId) {
      throw createHttpError(404, 'STATUS_NOT_FOUND', 'Status não encontrado no projeto');
    }

    const allStatuses = await projectsRepository.listStatuses(projectId);
    if (allStatuses.length <= 1) {
      throw createHttpError(
        400,
        'CANNOT_DELETE_LAST_STATUS',
        'O projeto deve ter ao menos um status de fluxo ativo',
      );
    }

    const tasksCount = await projectsRepository.countTasksByStatus(statusId);
    if (tasksCount > 0) {
      throw createHttpError(
        400,
        'STATUS_IN_USE',
        `Não é possível excluir um status contendo ${tasksCount} tarefa(s). Mova as tarefas antes de excluí-lo.`,
      );
    }

    await projectsRepository.deleteStatus(statusId);

    socketEmitter.statusDeleted(projectId, {
      statusId,
      projectId,
      actorId: userId,
    });

    return { message: 'Status removido com sucesso' };
  },

  async reorderStatuses(userId: string, projectId: string, statusIds: string[]) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const reordered = await projectsRepository.reorderStatuses(projectId, statusIds);
    const dtos: WorkflowStatusDto[] = reordered.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      category: s.category as StatusCategory,
      position: s.position,
      wipLimit: s.wipLimit,
      color: s.color,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    for (const s of dtos) {
      socketEmitter.statusUpdated(projectId, s);
    }

    return dtos;
  },

  // Visões Salvas (SavedViews)
  async listSavedViews(userId: string, projectId: string) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, ALL_WORKSPACE_ROLES);

    const views = await projectsRepository.listSavedViews(projectId, userId);
    return views.map((v) => ({
      id: v.id,
      projectId: v.projectId,
      ownerId: v.ownerId,
      type: v.type,
      name: v.name,
      config: (v.config || {}) as SavedViewConfigDto,
      shared: v.shared,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    }));
  },

  async createSavedView(
    userId: string,
    projectId: string,
    input: CreateSavedViewRequest,
  ) {
    const project = await projectsRepository.findById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const created = await projectsRepository.createSavedView({
      projectId,
      ownerId: userId,
      type: input.type || 'LIST',
      name: input.name,
      config: input.config as Prisma.InputJsonValue,
      shared: Boolean(input.shared),
    });

    return {
      id: created.id,
      projectId: created.projectId,
      ownerId: created.ownerId,
      type: created.type,
      name: created.name,
      config: (created.config || {}) as SavedViewConfigDto,
      shared: created.shared,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async deleteSavedView(userId: string, viewId: string) {
    const view = await projectsRepository.findSavedViewById(viewId);
    if (!view) {
      throw createHttpError(404, 'SAVED_VIEW_NOT_FOUND', 'Visão salva não encontrada');
    }

    await verifyWorkspaceAccess(userId, view.project.workspaceId, MEMBER_WORKSPACE_ROLES);
    await projectsRepository.deleteSavedView(viewId);

    return { message: 'Visão salva excluída com sucesso' };
  },

  // Etiquetas do Workspace (Labels)
  async listWorkspaceLabels(userId: string, workspaceIdOrSlug: string) {
    const { workspaceId } = await verifyWorkspaceAccess(
      userId,
      workspaceIdOrSlug,
      ALL_WORKSPACE_ROLES,
    );

    const labels = await projectsRepository.listLabelsByWorkspace(workspaceId);
    return labels.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,
      name: l.name,
      color: l.color,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
  },

  async createWorkspaceLabel(
    userId: string,
    workspaceIdOrSlug: string,
    input: CreateLabelRequest,
  ) {
    const { workspaceId } = await verifyWorkspaceAccess(
      userId,
      workspaceIdOrSlug,
      MEMBER_WORKSPACE_ROLES,
    );

    const existing = await projectsRepository.findLabelByName(workspaceId, input.name.trim());
    if (existing) {
      throw createHttpError(
        409,
        'LABEL_ALREADY_EXISTS',
        `Já existe uma etiqueta chamada "${input.name}" neste workspace`,
      );
    }

    const created = await projectsRepository.createLabel({
      workspaceId,
      name: input.name.trim(),
      color: input.color,
    });

    return {
      id: created.id,
      workspaceId: created.workspaceId,
      name: created.name,
      color: created.color,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async deleteWorkspaceLabel(userId: string, labelId: string) {
    const label = await projectsRepository.findLabelById(labelId);
    if (!label) {
      throw createHttpError(404, 'LABEL_NOT_FOUND', 'Etiqueta não encontrada');
    }

    await verifyWorkspaceAccess(userId, label.workspaceId, MEMBER_WORKSPACE_ROLES);
    await projectsRepository.deleteLabel(labelId);

    return { message: 'Etiqueta excluída com sucesso' };
  },
};
