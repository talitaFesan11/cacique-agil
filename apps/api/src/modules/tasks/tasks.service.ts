import crypto from 'crypto';
import {
  BulkTasksActionRequest,
  CommentBodyDto,
  CreateAttachmentRequest,
  CreateChecklistItemRequest,
  CreateChecklistRequest,
  CreateCommentRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  StatusCategory,
  TaskDto,
  TaskFilterQuery,
  TaskPriority,
  UpdateChecklistItemRequest,
  UpdateTaskRequest,
  WorkspaceRole,
} from '@fluxo/shared';
import { Prisma } from '@prisma/client';
import { createHttpError } from '../../middleware/auth.middleware.js';
import {
  ALL_WORKSPACE_ROLES,
  MEMBER_WORKSPACE_ROLES,
} from '../../middleware/rbac.middleware.js';
import { tasksRepository } from './tasks.repository.js';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  [TaskPriority.NONE]: 0,
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.URGENT]: 4,
};

async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string,
  allowedRoles: WorkspaceRole[] = ALL_WORKSPACE_ROLES,
) {
  const membership = await tasksRepository.findMembership(userId, workspaceId);
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

  return userRole;
}

async function validateSubtaskDepth(projectId: string, parentId: string, currentTaskId?: string) {
  if (currentTaskId && parentId === currentTaskId) {
    throw createHttpError(400, 'INVALID_PARENT_TASK', 'Uma tarefa não pode ser subtarefa de si mesma');
  }

  // Nível 1 = tarefa raiz (parentId = null)
  // Nível 2 = subtarefa direta (parent tem parentId = null)
  // Nível 3 = sub-subtarefa (parent tem parentId != null, avô tem parentId = null)
  // Acima de 3 níveis -> rejeitado conforme seção 6.2 da Spec ("subtarefas até 3 níveis")
  let depth = 1;
  let cursorId: string | null = parentId;

  while (cursorId) {
    if (currentTaskId && cursorId === currentTaskId) {
      throw createHttpError(
        400,
        'CIRCULAR_SUBTASK_HIERARCHY',
        'Ciclo detectado na hierarquia de subtarefas',
      );
    }

    const parentTask = await tasksRepository.findById(cursorId);
    if (!parentTask || parentTask.deletedAt || parentTask.projectId !== projectId) {
      throw createHttpError(
        400,
        'PARENT_TASK_NOT_FOUND',
        'Tarefa-pai não encontrada neste projeto',
      );
    }

    depth++;
    if (depth > 3) {
      throw createHttpError(
        400,
        'MAX_SUBTASK_DEPTH_EXCEEDED',
        'Subtarefas suportam no máximo 3 níveis de profundidade',
      );
    }

    cursorId = parentTask.parentId;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- retorno composto do repositório Prisma com includes aninhados
function mapTaskRecordToDto(record: any): TaskDto {
  const projectKey = record.project?.key || 'TASK';
  const key = `${projectKey}-${record.number}`;

  const checklists = (record.checklists || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cl: any) => ({
      id: cl.id,
      taskId: cl.taskId,
      title: cl.title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (cl.items || []).map((item: any) => ({
        id: item.id,
        checklistId: item.checklistId,
        text: item.text,
        done: Boolean(item.done),
        position: item.position,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
      })),
      createdAt: cl.createdAt ? new Date(cl.createdAt).toISOString() : undefined,
      updatedAt: cl.updatedAt ? new Date(cl.updatedAt).toISOString() : undefined,
    }),
  );

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  for (const cl of checklists) {
    for (const item of cl.items) {
      totalChecklistItems++;
      if (item.done) completedChecklistItems++;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labels = (record.labels || []).map((tl: any) => ({
    id: tl.label.id,
    workspaceId: tl.label.workspaceId,
    name: tl.label.name,
    color: tl.label.color,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtasks = (record.subtasks || []).map((st: any) => ({
    id: st.id,
    projectId: st.projectId,
    number: st.number,
    key: `${projectKey}-${st.number}`,
    title: st.title,
    statusId: st.statusId,
    priority: st.priority as TaskPriority,
    progress: st.progress,
    dueDate: st.dueDate ? new Date(st.dueDate).toISOString() : null,
    assigneeIds: st.assigneeIds || [],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments = (record.comments || []).map((c: any) => {
    const rawBody = c.body;
    const normalizedBody: CommentBodyDto =
      rawBody && typeof rawBody === 'object' && 'text' in rawBody
        ? {
            text: String(rawBody.text),
            mentions: Array.isArray(rawBody.mentions) ? rawBody.mentions.map(String) : [],
          }
        : { text: typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody ?? ''), mentions: [] };

    return {
      id: c.id,
      taskId: c.taskId,
      docId: c.docId,
      authorId: c.authorId,
      body: normalizedBody,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
      author: c.author,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachments = (record.attachments || []).map((att: any) => ({
    id: att.id,
    taskId: att.taskId,
    fileName: att.fileName,
    mimeType: att.mimeType,
    size: att.size,
    storageKey: att.storageKey,
    createdAt: att.createdAt ? new Date(att.createdAt).toISOString() : new Date().toISOString(),
  }));

  return {
    id: record.id,
    projectId: record.projectId,
    projectKey,
    number: record.number,
    key,
    title: record.title,
    description: record.description ?? null,
    statusId: record.statusId,
    status: record.status
      ? {
          id: record.status.id,
          projectId: record.status.projectId,
          name: record.status.name,
          category: record.status.category as StatusCategory,
          position: record.status.position,
          wipLimit: record.status.wipLimit,
          color: record.status.color,
        }
      : undefined,
    priority: record.priority as TaskPriority,
    parentId: record.parentId ?? null,
    assigneeIds: record.assigneeIds || [],
    startDate: record.startDate ? new Date(record.startDate).toISOString() : null,
    dueDate: record.dueDate ? new Date(record.dueDate).toISOString() : null,
    estimateMinutes: record.estimateMinutes ?? null,
    progress: record.progress,
    isMilestone: Boolean(record.isMilestone),
    position: record.position,
    labels,
    checklistSummary: {
      totalItems: totalChecklistItems,
      completedItems: completedChecklistItems,
    },
    commentCount: Array.isArray(record.comments) ? record.comments.length : 0,
    attachmentCount: Array.isArray(record.attachments) ? record.attachments.length : 0,
    subtaskCount: subtasks.length,
    subtasks,
    checklists,
    comments: comments[0]?.author ? comments : undefined,
    attachments: attachments[0]?.fileName ? attachments : undefined,
    deletedAt: record.deletedAt ? new Date(record.deletedAt).toISOString() : null,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  };
}

export const tasksService = {
  async listProjectTasks(userId: string, projectId: string, filters: TaskFilterQuery) {
    const project = await tasksRepository.findProjectById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, ALL_WORKSPACE_ROLES);

    const rawTasks = await tasksRepository.listByProject(projectId);
    let dtos = rawTasks.map(mapTaskRecordToDto);

    // Filtros
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase();
      dtos = dtos.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q) ||
          String(t.number) === q,
      );
    }

    if (filters.statusId) {
      dtos = dtos.filter((t) => t.statusId === filters.statusId);
    }

    if (filters.priority) {
      dtos = dtos.filter((t) => t.priority === filters.priority);
    }

    if (filters.assigneeId) {
      dtos = dtos.filter((t) => t.assigneeIds.includes(filters.assigneeId!));
    }

    if (filters.labelId) {
      dtos = dtos.filter((t) => t.labels.some((l) => l.id === filters.labelId));
    }

    if (filters.parentId !== undefined) {
      if (filters.parentId === 'root' || filters.parentId === '') {
        dtos = dtos.filter((t) => t.parentId === null);
      } else {
        dtos = dtos.filter((t) => t.parentId === filters.parentId);
      }
    }

    // Ordenação
    const sortBy = filters.sortBy || 'position';
    const sortMultiplier = filters.sortOrder === 'desc' ? -1 : 1;

    dtos.sort((a, b) => {
      if (sortBy === 'number') {
        return (a.number - b.number) * sortMultiplier;
      }
      if (sortBy === 'priority') {
        return (
          (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * sortMultiplier
        );
      }
      if (sortBy === 'dueDate') {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return (aTime - bTime) * sortMultiplier;
      }
      if (sortBy === 'createdAt') {
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          sortMultiplier
        );
      }
      return (a.position - b.position) * sortMultiplier;
    });

    return dtos;
  },

  async createTask(userId: string, projectId: string, input: CreateTaskRequest) {
    const project = await tasksRepository.findProjectById(projectId);
    if (!project || project.deletedAt) {
      throw createHttpError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado');
    }

    await verifyWorkspaceAccess(userId, project.workspaceId, MEMBER_WORKSPACE_ROLES);

    if (project.statuses.length === 0) {
      throw createHttpError(
        400,
        'PROJECT_HAS_NO_STATUSES',
        'O projeto não possui status de fluxo configurados',
      );
    }

    const targetStatus = input.statusId
      ? project.statuses.find((s) => s.id === input.statusId)
      : project.statuses[0];

    if (!targetStatus) {
      throw createHttpError(
        400,
        'INVALID_STATUS_ID',
        'O status informado não pertence a este projeto',
      );
    }

    if (input.parentId) {
      await validateSubtaskDepth(projectId, input.parentId);
    }

    const { nextNumber, nextPosition } = await tasksRepository.getNextNumberAndPosition(
      projectId,
      targetStatus.id,
    );

    const progress =
      input.progress !== undefined
        ? input.progress
        : targetStatus.category === StatusCategory.DONE
          ? 100
          : 0;

    const created = await tasksRepository.create({
      projectId,
      number: nextNumber,
      title: input.title,
      description:
        input.description !== undefined
          ? (input.description as Prisma.InputJsonValue)
          : undefined,
      statusId: targetStatus.id,
      priority: input.priority || TaskPriority.NONE,
      parentId: input.parentId ?? null,
      assigneeIds: input.assigneeIds || [],
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      estimateMinutes: input.estimateMinutes ?? null,
      progress,
      isMilestone: Boolean(input.isMilestone),
      position: nextPosition,
      labelIds: input.labelIds,
    });

    const fullTask = await tasksRepository.findById(created.id);
    return mapTaskRecordToDto(fullTask);
  },

  async getTaskById(userId: string, taskId: string) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, ALL_WORKSPACE_ROLES);
    return mapTaskRecordToDto(task);
  },

  async updateTask(userId: string, taskId: string, input: UpdateTaskRequest) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);

    let progress = input.progress;

    if (input.statusId && input.statusId !== task.statusId) {
      const project = await tasksRepository.findProjectById(task.projectId);
      const targetStatus = project?.statuses.find((s) => s.id === input.statusId);
      if (!targetStatus) {
        throw createHttpError(
          400,
          'INVALID_STATUS_ID',
          'O status informado não pertence a este projeto',
        );
      }
      if (progress === undefined && targetStatus.category === StatusCategory.DONE) {
        progress = 100;
      }
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      await validateSubtaskDepth(task.projectId, input.parentId, taskId);
    }

    await tasksRepository.update(taskId, {
      title: input.title,
      description:
        input.description !== undefined
          ? input.description === null
            ? Prisma.JsonNull
            : (input.description as Prisma.InputJsonValue)
          : undefined,
      statusId: input.statusId,
      priority: input.priority,
      parentId: input.parentId,
      assigneeIds: input.assigneeIds,
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
      estimateMinutes: input.estimateMinutes,
      progress,
      isMilestone: input.isMilestone,
      position: input.position,
    });

    const updated = await tasksRepository.findById(taskId);
    return mapTaskRecordToDto(updated);
  },

  async moveTask(userId: string, taskId: string, input: MoveTaskRequest) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);

    if (input.statusId && input.statusId !== task.statusId) {
      const project = await tasksRepository.findProjectById(task.projectId);
      const targetStatus = project?.statuses.find((s) => s.id === input.statusId);
      if (!targetStatus) {
        throw createHttpError(
          400,
          'INVALID_STATUS_ID',
          'O status informado não pertence a este projeto',
        );
      }
    }

    await tasksRepository.update(taskId, {
      statusId: input.statusId ?? task.statusId,
      position: input.position,
    });

    const updated = await tasksRepository.findById(taskId);
    return mapTaskRecordToDto(updated);
  },

  async deleteTask(userId: string, taskId: string) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);
    await tasksRepository.softDelete(taskId);

    return { message: 'Tarefa excluída com sucesso' };
  },

  async bulkAction(userId: string, input: BulkTasksActionRequest) {
    const tasks = await tasksRepository.findManyByIds(input.taskIds);
    if (tasks.length === 0) {
      throw createHttpError(404, 'TASKS_NOT_FOUND', 'Nenhuma tarefa válida encontrada');
    }

    const workspaceIds = new Set(tasks.map((t) => t.project.workspaceId));
    if (workspaceIds.size > 1) {
      throw createHttpError(
        400,
        'CROSS_WORKSPACE_BULK_FORBIDDEN',
        'Ações em massa devem operar apenas sobre tarefas do mesmo workspace',
      );
    }

    const [workspaceId] = Array.from(workspaceIds);
    await verifyWorkspaceAccess(userId, workspaceId!, MEMBER_WORKSPACE_ROLES);

    const validIds = tasks.map((t) => t.id);

    if (input.delete) {
      await tasksRepository.bulkUpdate(validIds, { deletedAt: new Date() });
      return {
        message: `${validIds.length} tarefa(s) excluída(s) com sucesso`,
        updatedCount: validIds.length,
      };
    }

    await tasksRepository.bulkUpdate(validIds, {
      statusId: input.statusId,
      priority: input.priority,
      assigneeIds: input.assigneeIds,
    });

    return {
      message: `${validIds.length} tarefa(s) atualizada(s) com sucesso`,
      updatedCount: validIds.length,
    };
  },

  // Etiquetas da tarefa
  async attachLabelToTask(userId: string, taskId: string, labelId: string) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const label = await tasksRepository.findLabelById(labelId);
    if (!label || label.workspaceId !== task.project.workspaceId) {
      throw createHttpError(
        404,
        'LABEL_NOT_FOUND',
        'Etiqueta não encontrada neste workspace',
      );
    }

    await tasksRepository.attachLabel(taskId, labelId);
    const updated = await tasksRepository.findById(taskId);
    return mapTaskRecordToDto(updated);
  },

  async detachLabelFromTask(userId: string, taskId: string, labelId: string) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);
    await tasksRepository.detachLabel(taskId, labelId);

    const updated = await tasksRepository.findById(taskId);
    return mapTaskRecordToDto(updated);
  },

  // Checklists
  async createChecklist(userId: string, taskId: string, input: CreateChecklistRequest) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);

    const created = await tasksRepository.createChecklist(taskId, input.title);
    return {
      id: created.id,
      taskId: created.taskId,
      title: created.title,
      items: [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async deleteChecklist(userId: string, checklistId: string) {
    const checklist = await tasksRepository.findChecklistById(checklistId);
    if (!checklist) {
      throw createHttpError(404, 'CHECKLIST_NOT_FOUND', 'Checklist não encontrada');
    }

    await verifyWorkspaceAccess(
      userId,
      checklist.task.project.workspaceId,
      MEMBER_WORKSPACE_ROLES,
    );

    await tasksRepository.deleteChecklist(checklistId);
    return { message: 'Checklist excluída com sucesso' };
  },

  async addChecklistItem(
    userId: string,
    checklistId: string,
    input: CreateChecklistItemRequest,
  ) {
    const checklist = await tasksRepository.findChecklistById(checklistId);
    if (!checklist) {
      throw createHttpError(404, 'CHECKLIST_NOT_FOUND', 'Checklist não encontrada');
    }

    await verifyWorkspaceAccess(
      userId,
      checklist.task.project.workspaceId,
      MEMBER_WORKSPACE_ROLES,
    );

    const maxPos = checklist.items.reduce((max, i) => Math.max(max, i.position), 0);
    const position = input.position ?? maxPos + 1000;

    const item = await tasksRepository.createChecklistItem({
      checklistId,
      text: input.text,
      position,
    });

    return {
      id: item.id,
      checklistId: item.checklistId,
      text: item.text,
      done: item.done,
      position: item.position,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  },

  async updateChecklistItem(
    userId: string,
    itemId: string,
    input: UpdateChecklistItemRequest,
  ) {
    const item = await tasksRepository.findChecklistItemById(itemId);
    if (!item) {
      throw createHttpError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Item de checklist não encontrado');
    }

    await verifyWorkspaceAccess(
      userId,
      item.checklist.task.project.workspaceId,
      MEMBER_WORKSPACE_ROLES,
    );

    const updated = await tasksRepository.updateChecklistItem(itemId, {
      text: input.text,
      done: input.done,
      position: input.position,
    });

    return {
      id: updated.id,
      checklistId: updated.checklistId,
      text: updated.text,
      done: updated.done,
      position: updated.position,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async deleteChecklistItem(userId: string, itemId: string) {
    const item = await tasksRepository.findChecklistItemById(itemId);
    if (!item) {
      throw createHttpError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Item de checklist não encontrado');
    }

    await verifyWorkspaceAccess(
      userId,
      item.checklist.task.project.workspaceId,
      MEMBER_WORKSPACE_ROLES,
    );

    await tasksRepository.deleteChecklistItem(itemId);
    return { message: 'Item de checklist excluído com sucesso' };
  },

  // Comentários
  async listComments(userId: string, taskId: string) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, ALL_WORKSPACE_ROLES);

    const comments = await tasksRepository.listCommentsByTask(taskId);
    return comments.map((c) => {
      const rawBody = c.body as Record<string, unknown> | null;
      return {
        id: c.id,
        taskId: c.taskId,
        docId: c.docId,
        authorId: c.authorId,
        body: {
          text:
            rawBody && typeof rawBody.text === 'string'
              ? rawBody.text
              : String(c.body ?? ''),
          mentions:
            rawBody && Array.isArray(rawBody.mentions)
              ? rawBody.mentions.map(String)
              : [],
        },
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        author: c.author,
      };
    });
  },

  async createComment(userId: string, taskId: string, input: CreateCommentRequest) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    // Qualquer membro do workspace (incluindo GUEST conforme seção 1.1: "Ver e comentar partes específicas")
    await verifyWorkspaceAccess(userId, task.project.workspaceId, ALL_WORKSPACE_ROLES);

    const extractedMentions = Array.from(
      new Set([
        ...(input.mentions || []),
        ...Array.from(input.text.matchAll(/@([a-zA-Z0-9._-]+)/g)).map((m) => m[1]!),
      ]),
    );

    const comment = await tasksRepository.createComment({
      taskId,
      authorId: userId,
      body: {
        text: input.text,
        mentions: extractedMentions,
      } as Prisma.InputJsonValue,
    });

    return {
      id: comment.id,
      taskId: comment.taskId,
      docId: comment.docId,
      authorId: comment.authorId,
      body: {
        text: input.text,
        mentions: extractedMentions,
      },
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: comment.author,
    };
  },

  async deleteComment(userId: string, commentId: string) {
    const comment = await tasksRepository.findCommentById(commentId);
    if (!comment || !comment.task) {
      throw createHttpError(404, 'COMMENT_NOT_FOUND', 'Comentário não encontrado');
    }

    const userRole = await verifyWorkspaceAccess(
      userId,
      comment.task.project.workspaceId,
      ALL_WORKSPACE_ROLES,
    );

    const isOwnerOrAdmin =
      userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;

    if (comment.authorId !== userId && !isOwnerOrAdmin) {
      throw createHttpError(
        403,
        'FORBIDDEN_COMMENT_DELETE',
        'Você só pode excluir seus próprios comentários',
      );
    }

    await tasksRepository.deleteComment(commentId);
    return { message: 'Comentário excluído com sucesso' };
  },

  // Anexos
  async listAttachments(userId: string, taskId: string) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, ALL_WORKSPACE_ROLES);

    const attachments = await tasksRepository.listAttachmentsByTask(taskId);
    return attachments.map((a) => ({
      id: a.id,
      taskId: a.taskId,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
      storageKey: a.storageKey,
      createdAt: a.createdAt.toISOString(),
    }));
  },

  async createAttachment(
    userId: string,
    taskId: string,
    input: CreateAttachmentRequest,
  ) {
    const task = await tasksRepository.findById(taskId);
    if (!task || task.deletedAt) {
      throw createHttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    await verifyWorkspaceAccess(userId, task.project.workspaceId, MEMBER_WORKSPACE_ROLES);

    // Gera nome aleatório seguro de armazenamento (seção 9 da Spec)
    const sanitizedExt = input.fileName.includes('.')
      ? `.${input.fileName.split('.').pop()!.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`
      : '';
    const storageKey = `workspaces/${task.project.workspaceId}/tasks/${taskId}/${crypto.randomBytes(16).toString('hex')}${sanitizedExt}`;

    const attachment = await tasksRepository.createAttachment({
      taskId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      storageKey,
    });

    return {
      id: attachment.id,
      taskId: attachment.taskId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      storageKey: attachment.storageKey,
      createdAt: attachment.createdAt.toISOString(),
    };
  },

  async deleteAttachment(userId: string, attachmentId: string) {
    const attachment = await tasksRepository.findAttachmentById(attachmentId);
    if (!attachment) {
      throw createHttpError(404, 'ATTACHMENT_NOT_FOUND', 'Anexo não encontrado');
    }

    await verifyWorkspaceAccess(
      userId,
      attachment.task.project.workspaceId,
      MEMBER_WORKSPACE_ROLES,
    );

    await tasksRepository.deleteAttachment(attachmentId);
    return { message: 'Anexo excluído com sucesso' };
  },
};
