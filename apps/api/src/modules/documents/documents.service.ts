import { Prisma } from '@prisma/client';
import {
  CreateDocumentRequest,
  DocTemplateCategory,
  DocumentDto,
  DocumentExportFormat,
  DocumentTreeNodeDto,
  PredefinedTemplateDto,
  UpdateDocumentRequest,
} from '@fluxo/shared';
import { documentsRepository } from './documents.repository.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { prisma } from '../../config/prisma.js';

export class DocumentsService {
  private predefinedTemplates: PredefinedTemplateDto[] = [
    {
      id: 'template-meeting-notes',
      title: 'Ata de Reunião',
      description: 'Estrutura completa com participantes, pauta, decisões e lista de ações.',
      category: 'MEETING',
      icon: '📋',
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Ata de Reunião: [Título do Tópico]' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: 'Data: ' },
              { type: 'text', text: '[Inserir Data] | ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'Participantes: ' },
              { type: 'text', text: '[Nomes]' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Pauta e Discussão' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Decisões Aprovadas' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '• [Decisão aprovada pelo time]' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Plano de Ação' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ação imediata com responsável' }] }],
              },
            ],
          },
        ],
      },
    },
    {
      id: 'template-prd',
      title: 'PRD — Product Requirements Document',
      description: 'Problema, objetivos, métricas de sucesso, personas e requisitos funcionais.',
      category: 'PRD',
      icon: '📑',
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'PRD: [Nome da Funcionalidade]' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '1. Problema e Oportunidade' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Qual dor do usuário ou gargalo operacional estamos solucionando?' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '2. Objetivos e Métricas de Sucesso' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'KPI 1: Redução no tempo de ciclo' }] }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '3. Requisitos Funcionais' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Descreva os fluxos de interação, estados de tela e integrações.' }],
          },
        ],
      },
    },
    {
      id: 'template-retrospective',
      title: 'Retrospectiva de Sprint',
      description: 'O que funcionou bem, o que pode melhorar e plano de ação contínua.',
      category: 'RETROSPECTIVE',
      icon: '🔄',
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Retrospectiva: Sprint [Número]' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'O que funcionou bem? 🎉' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Entregas prioritárias no prazo com alta qualidade.' }] }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'O que podemos melhorar? 🤔' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Refinar critérios de aceitação com mais antecedência.' }] }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Plano de Ação para a Próxima Iteração 🚀' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item de ação acordado' }] }],
              },
            ],
          },
        ],
      },
    },
  ];

  async checkWorkspaceAccess(userId: string, workspaceId: string) {
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

  async getDocuments(
    userId: string,
    workspaceId: string,
    query: {
      projectId?: string;
      isTemplate?: boolean;
      search?: string;
    },
  ): Promise<DocumentDto[]> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const docs = await documentsRepository.findByWorkspace({
      workspaceId,
      projectId: query.projectId,
      isTemplate: query.isTemplate,
      search: query.search,
    });

    const userFavorites = await documentsRepository.getUserFavorites(userId, workspaceId);

    return docs.map((doc) => ({
      id: doc.id,
      workspaceId: doc.workspaceId,
      projectId: doc.projectId,
      parentId: doc.parentId,
      title: doc.title,
      icon: doc.icon,
      contentJson: doc.contentJson,
      isTemplate: doc.isTemplate,
      templateCategory: doc.templateCategory as DocTemplateCategory | null,
      createdById: doc.createdById,
      createdBy: doc.createdBy,
      isFavorite: userFavorites.has(doc.id),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      deletedAt: doc.deletedAt?.toISOString() || null,
      childrenCount: doc._count?.children || 0,
      commentsCount: doc._count?.comments || 0,
    }));
  }

  async getDocumentTree(
    userId: string,
    workspaceId: string,
    projectId?: string,
  ): Promise<DocumentTreeNodeDto[]> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const rawDocs = await documentsRepository.findTreeByWorkspace(workspaceId, projectId);
    const userFavorites = await documentsRepository.getUserFavorites(userId, workspaceId);

    // Constrói árvore hierárquica
    const docMap = new Map<string, DocumentTreeNodeDto>();
    const rootNodes: DocumentTreeNodeDto[] = [];

    rawDocs.forEach((doc) => {
      docMap.set(doc.id, {
        id: doc.id,
        workspaceId: doc.workspaceId,
        projectId: doc.projectId,
        parentId: doc.parentId,
        title: doc.title,
        icon: doc.icon,
        isTemplate: doc.isTemplate,
        templateCategory: doc.templateCategory as DocTemplateCategory | null,
        isFavorite: userFavorites.has(doc.id),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        children: [],
      });
    });

    rawDocs.forEach((doc) => {
      const node = docMap.get(doc.id)!;
      if (doc.parentId && docMap.has(doc.parentId)) {
        docMap.get(doc.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  async getDocumentById(userId: string, docId: string): Promise<DocumentDto> {
    const doc = await documentsRepository.findById(docId);
    if (!doc) {
      throw createHttpError(404, 'NOT_FOUND', 'Documento não encontrado');
    }

    await this.checkWorkspaceAccess(userId, doc.workspaceId);
    const isFav = await documentsRepository.isFavorite(userId, docId);

    return {
      id: doc.id,
      workspaceId: doc.workspaceId,
      projectId: doc.projectId,
      parentId: doc.parentId,
      title: doc.title,
      icon: doc.icon,
      contentJson: doc.contentJson,
      isTemplate: doc.isTemplate,
      templateCategory: doc.templateCategory as DocTemplateCategory | null,
      createdById: doc.createdById,
      createdBy: doc.createdBy,
      isFavorite: isFav,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      deletedAt: doc.deletedAt?.toISOString() || null,
      childrenCount: doc._count?.children || 0,
      commentsCount: doc._count?.comments || 0,
    };
  }

  async createDocument(userId: string, data: CreateDocumentRequest): Promise<DocumentDto> {
    const membership = await this.checkWorkspaceAccess(userId, data.workspaceId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem criar documentos');
    }

    let initialContent = data.contentJson || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
    let initialIcon = data.icon || '📄';
    let initialTitle = data.title || 'Sem título';

    // Se especificado templateId
    if (data.templateId) {
      const pred = this.predefinedTemplates.find((t) => t.id === data.templateId);
      if (pred) {
        initialContent = pred.contentJson;
        initialIcon = pred.icon;
        if (!data.title || data.title === 'Sem título') {
          initialTitle = pred.title;
        }
      } else {
        // Busca template customizado
        const customTemplate = await documentsRepository.findById(data.templateId);
        if (customTemplate && customTemplate.contentJson) {
          initialContent = customTemplate.contentJson;
          initialIcon = customTemplate.icon || '📄';
          if (!data.title || data.title === 'Sem título') {
            initialTitle = customTemplate.title;
          }
        }
      }
    }

    if (data.parentId) {
      const parentDoc = await documentsRepository.findById(data.parentId);
      if (!parentDoc || parentDoc.workspaceId !== data.workspaceId) {
        throw createHttpError(400, 'BAD_REQUEST', 'Documento pai inválido');
      }
    }

    const created = await documentsRepository.create({
      workspace: { connect: { id: data.workspaceId } },
      project: data.projectId ? { connect: { id: data.projectId } } : undefined,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      createdBy: { connect: { id: userId } },
      title: initialTitle,
      icon: initialIcon,
      contentJson: initialContent as Prisma.InputJsonValue,
      isTemplate: data.isTemplate || false,
      templateCategory: data.templateCategory || null,
    });

    return {
      id: created.id,
      workspaceId: created.workspaceId,
      projectId: created.projectId,
      parentId: created.parentId,
      title: created.title,
      icon: created.icon,
      contentJson: created.contentJson,
      isTemplate: created.isTemplate,
      templateCategory: created.templateCategory as DocTemplateCategory | null,
      createdById: created.createdById,
      createdBy: created.createdBy,
      isFavorite: false,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      deletedAt: created.deletedAt?.toISOString() || null,
      childrenCount: 0,
      commentsCount: 0,
    };
  }

  async updateDocument(
    userId: string,
    docId: string,
    data: UpdateDocumentRequest,
  ): Promise<DocumentDto> {
    const existing = await documentsRepository.findById(docId);
    if (!existing) {
      throw createHttpError(404, 'NOT_FOUND', 'Documento não encontrado');
    }

    const membership = await this.checkWorkspaceAccess(userId, existing.workspaceId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não têm permissão para editar documentos');
    }

    const updated = await documentsRepository.update(docId, {
      title: data.title,
      icon: data.icon !== undefined ? data.icon : undefined,
      contentJson:
        data.contentJson !== undefined
          ? (data.contentJson as Prisma.InputJsonValue)
          : undefined,
      isTemplate: data.isTemplate !== undefined ? data.isTemplate : undefined,
      templateCategory: data.templateCategory !== undefined ? data.templateCategory : undefined,
      project:
        data.projectId !== undefined
          ? data.projectId
            ? { connect: { id: data.projectId } }
            : { disconnect: true }
          : undefined,
    });

    const isFav = await documentsRepository.isFavorite(userId, docId);

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      projectId: updated.projectId,
      parentId: updated.parentId,
      title: updated.title,
      icon: updated.icon,
      contentJson: updated.contentJson,
      isTemplate: updated.isTemplate,
      templateCategory: updated.templateCategory as DocTemplateCategory | null,
      createdById: updated.createdById,
      createdBy: updated.createdBy,
      isFavorite: isFav,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      deletedAt: updated.deletedAt?.toISOString() || null,
      childrenCount: updated._count?.children || 0,
      commentsCount: updated._count?.comments || 0,
    };
  }

  async moveDocument(userId: string, docId: string, parentId: string | null): Promise<DocumentDto> {
    const existing = await documentsRepository.findById(docId);
    if (!existing) {
      throw createHttpError(404, 'NOT_FOUND', 'Documento não encontrado');
    }

    await this.checkWorkspaceAccess(userId, existing.workspaceId);

    if (parentId) {
      if (parentId === docId) {
        throw createHttpError(400, 'BAD_REQUEST', 'Um documento não pode ser pai de si mesmo');
      }
      const parent = await documentsRepository.findById(parentId);
      if (!parent || parent.workspaceId !== existing.workspaceId) {
        throw createHttpError(400, 'BAD_REQUEST', 'Documento pai inválido');
      }

      // Previne ciclos verificando se parentId é descendente de docId
      let currentParentId: string | null = parent.parentId;
      while (currentParentId) {
        if (currentParentId === docId) {
          throw createHttpError(400, 'BAD_REQUEST', 'Movimento circular inválido na hierarquia');
        }
        const ancestor = await documentsRepository.findById(currentParentId);
        currentParentId = ancestor?.parentId || null;
      }
    }

    const updated = await documentsRepository.update(docId, {
      parent: parentId ? { connect: { id: parentId } } : { disconnect: true },
    });

    const isFav = await documentsRepository.isFavorite(userId, docId);

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      projectId: updated.projectId,
      parentId: updated.parentId,
      title: updated.title,
      icon: updated.icon,
      contentJson: updated.contentJson,
      isTemplate: updated.isTemplate,
      templateCategory: updated.templateCategory as DocTemplateCategory | null,
      createdById: updated.createdById,
      createdBy: updated.createdBy,
      isFavorite: isFav,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      deletedAt: updated.deletedAt?.toISOString() || null,
      childrenCount: updated._count?.children || 0,
      commentsCount: updated._count?.comments || 0,
    };
  }

  async deleteDocument(userId: string, docId: string): Promise<void> {
    const existing = await documentsRepository.findById(docId);
    if (!existing) {
      throw createHttpError(404, 'NOT_FOUND', 'Documento não encontrado');
    }

    const membership = await this.checkWorkspaceAccess(userId, existing.workspaceId);
    if (membership.role === 'GUEST') {
      throw createHttpError(403, 'FORBIDDEN', 'Convidados não podem excluir documentos');
    }

    await documentsRepository.softDelete(docId);
  }

  async toggleFavorite(userId: string, docId: string): Promise<{ isFavorite: boolean }> {
    const existing = await documentsRepository.findById(docId);
    if (!existing) {
      throw createHttpError(404, 'NOT_FOUND', 'Documento não encontrado');
    }

    await this.checkWorkspaceAccess(userId, existing.workspaceId);

    const isFav = await documentsRepository.isFavorite(userId, docId);
    if (isFav) {
      await documentsRepository.removeFavorite(userId, docId);
      return { isFavorite: false };
    } else {
      await documentsRepository.setFavorite(userId, docId);
      return { isFavorite: true };
    }
  }

  async getTemplates(userId: string, workspaceId: string) {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const customTemplates = await documentsRepository.findByWorkspace({
      workspaceId,
      isTemplate: true,
    });

    return {
      predefined: this.predefinedTemplates,
      custom: customTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        description: `Modelo criado pela equipe em ${new Date(t.createdAt).toLocaleDateString('pt-BR')}`,
        category: (t.templateCategory as DocTemplateCategory) || 'GENERAL',
        icon: t.icon || '📄',
        contentJson: t.contentJson,
      })),
    };
  }

  async exportDocument(userId: string, docId: string, format: DocumentExportFormat) {
    const doc = await this.getDocumentById(userId, docId);

    if (format === 'json') {
      return {
        filename: `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`,
        mimeType: 'application/json',
        content: JSON.stringify(doc.contentJson || {}, null, 2),
      };
    }

    if (format === 'markdown') {
      const md = this.convertTipTapToMarkdown(doc.contentJson, doc.title);
      return {
        filename: `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`,
        mimeType: 'text/markdown; charset=utf-8',
        content: md,
      };
    }

    // Formato HTML limpo para Impressão / PDF
    const html = this.convertTipTapToHtml(doc.contentJson, doc.title);
    return {
      filename: `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`,
      mimeType: 'text/html; charset=utf-8',
      content: html,
    };
  }

  private convertTipTapToMarkdown(json: unknown, title: string): string {
    interface TipTapNode {
      type?: string;
      text?: string;
      attrs?: Record<string, unknown>;
      content?: TipTapNode[];
      marks?: Array<{ type?: string }>;
    }

    const doc = json as TipTapNode;
    if (!doc || !doc.content) return `# ${title}\n\n`;

    const lines: string[] = [`# ${title}\n`];

    const parseNode = (node: TipTapNode) => {
      if (!node) return;
      switch (node.type) {
        case 'heading': {
          const level = '#'.repeat(Number(node.attrs?.level) || 1);
          const text = (node.content || []).map((c) => c.text || '').join('');
          lines.push(`\n${level} ${text}\n`);
          break;
        }
        case 'paragraph': {
          const text = (node.content || [])
            .map((c) => {
              let t = c.text || '';
              if (c.marks) {
                c.marks.forEach((m) => {
                  if (m.type === 'bold') t = `**${t}**`;
                  if (m.type === 'italic') t = `*${t}*`;
                  if (m.type === 'strike') t = `~~${t}~~`;
                  if (m.type === 'code') t = `\`${t}\``;
                });
              }
              return t;
            })
            .join('');
          lines.push(`${text}\n`);
          break;
        }
        case 'bulletList':
          (node.content || []).forEach((item) => {
            const itemText = (item.content || [])
              .map((p) => (p.content || []).map((c) => c.text || '').join(''))
              .join(' ');
            lines.push(`- ${itemText}`);
          });
          lines.push('');
          break;
        case 'orderedList':
          (node.content || []).forEach((item, idx: number) => {
            const itemText = (item.content || [])
              .map((p) => (p.content || []).map((c) => c.text || '').join(''))
              .join(' ');
            lines.push(`${idx + 1}. ${itemText}`);
          });
          lines.push('');
          break;
        case 'taskList':
          (node.content || []).forEach((item) => {
            const checked = item.attrs?.checked ? 'x' : ' ';
            const itemText = (item.content || [])
              .map((p) => (p.content || []).map((c) => c.text || '').join(''))
              .join(' ');
            lines.push(`- [${checked}] ${itemText}`);
          });
          lines.push('');
          break;
        case 'blockquote':
          (node.content || []).forEach((p) => {
            const text = (p.content || []).map((c) => c.text || '').join('');
            lines.push(`> ${text}`);
          });
          lines.push('');
          break;
        case 'codeBlock': {
          const code = (node.content || []).map((c) => c.text || '').join('');
          lines.push(`\`\`\`${String(node.attrs?.language || '')}\n${code}\n\`\`\`\n`);
          break;
        }
        case 'horizontalRule':
          lines.push('\n---\n');
          break;
        default:
          if (node.content) {
            node.content.forEach(parseNode);
          }
      }
    };

    doc.content.forEach(parseNode);
    return lines.join('\n');
  }

  private convertTipTapToHtml(json: unknown, title: string): string {
    const md = this.convertTipTapToMarkdown(json, title);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { font-size: 2.2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-size: 1.6rem; margin-top: 24px; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #475569; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    ul, ol { padding-left: 24px; }
    @media print { body { max-width: 100%; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <pre style="background: none; padding: 0; white-space: pre-wrap; font-family: inherit;">${md}</pre>
</body>
</html>`;
  }
}

export const documentsService = new DocumentsService();
