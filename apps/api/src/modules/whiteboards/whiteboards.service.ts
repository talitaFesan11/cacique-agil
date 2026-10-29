import {
  CanvasElement,
  ConvertSelectionToTasksRequest,
  ConvertStickyToTaskRequest,
  CreateWhiteboardRequest,
  PredefinedWhiteboardTemplateDto,
  TaskPriority,
  UpdateWhiteboardRequest,
  WhiteboardDto,
} from '@fluxo/shared';
import { whiteboardsRepository } from './whiteboards.repository.js';
import { PREDEFINED_WHITEBOARD_TEMPLATES } from './whiteboards.templates.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { tasksService } from '../tasks/tasks.service.js';
import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecordToWhiteboardDto(record: any, linkedTasksCount = 0): WhiteboardDto {
  const elements = (record.elementsJson as CanvasElement[]) || [];

  return {
    id: record.id,
    workspaceId: record.workspaceId,
    projectId: record.projectId ?? null,
    title: record.title,
    description: record.description ?? null,
    elementsJson: elements,
    thumbnailUrl: record.thumbnailUrl ?? null,
    isTemplate: Boolean(record.isTemplate),
    templateCategory: record.templateCategory ?? null,
    createdById: record.createdById ?? null,
    createdBy: record.createdBy
      ? {
          id: record.createdBy.id,
          name: record.createdBy.name,
          email: record.createdBy.email,
          avatarUrl: record.createdBy.avatarUrl,
        }
      : null,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
    deletedAt: record.deletedAt ? new Date(record.deletedAt).toISOString() : null,
    linkedTasksCount,
    elementsCount: elements.length,
  };
}

export class WhiteboardsService {
  private async checkWorkspaceAccess(userId: string, workspaceId: string) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!membership) {
      throw createHttpError(403, 'FORBIDDEN', 'Você não tem acesso a este workspace');
    }
    return membership;
  }

  async listWhiteboards(
    userId: string,
    workspaceId: string,
    filters?: { projectId?: string | null; search?: string; isTemplate?: boolean },
  ): Promise<WhiteboardDto[]> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const records = await whiteboardsRepository.findByWorkspace({
      workspaceId,
      projectId: filters?.projectId,
      search: filters?.search,
      isTemplate: filters?.isTemplate,
    });

    const dtos: WhiteboardDto[] = [];
    for (const rec of records) {
      const links = await whiteboardsRepository.findLinksByWhiteboard(rec.id);
      dtos.push(mapRecordToWhiteboardDto(rec, links.length));
    }

    return dtos;
  }

  async getWhiteboardById(userId: string, id: string): Promise<WhiteboardDto> {
    const record = await whiteboardsRepository.findById(id);
    if (!record || record.deletedAt) {
      throw createHttpError(404, 'WHITEBOARD_NOT_FOUND', 'Quadro branco não encontrado');
    }

    await this.checkWorkspaceAccess(userId, record.workspaceId);
    const links = await whiteboardsRepository.findLinksByWhiteboard(record.id);

    return mapRecordToWhiteboardDto(record, links.length);
  }

  async createWhiteboard(
    userId: string,
    input: CreateWhiteboardRequest,
  ): Promise<WhiteboardDto> {
    const membership = await this.checkWorkspaceAccess(userId, input.workspaceId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem criar quadros brancos');
    }

    let initialElements: CanvasElement[] = input.initialElements || [];

    if (input.templateCategory && initialElements.length === 0) {
      const template = PREDEFINED_WHITEBOARD_TEMPLATES.find(
        (t) => t.id === input.templateCategory,
      );
      if (template) {
        initialElements = JSON.parse(JSON.stringify(template.elements));
      }
    }

    const record = await whiteboardsRepository.create({
      workspace: { connect: { id: input.workspaceId } },
      ...(input.projectId ? { project: { connect: { id: input.projectId } } } : {}),
      title: input.title.trim() || 'Quadro sem título',
      description: input.description ?? null,
      isTemplate: input.isTemplate ?? false,
      templateCategory: input.templateCategory ?? null,
      elementsJson: JSON.parse(JSON.stringify(initialElements)),
      createdBy: { connect: { id: userId } },
    });

    return mapRecordToWhiteboardDto(record, 0);
  }

  async updateWhiteboard(
    userId: string,
    id: string,
    input: UpdateWhiteboardRequest,
  ): Promise<WhiteboardDto> {
    const existing = await whiteboardsRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw createHttpError(404, 'WHITEBOARD_NOT_FOUND', 'Quadro branco não encontrado');
    }

    const membership = await this.checkWorkspaceAccess(userId, existing.workspaceId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem editar quadros');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.projectId !== undefined) {
      if (input.projectId) {
        updateData.project = { connect: { id: input.projectId } };
      } else {
        updateData.project = { disconnect: true };
      }
    }
    if (input.elementsJson !== undefined) {
      updateData.elementsJson = JSON.parse(JSON.stringify(input.elementsJson));
    }
    if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;
    if (input.isTemplate !== undefined) updateData.isTemplate = input.isTemplate;
    if (input.templateCategory !== undefined) updateData.templateCategory = input.templateCategory;

    const updated = await whiteboardsRepository.update(id, updateData);
    const links = await whiteboardsRepository.findLinksByWhiteboard(id);

    return mapRecordToWhiteboardDto(updated, links.length);
  }

  async deleteWhiteboard(userId: string, id: string): Promise<void> {
    const existing = await whiteboardsRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw createHttpError(404, 'WHITEBOARD_NOT_FOUND', 'Quadro branco não encontrado');
    }

    const membership = await this.checkWorkspaceAccess(userId, existing.workspaceId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem excluir quadros');
    }

    await whiteboardsRepository.softDelete(id);
  }

  listTemplates(): PredefinedWhiteboardTemplateDto[] {
    return PREDEFINED_WHITEBOARD_TEMPLATES;
  }

  async convertStickyToTask(
    userId: string,
    whiteboardId: string,
    input: ConvertStickyToTaskRequest,
  ) {
    const whiteboard = await whiteboardsRepository.findById(whiteboardId);
    if (!whiteboard || whiteboard.deletedAt) {
      throw createHttpError(404, 'WHITEBOARD_NOT_FOUND', 'Quadro branco não encontrado');
    }

    await this.checkWorkspaceAccess(userId, whiteboard.workspaceId);

    const elements = (whiteboard.elementsJson as CanvasElement[]) || [];
    const stickyIndex = elements.findIndex((el) => el.id === input.stickyId);
    if (stickyIndex === -1) {
      throw createHttpError(404, 'STICKY_NOT_FOUND', 'Nota adesiva não encontrada no quadro');
    }

    const sticky = elements[stickyIndex]!;
    const taskTitle = input.title?.trim() || sticky.text?.trim() || 'Nova Tarefa do Quadro';

    // Cria a tarefa real no projeto usando o tasksService
    const createdTask = await tasksService.createTask(userId, input.projectId, {
      title: taskTitle,
      priority: input.priority || TaskPriority.NONE,
      statusId: input.statusId,
      assigneeIds: [],
      description: sticky.text ? { type: 'doc', content: [{ type: 'paragraph', text: sticky.text }] } : undefined,
    });

    // Cria o vínculo de entidade (EntityLink)
    await whiteboardsRepository.createEntityLink({
      workspaceId: whiteboard.workspaceId,
      fromType: 'whiteboard',
      fromId: whiteboardId,
      toType: 'task',
      toId: createdTask.id,
    });

    // Converte o elemento do canvas em task_card
    const updatedElement: CanvasElement = {
      ...sticky,
      type: 'task_card',
      taskId: createdTask.id,
      taskKey: createdTask.key,
      taskTitle: createdTask.title,
      taskPriority: createdTask.priority,
      taskStatusName: createdTask.status?.name || 'A Fazer',
      taskStatusCategory: createdTask.status?.category || 'TODO',
      color: '#0f172a',
      backgroundColor: '#ffffff',
    };

    elements[stickyIndex] = updatedElement;

    await whiteboardsRepository.update(whiteboardId, {
      elementsJson: JSON.parse(JSON.stringify(elements)),
    });

    logger.info(
      { whiteboardId, taskId: createdTask.id, stickyId: input.stickyId },
      'Nota adesiva convertida em tarefa e vinculada com sucesso via EntityLink',
    );

    return {
      task: createdTask,
      element: updatedElement,
    };
  }

  async convertSelectionToTasks(
    userId: string,
    whiteboardId: string,
    input: ConvertSelectionToTasksRequest,
  ) {
    const whiteboard = await whiteboardsRepository.findById(whiteboardId);
    if (!whiteboard || whiteboard.deletedAt) {
      throw createHttpError(404, 'WHITEBOARD_NOT_FOUND', 'Quadro branco não encontrado');
    }

    await this.checkWorkspaceAccess(userId, whiteboard.workspaceId);

    const elements = (whiteboard.elementsJson as CanvasElement[]) || [];
    const createdTasks = [];
    const updatedElements: CanvasElement[] = [];

    for (const stickyId of input.stickyIds) {
      const idx = elements.findIndex((el) => el.id === stickyId);
      if (idx === -1) continue;

      const sticky = elements[idx]!;
      const taskTitle = sticky.text?.trim() || 'Tarefa do Quadro';

      const task = await tasksService.createTask(userId, input.projectId, {
        title: taskTitle,
        priority: TaskPriority.NONE,
        statusId: input.statusId,
        assigneeIds: [],
      });

      await whiteboardsRepository.createEntityLink({
        workspaceId: whiteboard.workspaceId,
        fromType: 'whiteboard',
        fromId: whiteboardId,
        toType: 'task',
        toId: task.id,
      });

      const updatedElement: CanvasElement = {
        ...sticky,
        type: 'task_card',
        taskId: task.id,
        taskKey: task.key,
        taskTitle: task.title,
        taskPriority: task.priority,
        taskStatusName: task.status?.name || 'A Fazer',
        taskStatusCategory: task.status?.category || 'TODO',
        color: '#0f172a',
        backgroundColor: '#ffffff',
      };

      elements[idx] = updatedElement;
      createdTasks.push(task);
      updatedElements.push(updatedElement);
    }

    await whiteboardsRepository.update(whiteboardId, {
      elementsJson: JSON.parse(JSON.stringify(elements)),
    });

    return {
      tasks: createdTasks,
      elements: updatedElements,
    };
  }

  async exportWhiteboard(userId: string, id: string, format: 'svg' | 'json'): Promise<string> {
    const board = await this.getWhiteboardById(userId, id);
    const elements = board.elementsJson || [];

    if (format === 'json') {
      return JSON.stringify(board, null, 2);
    }

    // Geração de SVG vetorial limpo
    let minX = 0;
    let minY = 0;
    let maxX = 1920;
    let maxY = 1080;

    if (elements.length > 0) {
      minX = Math.min(...elements.map((e) => e.x)) - 50;
      minY = Math.min(...elements.map((e) => e.y)) - 50;
      maxX = Math.max(...elements.map((e) => e.x + e.width)) + 50;
      maxY = Math.max(...elements.map((e) => e.y + e.height)) + 50;
    }

    const width = Math.max(800, maxX - minX);
    const height = Math.max(600, maxY - minY);

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">\n`;
    svgContent += `  <style>\n    .text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }\n  </style>\n`;
    svgContent += `  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#f8fafc" />\n`;

    // Desenha elementos
    for (const el of elements) {
      if (el.type === 'frame') {
        svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="${el.backgroundColor || '#ffffff'}" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4" />\n`;
        if (el.text) {
          svgContent += `  <text x="${el.x + 16}" y="${el.y + 28}" class="text" font-size="16" font-weight="bold" fill="${el.color || '#334155'}">${escapeXml(el.text)}</text>\n`;
        }
      } else if (el.type === 'sticky') {
        svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="6" fill="${el.backgroundColor || '#fef08a'}" stroke="#e2e8f0" stroke-width="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />\n`;
        if (el.text) {
          svgContent += `  <text x="${el.x + 12}" y="${el.y + 28}" class="text" font-size="14" fill="${el.color || '#1e293b'}">${escapeXml(el.text.slice(0, 80))}</text>\n`;
        }
      } else if (el.type === 'shape') {
        if (el.shapeType === 'ellipse') {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.backgroundColor || '#e2e8f0'}" stroke="${el.color || '#64748b'}" stroke-width="${el.strokeWidth || 2}" />\n`;
        } else if (el.shapeType === 'diamond') {
          const midX = el.x + el.width / 2;
          const midY = el.y + el.height / 2;
          const points = `${midX},${el.y} ${el.x + el.width},${midY} ${midX},${el.y + el.height} ${el.x},${midY}`;
          svgContent += `  <polygon points="${points}" fill="${el.backgroundColor || '#fef08a'}" stroke="${el.color || '#ca8a04'}" stroke-width="${el.strokeWidth || 2}" />\n`;
        } else {
          svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${el.backgroundColor || '#e2e8f0'}" stroke="${el.color || '#64748b'}" stroke-width="${el.strokeWidth || 2}" />\n`;
        }
        if (el.text) {
          svgContent += `  <text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 5}" class="text" text-anchor="middle" font-size="14" font-weight="600" fill="${el.color || '#0f172a'}">${escapeXml(el.text)}</text>\n`;
        }
      } else if (el.type === 'task_card') {
        svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="#ffffff" stroke="#6366f1" stroke-width="2" />\n`;
        svgContent += `  <text x="${el.x + 12}" y="${el.y + 24}" class="text" font-size="13" font-weight="bold" fill="#4f46e5">${escapeXml(el.taskKey || 'TASK')}</text>\n`;
        svgContent += `  <text x="${el.x + 12}" y="${el.y + 48}" class="text" font-size="13" fill="#1e293b">${escapeXml(el.taskTitle || el.text || '')}</text>\n`;
      } else if (el.type === 'arrow' && el.fromPoint && el.toPoint) {
        svgContent += `  <line x1="${el.fromPoint.x}" y1="${el.fromPoint.y}" x2="${el.toPoint.x}" y2="${el.toPoint.y}" stroke="${el.color || '#64748b'}" stroke-width="${el.strokeWidth || 2}" marker-end="url(#arrowhead)" />\n`;
      }
    }

    svgContent += `</svg>`;
    return svgContent;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const whiteboardsService = new WhiteboardsService();
