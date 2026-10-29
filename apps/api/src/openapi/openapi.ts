import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  HealthCheckResponseSchema,
  ApiErrorResponseSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  AuthResponseSchema,
  MeResponseSchema,
  MessageResponseSchema,
  WorkspaceSchema,
  CreateWorkspaceRequestSchema,
  UpdateWorkspaceRequestSchema,
  WorkspaceMemberSchema,
  UpdateMemberRoleRequestSchema,
  CreateWorkspaceInviteRequestSchema,
  WorkspaceInviteSchema,
  ProjectSchema,
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  WorkflowStatusSchema,
  CreateWorkflowStatusRequestSchema,
  UpdateWorkflowStatusRequestSchema,
  ReorderWorkflowStatusesRequestSchema,
  SavedViewSchema,
  CreateSavedViewRequestSchema,
  LabelSchema,
  CreateLabelRequestSchema,
  AttachLabelRequestSchema,
  TaskSchema,
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  MoveTaskRequestSchema,
  BulkTasksActionSchema,
  ChecklistSchema,
  CreateChecklistRequestSchema,
  ChecklistItemSchema,
  CreateChecklistItemRequestSchema,
  UpdateChecklistItemRequestSchema,
  CommentSchema,
  CreateCommentRequestSchema,
  AttachmentSchema,
  CreateAttachmentRequestSchema,
  GanttProjectDataSchema,
  ProjectWorkloadSummarySchema,
  TaskDependencySchema,
  CreateTaskDependencyRequestSchema,
  AutoRescheduleResultSchema,
  ProjectBaselineSchema,
  CreateBaselineRequestSchema,
  DocumentSchema,
  CreateDocumentRequestSchema,
  UpdateDocumentRequestSchema,
  MoveDocumentRequestSchema,
  DocumentVersionSchema,
  CreateDocumentVersionRequestSchema,
  DocumentCommentSchema,
  CreateDocumentCommentRequestSchema,
  WhiteboardSchema,
  CreateWhiteboardRequestSchema,
  UpdateWhiteboardRequestSchema,
  ConvertStickyToTaskRequestSchema,
  ConvertSelectionToTasksRequestSchema,
  PredefinedWhiteboardTemplateSchema,
} from '@fluxo/shared';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// Registra Schemas Comuns, Fase 1 e Fase 2
registry.register('HealthCheckResponse', HealthCheckResponseSchema);
registry.register('ApiErrorResponse', ApiErrorResponseSchema);
registry.register('AuthResponse', AuthResponseSchema);
registry.register('MeResponse', MeResponseSchema);
registry.register('Workspace', WorkspaceSchema);
registry.register('WorkspaceMember', WorkspaceMemberSchema);
registry.register('WorkspaceInvite', WorkspaceInviteSchema);
registry.register('Project', ProjectSchema);
registry.register('WorkflowStatus', WorkflowStatusSchema);
registry.register('SavedView', SavedViewSchema);
registry.register('Label', LabelSchema);
registry.register('Task', TaskSchema);
registry.register('Checklist', ChecklistSchema);
registry.register('ChecklistItem', ChecklistItemSchema);
registry.register('Comment', CommentSchema);
registry.register('Attachment', AttachmentSchema);

// Health & Ready
registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health Check da API e Conexão com o Banco',
  responses: {
    200: {
      description: 'API saudável e conectada',
      content: { 'application/json': { schema: HealthCheckResponseSchema } },
    },
    503: {
      description: 'API degradada ou banco indisponível',
      content: { 'application/json': { schema: HealthCheckResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/ready',
  tags: ['Health'],
  summary: 'Readiness Probe para Kubernetes/Docker',
  responses: {
    200: { description: 'Pronto para receber tráfego' },
    503: { description: 'Não pronto' },
  },
});

// Auth Endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Auth'],
  summary: 'Cadastrar novo usuário e criar workspace padrão',
  request: {
    body: { content: { 'application/json': { schema: RegisterRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Usuário cadastrado com sucesso',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    409: {
      description: 'E-mail já cadastrado',
      content: { 'application/json': { schema: ApiErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  summary: 'Autenticar usuário com e-mail e senha',
  request: {
    body: { content: { 'application/json': { schema: LoginRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Autenticado com sucesso',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    401: {
      description: 'Credenciais inválidas',
      content: { 'application/json': { schema: ApiErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Rotacionar Refresh Token e emitir novo Access Token',
  responses: {
    200: {
      description: 'Token renovado com sucesso',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    401: {
      description: 'Refresh token ausente, expirado ou revogado',
      content: { 'application/json': { schema: ApiErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Revogar Refresh Token e encerrar sessão',
  responses: {
    200: {
      description: 'Sessão encerrada',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  tags: ['Auth'],
  summary: 'Obter dados do usuário autenticado e seus workspaces',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: 'Perfil do usuário e lista de workspaces',
      content: { 'application/json': { schema: MeResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Solicitar link de recuperação de senha por e-mail',
  request: {
    body: { content: { 'application/json': { schema: ForgotPasswordRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Instruções enviadas se o e-mail existir',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/reset-password',
  tags: ['Auth'],
  summary: 'Redefinir senha com token de recuperação',
  request: {
    body: { content: { 'application/json': { schema: ResetPasswordRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Senha redefinida com sucesso',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

// Workspaces Endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces',
  tags: ['Workspaces'],
  summary: 'Listar workspaces do usuário autenticado',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: 'Lista de workspaces',
      content: { 'application/json': { schema: z.array(WorkspaceSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/workspaces',
  tags: ['Workspaces'],
  summary: 'Criar novo workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateWorkspaceRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Workspace criado',
      content: { 'application/json': { schema: WorkspaceSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{id}',
  tags: ['Workspaces'],
  summary: 'Obter detalhes de um workspace (requer associação ao workspace)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Detalhes do workspace',
      content: { 'application/json': { schema: WorkspaceSchema } },
    },
    403: {
      description: 'Acesso negado (usuário não pertence ao workspace)',
      content: { 'application/json': { schema: ApiErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/workspaces/{id}',
  tags: ['Workspaces'],
  summary: 'Atualizar workspace (OWNER ou ADMIN)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdateWorkspaceRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Workspace atualizado',
      content: { 'application/json': { schema: WorkspaceSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/workspaces/{id}',
  tags: ['Workspaces'],
  summary: 'Excluir workspace (apenas OWNER)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Workspace excluído',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{id}/members',
  tags: ['Workspaces'],
  summary: 'Listar membros do workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de membros',
      content: { 'application/json': { schema: z.array(WorkspaceMemberSchema) } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/workspaces/{id}/members/{memberId}',
  tags: ['Workspaces'],
  summary: 'Alterar papel de um membro (OWNER ou ADMIN)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string(), memberId: z.string() }),
    body: { content: { 'application/json': { schema: UpdateMemberRoleRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Papel atualizado',
      content: { 'application/json': { schema: WorkspaceMemberSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/workspaces/{id}/invites',
  tags: ['Workspaces'],
  summary: 'Convidar membro por e-mail com papel definido (OWNER ou ADMIN)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateWorkspaceInviteRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Convite enviado',
      content: { 'application/json': { schema: WorkspaceInviteSchema } },
    },
  },
});

// Fase 2: Projetos, Status, Visões Salvas e Etiquetas
registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{workspaceId}/projects',
  tags: ['Projects'],
  summary: 'Listar projetos ativos de um workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ workspaceId: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de projetos do workspace',
      content: { 'application/json': { schema: z.array(ProjectSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects',
  tags: ['Projects'],
  summary: 'Criar projeto com chave única (ex.: FLX) e status padrão',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateProjectRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Projeto criado com sucesso',
      content: { 'application/json': { schema: ProjectSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: 'Obter detalhes do projeto e colunas de status',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Detalhes do projeto',
      content: { 'application/json': { schema: ProjectSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: 'Atualizar projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdateProjectRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Projeto atualizado',
      content: { 'application/json': { schema: ProjectSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: 'Excluir projeto logicamente (soft delete)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Projeto excluído',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}/statuses',
  tags: ['Projects'],
  summary: 'Listar status de fluxo do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de status',
      content: { 'application/json': { schema: z.array(WorkflowStatusSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/statuses',
  tags: ['Projects'],
  summary: 'Criar novo status de fluxo no projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateWorkflowStatusRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Status criado',
      content: { 'application/json': { schema: WorkflowStatusSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/projects/{id}/statuses/{statusId}',
  tags: ['Projects'],
  summary: 'Atualizar status de fluxo no projeto (nome, cor, limite WIP, posição)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string(), statusId: z.string() }),
    body: { content: { 'application/json': { schema: UpdateWorkflowStatusRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Status atualizado',
      content: { 'application/json': { schema: WorkflowStatusSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{id}/statuses/{statusId}',
  tags: ['Projects'],
  summary: 'Excluir status de fluxo do projeto (apenas se não houver tarefas associadas)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string(), statusId: z.string() }),
  },
  responses: {
    200: {
      description: 'Status excluído',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/statuses/reorder',
  tags: ['Projects'],
  summary: 'Reordenar colunas de status de fluxo do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: ReorderWorkflowStatusesRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Lista de status reordenada',
      content: { 'application/json': { schema: z.array(WorkflowStatusSchema) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}/saved-views',
  tags: ['Projects'],
  summary: 'Listar visões salvas do projeto (pessoais e compartilhadas)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de visões salvas',
      content: { 'application/json': { schema: z.array(SavedViewSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/saved-views',
  tags: ['Projects'],
  summary: 'Salvar visão de filtros e agrupamento do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateSavedViewRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Visão salva criada',
      content: { 'application/json': { schema: SavedViewSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{workspaceId}/labels',
  tags: ['Labels'],
  summary: 'Listar etiquetas do workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ workspaceId: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de etiquetas',
      content: { 'application/json': { schema: z.array(LabelSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/workspaces/{workspaceId}/labels',
  tags: ['Labels'],
  summary: 'Criar etiqueta no workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ workspaceId: z.string() }),
    body: { content: { 'application/json': { schema: CreateLabelRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Etiqueta criada',
      content: { 'application/json': { schema: LabelSchema } },
    },
  },
});

// Fase 2: Tarefas, Ações em Massa, Checklists, Comentários e Anexos
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/tasks',
  tags: ['Tasks'],
  summary: 'Listar e filtrar tarefas do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ projectId: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de tarefas',
      content: { 'application/json': { schema: z.array(TaskSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{projectId}/tasks',
  tags: ['Tasks'],
  summary: 'Criar tarefa com numeração sequencial por projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ projectId: z.string() }),
    body: { content: { 'application/json': { schema: CreateTaskRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Tarefa criada',
      content: { 'application/json': { schema: TaskSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Obter detalhes completos da tarefa (subtarefas, checklists, comentários, anexos)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Detalhes da tarefa',
      content: { 'application/json': { schema: TaskSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Atualizar tarefa (inline ou via drawer)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdateTaskRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Tarefa atualizada',
      content: { 'application/json': { schema: TaskSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tasks/{id}/move',
  tags: ['Tasks'],
  summary: 'Mover tarefa entre status e posições fracionárias',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: MoveTaskRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Tarefa movida',
      content: { 'application/json': { schema: TaskSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tasks/bulk',
  tags: ['Tasks'],
  summary: 'Executar ação em massa sobre múltiplas tarefas',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: BulkTasksActionSchema } } },
  },
  responses: {
    200: {
      description: 'Ação em massa executada',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Excluir tarefa logicamente (soft delete)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Tarefa excluída',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tasks/{id}/labels',
  tags: ['Tasks'],
  summary: 'Vincular etiqueta a uma tarefa',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: AttachLabelRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Etiqueta vinculada',
      content: { 'application/json': { schema: TaskSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tasks/{id}/checklists',
  tags: ['Tasks'],
  summary: 'Criar checklist em uma tarefa',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateChecklistRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Checklist criada',
      content: { 'application/json': { schema: ChecklistSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/checklists/{checklistId}/items',
  tags: ['Tasks'],
  summary: 'Adicionar item a uma checklist',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ checklistId: z.string() }),
    body: { content: { 'application/json': { schema: CreateChecklistItemRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Item adicionado',
      content: { 'application/json': { schema: ChecklistItemSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/checklist-items/{itemId}',
  tags: ['Tasks'],
  summary: 'Atualizar ou marcar item de checklist como concluído',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ itemId: z.string() }),
    body: { content: { 'application/json': { schema: UpdateChecklistItemRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Item atualizado',
      content: { 'application/json': { schema: ChecklistItemSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/tasks/{id}/comments',
  tags: ['Tasks'],
  summary: 'Listar comentários da tarefa',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de comentários',
      content: { 'application/json': { schema: z.array(CommentSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tasks/{id}/comments',
  tags: ['Tasks'],
  summary: 'Adicionar comentário com suporte a menções (@)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateCommentRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Comentário adicionado',
      content: { 'application/json': { schema: CommentSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/tasks/{id}/attachments',
  tags: ['Tasks'],
  summary: 'Listar anexos da tarefa',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de anexos',
      content: { 'application/json': { schema: z.array(AttachmentSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tasks/{id}/attachments',
  tags: ['Tasks'],
  summary: 'Registrar anexo validado na tarefa',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateAttachmentRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Anexo registrado',
      content: { 'application/json': { schema: AttachmentSchema } },
    },
  },
});

// -------------------------------------------------------------
// Fase 4: Gantt, Dependências, Baselines e Workload
// -------------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}/gantt',
  tags: ['Gantt'],
  summary: 'Obter dados completos do gráfico de Gantt com CPM e dependências',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ baselineId: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'Dados do Gantt calculados com caminho crítico',
      content: { 'application/json': { schema: z.object({ data: GanttProjectDataSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}/workload',
  tags: ['Gantt'],
  summary: 'Obter análise de carga de trabalho e capacidade por membro',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Resumo de carga de trabalho por membro',
      content: { 'application/json': { schema: z.object({ data: ProjectWorkloadSummarySchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}/dependencies',
  tags: ['Dependencies'],
  summary: 'Listar dependências entre tarefas do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de dependências',
      content: { 'application/json': { schema: z.object({ data: z.array(TaskDependencySchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/dependencies',
  tags: ['Dependencies'],
  summary: 'Criar dependência com validação de ciclos em grafo (DAG)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateTaskDependencyRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Dependência criada com sucesso',
      content: { 'application/json': { schema: z.object({ data: TaskDependencySchema }) } },
    },
    422: {
      description: 'Ciclo detectado ou auto-dependência',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{id}/dependencies/{dependencyId}',
  tags: ['Dependencies'],
  summary: 'Remover dependência entre tarefas',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string(), dependencyId: z.string() }),
  },
  responses: {
    204: {
      description: 'Dependência removida com sucesso',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/auto-reschedule',
  tags: ['Dependencies'],
  summary: 'Reagendar tarefas sucessoras automaticamente respeitando dependências',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Tarefas reagendadas',
      content: { 'application/json': { schema: z.object({ data: AutoRescheduleResultSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}/baselines',
  tags: ['Baselines'],
  summary: 'Listar linhas de base salvas do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Lista de linhas de base',
      content: { 'application/json': { schema: z.object({ data: z.array(ProjectBaselineSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/baselines',
  tags: ['Baselines'],
  summary: 'Criar snapshot de linha de base do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateBaselineRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Linha de base criada com sucesso',
      content: { 'application/json': { schema: z.object({ data: ProjectBaselineSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{workspaceId}/documents',
  tags: ['Documents'],
  summary: 'Listar documentos do workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ workspaceId: z.string() }),
    query: z.object({ projectId: z.string().optional(), isTemplate: z.string().optional(), search: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'Lista de documentos',
      content: { 'application/json': { schema: z.object({ data: z.array(DocumentSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{workspaceId}/documents/tree',
  tags: ['Documents'],
  summary: 'Obter árvore hierárquica de documentos',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ workspaceId: z.string() }),
    query: z.object({ projectId: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'Árvore de documentos',
      content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/documents',
  tags: ['Documents'],
  summary: 'Criar novo documento ou subpágina',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateDocumentRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Documento criado',
      content: { 'application/json': { schema: z.object({ data: DocumentSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/documents/{id}',
  tags: ['Documents'],
  summary: 'Obter detalhes do documento por ID',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Detalhes do documento',
      content: { 'application/json': { schema: z.object({ data: DocumentSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/documents/{id}',
  tags: ['Documents'],
  summary: 'Atualizar documento',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdateDocumentRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Documento atualizado',
      content: { 'application/json': { schema: z.object({ data: DocumentSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/documents/{id}',
  tags: ['Documents'],
  summary: 'Excluir documento (soft delete)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    204: {
      description: 'Documento excluído',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/documents/{id}/favorite',
  tags: ['Documents'],
  summary: 'Alternar favorito do documento',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Status de favorito atualizado',
      content: { 'application/json': { schema: z.object({ data: z.object({ isFavorite: z.boolean() }) }) } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/documents/{id}/move',
  tags: ['Documents'],
  summary: 'Mover documento na árvore hierárquica',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: MoveDocumentRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Documento movido com sucesso',
      content: { 'application/json': { schema: z.object({ data: DocumentSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/documents/{id}/versions',
  tags: ['Document Versions'],
  summary: 'Listar versões de um documento',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Histórico de versões',
      content: { 'application/json': { schema: z.object({ data: z.array(DocumentVersionSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/documents/{id}/versions',
  tags: ['Document Versions'],
  summary: 'Salvar snapshot manual de versão',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateDocumentVersionRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Versão criada',
      content: { 'application/json': { schema: z.object({ data: DocumentVersionSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/documents/{id}/versions/{versionId}/restore',
  tags: ['Document Versions'],
  summary: 'Restaurar documento para uma versão anterior',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string(), versionId: z.string() }),
  },
  responses: {
    200: {
      description: 'Versão restaurada',
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/documents/{id}/comments',
  tags: ['Document Comments'],
  summary: 'Listar comentários inline do documento',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Comentários do documento',
      content: { 'application/json': { schema: z.object({ data: z.array(DocumentCommentSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/documents/{id}/comments',
  tags: ['Document Comments'],
  summary: 'Criar comentário inline no documento',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CreateDocumentCommentRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Comentário criado',
      content: { 'application/json': { schema: z.object({ data: DocumentCommentSchema }) } },
    },
  },
});

// -------------------------------------------------------------
// Fase 6: Quadros Brancos (Whiteboards)
// -------------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/v1/whiteboards/templates',
  tags: ['Whiteboards'],
  summary: 'Listar modelos pré-definidos de quadros brancos',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: 'Modelos de quadros brancos',
      content: { 'application/json': { schema: z.object({ data: z.array(PredefinedWhiteboardTemplateSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/workspaces/{workspaceId}/whiteboards',
  tags: ['Whiteboards'],
  summary: 'Listar quadros brancos do workspace',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ workspaceId: z.string() }),
    query: z.object({
      projectId: z.string().optional(),
      search: z.string().optional(),
      isTemplate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Lista de quadros brancos',
      content: { 'application/json': { schema: z.object({ data: z.array(WhiteboardSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/whiteboards',
  tags: ['Whiteboards'],
  summary: 'Criar novo quadro branco',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateWhiteboardRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Quadro branco criado com sucesso',
      content: { 'application/json': { schema: z.object({ data: WhiteboardSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/whiteboards/{id}',
  tags: ['Whiteboards'],
  summary: 'Obter detalhes e elementos do quadro branco',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Detalhes do quadro branco',
      content: { 'application/json': { schema: z.object({ data: WhiteboardSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/whiteboards/{id}',
  tags: ['Whiteboards'],
  summary: 'Atualizar metadados ou snapshot do quadro branco',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdateWhiteboardRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Quadro branco atualizado',
      content: { 'application/json': { schema: z.object({ data: WhiteboardSchema }) } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/whiteboards/{id}',
  tags: ['Whiteboards'],
  summary: 'Excluir quadro branco (soft delete)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Quadro branco excluído',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/whiteboards/{id}/convert-sticky',
  tags: ['Whiteboards'],
  summary: 'Converter nota adesiva em tarefa real no projeto e criar vínculo EntityLink',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: ConvertStickyToTaskRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Nota convertida em tarefa',
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/whiteboards/{id}/convert-selection',
  tags: ['Whiteboards'],
  summary: 'Converter seleção múltipla de notas em tarefas do projeto',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: ConvertSelectionToTasksRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Seleção convertida em tarefas',
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/whiteboards/{id}/export',
  tags: ['Whiteboards'],
  summary: 'Exportar quadro branco em SVG ou JSON',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ format: z.enum(['svg', 'json']).optional() }),
  },
  responses: {
    200: {
      description: 'Arquivo exportado',
    },
  },
});

export const getOpenApiDocumentation = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Cacique Agil API',
      version: '1.0.0',
      description:
        'Documentação da API REST do Cacique Agil (Plataforma de Gerenciamento e Fluxo de Projetos)',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor Local de Desenvolvimento',
      },
    ],
  });
};
