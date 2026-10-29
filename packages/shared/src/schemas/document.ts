import { z } from 'zod';

export const DocTemplateCategoryEnum = z.enum([
  'MEETING',
  'PRD',
  'RETROSPECTIVE',
  'GENERAL',
]);
export type DocTemplateCategory = z.infer<typeof DocTemplateCategoryEnum>;

export const DocumentExportFormatEnum = z.enum(['markdown', 'html', 'json']);
export type DocumentExportFormat = z.infer<typeof DocumentExportFormatEnum>;

// Schema de autor simplificado
export const DocAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
});
export type DocAuthorDto = z.infer<typeof DocAuthorSchema>;

// Documento individual
export const DocumentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  title: z.string(),
  icon: z.string().nullable().optional(),
  contentJson: z.unknown().nullable().optional(),
  isTemplate: z.boolean().default(false),
  templateCategory: DocTemplateCategoryEnum.nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdBy: DocAuthorSchema.nullable().optional(),
  isFavorite: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  deletedAt: z.string().or(z.date()).nullable().optional(),
  childrenCount: z.number().int().default(0),
  commentsCount: z.number().int().default(0),
});
export type DocumentDto = z.infer<typeof DocumentSchema>;

// Nó de árvore de documentos
export interface DocumentTreeNodeDto {
  id: string;
  workspaceId: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  icon: string | null;
  isTemplate: boolean;
  templateCategory?: DocTemplateCategory | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  children: DocumentTreeNodeDto[];
}

export const DocumentTreeNodeSchema: z.ZodType<DocumentTreeNodeDto> = z.lazy(() =>
  z.object({
    id: z.string(),
    workspaceId: z.string(),
    projectId: z.string().nullable(),
    parentId: z.string().nullable(),
    title: z.string(),
    icon: z.string().nullable(),
    isTemplate: z.boolean(),
    templateCategory: DocTemplateCategoryEnum.nullable().optional(),
    isFavorite: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    children: z.array(DocumentTreeNodeSchema),
  }),
);

// Requisições para criar/atualizar documento
export const CreateDocumentRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID é obrigatório'),
  projectId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  title: z.string().min(1, 'Título é obrigatório').default('Sem título'),
  icon: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  isTemplate: z.boolean().optional().default(false),
  templateCategory: DocTemplateCategoryEnum.nullable().optional(),
  templateId: z.string().optional(), // Quando criado a partir de um template existente
});
export type CreateDocumentRequest = z.input<typeof CreateDocumentRequestSchema>;

export const UpdateDocumentRequestSchema = z.object({
  title: z.string().min(1, 'Título não pode ser vazio').optional(),
  icon: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  isTemplate: z.boolean().optional(),
  templateCategory: DocTemplateCategoryEnum.nullable().optional(),
});
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentRequestSchema>;

export const MoveDocumentRequestSchema = z.object({
  parentId: z.string().nullable(),
});
export type MoveDocumentRequest = z.infer<typeof MoveDocumentRequestSchema>;

// Versão de documento
export const DocumentVersionSchema = z.object({
  id: z.string(),
  docId: z.string(),
  versionNumber: z.number().int(),
  name: z.string().nullable().optional(),
  contentJson: z.unknown().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdBy: DocAuthorSchema.nullable().optional(),
  createdAt: z.string().or(z.date()),
});
export type DocumentVersionDto = z.infer<typeof DocumentVersionSchema>;

export const CreateDocumentVersionRequestSchema = z.object({
  name: z.string().min(1, 'Nome ou rótulo da versão é obrigatório'),
});
export type CreateDocumentVersionRequest = z.infer<
  typeof CreateDocumentVersionRequestSchema
>;

// Comentários em documentos
export const DocumentCommentSchema = z.object({
  id: z.string(),
  docId: z.string(),
  authorId: z.string(),
  author: DocAuthorSchema,
  body: z.unknown(),
  selectedText: z.string().nullable().optional(),
  resolvedAt: z.string().or(z.date()).nullable().optional(),
  resolvedById: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type DocumentCommentDto = z.infer<typeof DocumentCommentSchema>;

export const CreateDocumentCommentRequestSchema = z.object({
  body: z.union([z.string(), z.record(z.unknown())]),
  selectedText: z.string().optional(),
});
export type CreateDocumentCommentRequest = z.infer<
  typeof CreateDocumentCommentRequestSchema
>;

export const UpdateDocumentCommentRequestSchema = z.object({
  body: z.union([z.string(), z.record(z.unknown())]).optional(),
  resolved: z.boolean().optional(),
});
export type UpdateDocumentCommentRequest = z.infer<
  typeof UpdateDocumentCommentRequestSchema
>;

// Modelos pré-definidos (Templates)
export interface PredefinedTemplateDto {
  id: string;
  title: string;
  description: string;
  category: DocTemplateCategory;
  icon: string;
  contentJson: Record<string, unknown>;
}
