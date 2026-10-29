import {
  AttachmentDto,
  AuthResponse,
  AutoRescheduleResult,
  BulkTasksActionRequest,
  ChecklistDto,
  ChecklistItemDto,
  CommentDto,
  CreateAttachmentRequest,
  CreateBaselineRequest,
  CreateChecklistItemRequest,
  CreateChecklistRequest,
  CreateCommentRequest,
  CreateDocumentRequest,
  CreateLabelRequest,
  CreateProjectRequest,
  CreateSavedViewRequest,
  CreateTaskDependencyRequest,
  CreateTaskRequest,
  CreateWorkflowStatusRequest,
  CreateWorkspaceInviteRequest,
  CreateWorkspaceRequest,
  DocumentCommentDto,
  DocumentDto,
  DocumentTreeNodeDto,
  DocumentVersionDto,
  ForgotPasswordRequest,
  GanttProjectDataDto,
  LabelDto,
  LoginRequest,
  MeResponse,
  MessageResponse,
  MoveTaskRequest,
  PredefinedTemplateDto,
  ProjectBaselineDto,
  ProjectDto,
  ProjectWorkloadSummaryDto,
  RegisterRequest,
  ResetPasswordRequest,
  SavedViewDto,
  TaskDependencyDto,
  TaskDto,
  TaskFilterQuery,
  UpdateChecklistItemRequest,
  UpdateDocumentRequest,
  UpdateMemberRoleRequest,
  UpdateProjectRequest,
  UpdateTaskRequest,
  UpdateWorkflowStatusRequest,
  UpdateWorkspaceRequest,
  WorkflowStatusDto,
  WorkspaceDto,
  WorkspaceInviteDto,
  WorkspaceMemberDto,
} from '@fluxo/shared';
import { useAuthStore, mapMembershipsToWorkspaces } from '@/features/auth/auth-store';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        useAuthStore.getState().clearSession();
        return null;
      }

      const data = (await res.json()) as AuthResponse;
      useAuthStore.getState().setSession({
        accessToken: data.accessToken,
        user: data.user,
        workspaces: mapMembershipsToWorkspaces(data.workspaces),
      });
      return data.accessToken;
    } catch {
      useAuthStore.getState().clearSession();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const { skipAuthRefresh, headers: customHeaders, ...restOptions } = options;
  const state = useAuthStore.getState();
  let token = state.accessToken;

  if (!token && typeof window !== 'undefined') {
    try {
      token = window.localStorage.getItem('fluxopro_access_token');
    } catch {
      token = null;
    }
  }

  const buildHeaders = (bearerToken: string | null): HeadersInit => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };
    if (bearerToken) {
      h.Authorization = `Bearer ${bearerToken}`;
    }
    return h;
  };

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    credentials: 'include',
    headers: buildHeaders(token),
  });

  if (res.status === 401 && !skipAuthRefresh && !endpoint.startsWith('/auth/')) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        credentials: 'include',
        headers: buildHeaders(newToken),
      });
    }
  }

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const errorMsg = body?.error?.message || `Erro na requisição (${res.status})`;
    const errorCode = body?.error?.code || 'HTTP_ERROR';
    const errorDetails = body?.error?.details;
    throw new ApiClientError(errorMsg, res.status, errorCode, errorDetails);
  }

  return body as T;
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`API retornou status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Falha ao conectar com a API:', error);
    return null;
  }
}

export const authApi = {
  register(input: RegisterRequest) {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRefresh: true,
    });
  },
  login(input: LoginRequest) {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRefresh: true,
    });
  },
  refresh() {
    return apiRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  },
  logout() {
    return apiRequest<MessageResponse>('/auth/logout', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  },
  me() {
    return apiRequest<MeResponse>('/auth/me');
  },
  forgotPassword(input: ForgotPasswordRequest) {
    return apiRequest<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRefresh: true,
    });
  },
  resetPassword(input: ResetPasswordRequest) {
    return apiRequest<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuthRefresh: true,
    });
  },
};

export const workspacesApi = {
  list() {
    return apiRequest<WorkspaceDto[]>('/workspaces');
  },
  create(input: CreateWorkspaceRequest) {
    return apiRequest<WorkspaceDto>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  getById(idOrSlug: string) {
    return apiRequest<WorkspaceDto>(`/workspaces/${encodeURIComponent(idOrSlug)}`);
  },
  update(idOrSlug: string, input: UpdateWorkspaceRequest) {
    return apiRequest<WorkspaceDto>(`/workspaces/${encodeURIComponent(idOrSlug)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  remove(idOrSlug: string) {
    return apiRequest<MessageResponse>(`/workspaces/${encodeURIComponent(idOrSlug)}`, {
      method: 'DELETE',
    });
  },
  listMembers(idOrSlug: string) {
    return apiRequest<WorkspaceMemberDto[]>(
      `/workspaces/${encodeURIComponent(idOrSlug)}/members`,
    );
  },
  updateMemberRole(idOrSlug: string, memberId: string, input: UpdateMemberRoleRequest) {
    return apiRequest<WorkspaceMemberDto>(
      `/workspaces/${encodeURIComponent(idOrSlug)}/members/${encodeURIComponent(memberId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },
  removeMember(idOrSlug: string, memberId: string) {
    return apiRequest<MessageResponse>(
      `/workspaces/${encodeURIComponent(idOrSlug)}/members/${encodeURIComponent(memberId)}`,
      {
        method: 'DELETE',
      },
    );
  },
  listInvites(idOrSlug: string) {
    return apiRequest<WorkspaceInviteDto[]>(
      `/workspaces/${encodeURIComponent(idOrSlug)}/invites`,
    );
  },
  createInvite(idOrSlug: string, input: CreateWorkspaceInviteRequest) {
    return apiRequest<WorkspaceInviteDto>(
      `/workspaces/${encodeURIComponent(idOrSlug)}/invites`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  getInviteByToken(token: string) {
    return apiRequest<WorkspaceInviteDto>(`/workspaces/invites/${encodeURIComponent(token)}`);
  },
  acceptInvite(token: string) {
    return apiRequest<{
      message: string;
      workspace: { id: string; name: string; slug: string };
      role: string;
    }>(`/workspaces/invites/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
    });
  },
};

export const projectsApi = {
  listByWorkspace(workspaceIdOrSlug: string) {
    return apiRequest<ProjectDto[]>(
      `/workspaces/${encodeURIComponent(workspaceIdOrSlug)}/projects`,
    );
  },
  create(input: CreateProjectRequest) {
    return apiRequest<ProjectDto>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  getById(projectId: string) {
    return apiRequest<ProjectDto>(`/projects/${encodeURIComponent(projectId)}`);
  },
  update(projectId: string, input: UpdateProjectRequest) {
    return apiRequest<ProjectDto>(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  remove(projectId: string) {
    return apiRequest<MessageResponse>(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
    });
  },
  listStatuses(projectId: string) {
    return apiRequest<WorkflowStatusDto[]>(
      `/projects/${encodeURIComponent(projectId)}/statuses`,
    );
  },
  createStatus(projectId: string, input: CreateWorkflowStatusRequest) {
    return apiRequest<WorkflowStatusDto>(
      `/projects/${encodeURIComponent(projectId)}/statuses`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  updateStatus(
    projectId: string,
    statusId: string,
    input: UpdateWorkflowStatusRequest,
  ) {
    return apiRequest<WorkflowStatusDto>(
      `/projects/${encodeURIComponent(projectId)}/statuses/${encodeURIComponent(statusId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },
  deleteStatus(projectId: string, statusId: string) {
    return apiRequest<MessageResponse>(
      `/projects/${encodeURIComponent(projectId)}/statuses/${encodeURIComponent(statusId)}`,
      {
        method: 'DELETE',
      },
    );
  },
  reorderStatuses(projectId: string, statusIds: string[]) {
    return apiRequest<WorkflowStatusDto[]>(
      `/projects/${encodeURIComponent(projectId)}/statuses/reorder`,
      {
        method: 'POST',
        body: JSON.stringify({ statusIds }),
      },
    );
  },
  listSavedViews(projectId: string) {
    return apiRequest<SavedViewDto[]>(
      `/projects/${encodeURIComponent(projectId)}/saved-views`,
    );
  },
  createSavedView(projectId: string, input: CreateSavedViewRequest) {
    return apiRequest<SavedViewDto>(
      `/projects/${encodeURIComponent(projectId)}/saved-views`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  deleteSavedView(viewId: string) {
    return apiRequest<MessageResponse>(`/saved-views/${encodeURIComponent(viewId)}`, {
      method: 'DELETE',
    });
  },
  listWorkspaceLabels(workspaceIdOrSlug: string) {
    return apiRequest<LabelDto[]>(
      `/workspaces/${encodeURIComponent(workspaceIdOrSlug)}/labels`,
    );
  },
  createWorkspaceLabel(workspaceIdOrSlug: string, input: CreateLabelRequest) {
    return apiRequest<LabelDto>(
      `/workspaces/${encodeURIComponent(workspaceIdOrSlug)}/labels`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  deleteWorkspaceLabel(labelId: string) {
    return apiRequest<MessageResponse>(`/labels/${encodeURIComponent(labelId)}`, {
      method: 'DELETE',
    });
  },
};

export const tasksApi = {
  listByProject(projectId: string, filters: TaskFilterQuery = {}) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    return apiRequest<TaskDto[]>(
      `/projects/${encodeURIComponent(projectId)}/tasks${qs ? `?${qs}` : ''}`,
    );
  },
  create(projectId: string, input: CreateTaskRequest) {
    return apiRequest<TaskDto>(`/projects/${encodeURIComponent(projectId)}/tasks`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  getById(taskId: string) {
    return apiRequest<TaskDto>(`/tasks/${encodeURIComponent(taskId)}`);
  },
  update(taskId: string, input: UpdateTaskRequest) {
    return apiRequest<TaskDto>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  move(taskId: string, input: MoveTaskRequest) {
    return apiRequest<TaskDto>(`/tasks/${encodeURIComponent(taskId)}/move`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  remove(taskId: string) {
    return apiRequest<MessageResponse>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
    });
  },
  bulkAction(input: BulkTasksActionRequest) {
    return apiRequest<{ message: string; updatedCount: number }>('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  attachLabel(taskId: string, labelId: string) {
    return apiRequest<TaskDto>(`/tasks/${encodeURIComponent(taskId)}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labelId }),
    });
  },
  detachLabel(taskId: string, labelId: string) {
    return apiRequest<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}/labels/${encodeURIComponent(labelId)}`,
      {
        method: 'DELETE',
      },
    );
  },
  createChecklist(taskId: string, input: CreateChecklistRequest) {
    return apiRequest<ChecklistDto>(
      `/tasks/${encodeURIComponent(taskId)}/checklists`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  deleteChecklist(checklistId: string) {
    return apiRequest<MessageResponse>(
      `/checklists/${encodeURIComponent(checklistId)}`,
      {
        method: 'DELETE',
      },
    );
  },
  addChecklistItem(checklistId: string, input: CreateChecklistItemRequest) {
    return apiRequest<ChecklistItemDto>(
      `/checklists/${encodeURIComponent(checklistId)}/items`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  updateChecklistItem(itemId: string, input: UpdateChecklistItemRequest) {
    return apiRequest<ChecklistItemDto>(
      `/checklist-items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },
  deleteChecklistItem(itemId: string) {
    return apiRequest<MessageResponse>(
      `/checklist-items/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',
      },
    );
  },
  listComments(taskId: string) {
    return apiRequest<CommentDto[]>(`/tasks/${encodeURIComponent(taskId)}/comments`);
  },
  createComment(taskId: string, input: CreateCommentRequest) {
    return apiRequest<CommentDto>(`/tasks/${encodeURIComponent(taskId)}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  deleteComment(commentId: string) {
    return apiRequest<MessageResponse>(
      `/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
      },
    );
  },
  listAttachments(taskId: string) {
    return apiRequest<AttachmentDto[]>(
      `/tasks/${encodeURIComponent(taskId)}/attachments`,
    );
  },
  createAttachment(taskId: string, input: CreateAttachmentRequest) {
    return apiRequest<AttachmentDto>(
      `/tasks/${encodeURIComponent(taskId)}/attachments`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  deleteAttachment(attachmentId: string) {
    return apiRequest<MessageResponse>(
      `/attachments/${encodeURIComponent(attachmentId)}`,
      {
        method: 'DELETE',
      },
    );
  },
};

export const ganttApi = {
  async getGantt(projectId: string, baselineId?: string) {
    const query = baselineId ? `?baselineId=${encodeURIComponent(baselineId)}` : '';
    const res = await apiRequest<{ data: GanttProjectDataDto }>(
      `/projects/${encodeURIComponent(projectId)}/gantt${query}`,
    );
    return res.data;
  },

  async getWorkload(projectId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await apiRequest<{ data: ProjectWorkloadSummaryDto }>(
      `/projects/${encodeURIComponent(projectId)}/workload${query}`,
    );
    return res.data;
  },

  async getDependencies(projectId: string) {
    const res = await apiRequest<{ data: TaskDependencyDto[] }>(
      `/projects/${encodeURIComponent(projectId)}/dependencies`,
    );
    return res.data;
  },

  async createDependency(projectId: string, input: CreateTaskDependencyRequest) {
    const res = await apiRequest<{ data: TaskDependencyDto }>(
      `/projects/${encodeURIComponent(projectId)}/dependencies`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async deleteDependency(projectId: string, dependencyId: string) {
    return apiRequest<void>(
      `/projects/${encodeURIComponent(projectId)}/dependencies/${encodeURIComponent(dependencyId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  async autoReschedule(projectId: string) {
    const res = await apiRequest<{ data: AutoRescheduleResult }>(
      `/projects/${encodeURIComponent(projectId)}/auto-reschedule`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
    return res.data;
  },

  async getBaselines(projectId: string) {
    const res = await apiRequest<{ data: ProjectBaselineDto[] }>(
      `/projects/${encodeURIComponent(projectId)}/baselines`,
    );
    return res.data;
  },

  async getBaseline(projectId: string, baselineId: string) {
    const res = await apiRequest<{ data: ProjectBaselineDto }>(
      `/projects/${encodeURIComponent(projectId)}/baselines/${encodeURIComponent(baselineId)}`,
    );
    return res.data;
  },

  async createBaseline(projectId: string, input: CreateBaselineRequest) {
    const res = await apiRequest<{ data: ProjectBaselineDto }>(
      `/projects/${encodeURIComponent(projectId)}/baselines`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async deleteBaseline(projectId: string, baselineId: string) {
    return apiRequest<void>(
      `/projects/${encodeURIComponent(projectId)}/baselines/${encodeURIComponent(baselineId)}`,
      {
        method: 'DELETE',
      },
    );
  },
};

export const documentsApi = {
  async list(
    workspaceId: string,
    params?: { projectId?: string; isTemplate?: boolean; search?: string },
  ) {
    const sp = new URLSearchParams();
    if (params?.projectId) sp.set('projectId', params.projectId);
    if (params?.isTemplate !== undefined) sp.set('isTemplate', String(params.isTemplate));
    if (params?.search) sp.set('search', params.search);
    const qs = sp.toString() ? `?${sp.toString()}` : '';

    const res = await apiRequest<{ data: DocumentDto[] }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/documents${qs}`,
    );
    return res.data;
  },

  async getTree(workspaceId: string, projectId?: string) {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await apiRequest<{ data: DocumentTreeNodeDto[] }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/documents/tree${qs}`,
    );
    return res.data;
  },

  async getById(id: string) {
    const res = await apiRequest<{ data: DocumentDto }>(
      `/documents/${encodeURIComponent(id)}`,
    );
    return res.data;
  },

  async create(input: CreateDocumentRequest) {
    const res = await apiRequest<{ data: DocumentDto }>('/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async update(id: string, input: UpdateDocumentRequest) {
    const res = await apiRequest<{ data: DocumentDto }>(
      `/documents/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async move(id: string, parentId: string | null) {
    const res = await apiRequest<{ data: DocumentDto }>(
      `/documents/${encodeURIComponent(id)}/move`,
      {
        method: 'POST',
        body: JSON.stringify({ parentId }),
      },
    );
    return res.data;
  },

  async delete(id: string) {
    return apiRequest<void>(`/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async toggleFavorite(id: string) {
    const res = await apiRequest<{ data: { isFavorite: boolean } }>(
      `/documents/${encodeURIComponent(id)}/favorite`,
      {
        method: 'POST',
      },
    );
    return res.data;
  },

  async getTemplates(workspaceId: string) {
    const res = await apiRequest<{
      data: { predefined: PredefinedTemplateDto[]; custom: PredefinedTemplateDto[] };
    }>(`/workspaces/${encodeURIComponent(workspaceId)}/documents/templates`);
    return res.data;
  },

  async export(id: string, format: 'markdown' | 'html' | 'json') {
    const url = `${API_BASE_URL}/documents/${encodeURIComponent(id)}/export?format=${format}`;
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error('Falha ao exportar documento');
    }
    return response.text();
  },

  async getVersions(id: string) {
    const res = await apiRequest<{ data: DocumentVersionDto[] }>(
      `/documents/${encodeURIComponent(id)}/versions`,
    );
    return res.data;
  },

  async createVersion(id: string, name: string) {
    const res = await apiRequest<{ data: DocumentVersionDto }>(
      `/documents/${encodeURIComponent(id)}/versions`,
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      },
    );
    return res.data;
  },

  async restoreVersion(id: string, versionId: string) {
    const res = await apiRequest<{ data: { message: string; document: DocumentDto } }>(
      `/documents/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`,
      {
        method: 'POST',
      },
    );
    return res.data;
  },

  async getComments(id: string) {
    const res = await apiRequest<{ data: DocumentCommentDto[] }>(
      `/documents/${encodeURIComponent(id)}/comments`,
    );
    return res.data;
  },

  async createComment(id: string, input: { body: unknown; selectedText?: string }) {
    const res = await apiRequest<{ data: DocumentCommentDto }>(
      `/documents/${encodeURIComponent(id)}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async updateComment(commentId: string, input: { body?: unknown; resolved?: boolean }) {
    const res = await apiRequest<{ data: DocumentCommentDto }>(
      `/documents/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async deleteComment(commentId: string) {
    return apiRequest<void>(
      `/documents/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
      },
    );
  },
};
