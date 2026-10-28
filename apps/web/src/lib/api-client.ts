import {
  AttachmentDto,
  AuthResponse,
  BulkTasksActionRequest,
  ChecklistDto,
  ChecklistItemDto,
  CommentDto,
  CreateAttachmentRequest,
  CreateChecklistItemRequest,
  CreateChecklistRequest,
  CreateCommentRequest,
  CreateLabelRequest,
  CreateProjectRequest,
  CreateSavedViewRequest,
  CreateTaskRequest,
  CreateWorkflowStatusRequest,
  CreateWorkspaceInviteRequest,
  CreateWorkspaceRequest,
  ForgotPasswordRequest,
  LabelDto,
  LoginRequest,
  MeResponse,
  MessageResponse,
  MoveTaskRequest,
  ProjectDto,
  RegisterRequest,
  ResetPasswordRequest,
  SavedViewDto,
  TaskDto,
  TaskFilterQuery,
  UpdateChecklistItemRequest,
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
