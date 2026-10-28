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

export const getOpenApiDocumentation = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'FluxoPro API',
      version: '1.0.0',
      description:
        'Documentação da API REST do FluxoPro (Plataforma de Gerenciamento e Fluxo de Projetos)',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor Local de Desenvolvimento',
      },
    ],
  });
};
