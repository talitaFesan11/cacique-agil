import crypto from 'crypto';
import {
  ProjectStatus,
  StatusCategory,
  TaskPriority,
  WorkspaceRole,
} from '@fluxo/shared';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  passwordHash: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipRecord {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenHash: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface WorkspaceInviteRecord {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ProjectRecord {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  color: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  ownerId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStatusRecord {
  id: string;
  projectId: string;
  name: string;
  category: StatusCategory;
  position: number;
  wipLimit: number | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: unknown;
  statusId: string;
  priority: TaskPriority;
  parentId: string | null;
  assigneeIds: string[];
  startDate: Date | null;
  dueDate: Date | null;
  estimateMinutes: number | null;
  progress: number;
  isMilestone: boolean;
  position: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabelRecord {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskLabelRecord {
  taskId: string;
  labelId: string;
  createdAt: Date;
}

export interface ChecklistRecord {
  id: string;
  taskId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItemRecord {
  id: string;
  checklistId: string;
  text: string;
  done: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentRecord {
  id: string;
  taskId: string | null;
  docId: string | null;
  authorId: string;
  body: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentRecord {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: Date;
}

export interface SavedViewRecord {
  id: string;
  projectId: string;
  ownerId: string;
  type: string;
  name: string;
  config: unknown;
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createInMemoryPrisma() {
  const users = new Map<string, UserRecord>();
  const workspaces = new Map<string, WorkspaceRecord>();
  const memberships = new Map<string, MembershipRecord>();
  const refreshTokens = new Map<string, RefreshTokenRecord>();
  const passwordResetTokens = new Map<string, PasswordResetTokenRecord>();
  const workspaceInvites = new Map<string, WorkspaceInviteRecord>();
  const projects = new Map<string, ProjectRecord>();
  const workflowStatuses = new Map<string, WorkflowStatusRecord>();
  const tasks = new Map<string, TaskRecord>();
  const labels = new Map<string, LabelRecord>();
  const taskLabels = new Map<string, TaskLabelRecord>();
  const checklists = new Map<string, ChecklistRecord>();
  const checklistItems = new Map<string, ChecklistItemRecord>();
  const comments = new Map<string, CommentRecord>();
  const attachments = new Map<string, AttachmentRecord>();
  const savedViews = new Map<string, SavedViewRecord>();

  const cuid = () => `c${crypto.randomBytes(12).toString('hex')}`;

  const getUserMembershipsWithWorkspace = (userId: string) => {
    return Array.from(memberships.values())
      .filter((m) => m.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => ({
        ...m,
        workspace: workspaces.get(m.workspaceId)!,
      }));
  };

  const getProjectRelations = (project: ProjectRecord) => {
    const projStatuses = Array.from(workflowStatuses.values())
      .filter((s) => s.projectId === project.id)
      .sort((a, b) => a.position - b.position);
    const projTasks = Array.from(tasks.values())
      .filter((t) => t.projectId === project.id && t.deletedAt === null)
      .map((t) => ({ id: t.id, statusId: t.statusId, progress: t.progress }));
    return {
      ...project,
      statuses: projStatuses,
      tasks: projTasks,
    };
  };

  const getTaskWithRelations = (task: TaskRecord) => {
    const project = projects.get(task.projectId)!;
    const status = workflowStatuses.get(task.statusId);
    const tLabels = Array.from(taskLabels.values())
      .filter((tl) => tl.taskId === task.id)
      .map((tl) => ({
        ...tl,
        label: labels.get(tl.labelId)!,
      }))
      .filter((tl) => Boolean(tl.label));

    const tChecklists = Array.from(checklists.values())
      .filter((cl) => cl.taskId === task.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((cl) => ({
        ...cl,
        items: Array.from(checklistItems.values())
          .filter((item) => item.checklistId === cl.id)
          .sort((a, b) => a.position - b.position),
      }));

    const tSubtasks = Array.from(tasks.values())
      .filter((st) => st.parentId === task.id && st.deletedAt === null)
      .sort((a, b) => a.position - b.position);

    const tComments = Array.from(comments.values())
      .filter((c) => c.taskId === task.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((c) => {
        const u = users.get(c.authorId);
        return {
          ...c,
          author: u
            ? {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl,
              }
            : undefined,
        };
      });

    const tAttachments = Array.from(attachments.values())
      .filter((att) => att.taskId === task.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      ...task,
      project: project
        ? { id: project.id, key: project.key, workspaceId: project.workspaceId }
        : { id: task.projectId, key: 'TASK', workspaceId: '' },
      status,
      labels: tLabels,
      checklists: tChecklists,
      subtasks: tSubtasks,
      comments: tComments,
      attachments: tAttachments,
    };
  };

  const db = {
    reset() {
      users.clear();
      workspaces.clear();
      memberships.clear();
      refreshTokens.clear();
      passwordResetTokens.clear();
      workspaceInvites.clear();
      projects.clear();
      workflowStatuses.clear();
      tasks.clear();
      labels.clear();
      taskLabels.clear();
      checklists.clear();
      checklistItems.clear();
      comments.clear();
      attachments.clear();
      savedViews.clear();
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callback de transação em memória compatível com Prisma.TransactionClient
    $transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
      return fn(db);
    },

    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        let found: UserRecord | undefined;
        if (where.id) {
          found = users.get(where.id);
        } else if (where.email) {
          found = Array.from(users.values()).find(
            (u) => u.email.toLowerCase() === where.email!.toLowerCase(),
          );
        }
        if (!found) return null;
        return {
          ...found,
          memberships: getUserMembershipsWithWorkspace(found.id),
        };
      },

      create: async ({
        data,
      }: {
        data: { name: string; email: string; passwordHash: string; locale?: string };
      }) => {
        const now = new Date();
        const record: UserRecord = {
          id: cuid(),
          name: data.name,
          email: data.email.toLowerCase(),
          avatarUrl: null,
          passwordHash: data.passwordHash,
          locale: data.locale || 'pt-BR',
          createdAt: now,
          updatedAt: now,
        };
        users.set(record.id, record);
        return record;
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<UserRecord>;
      }) => {
        const existing = users.get(where.id);
        if (!existing) throw new Error('User not found');
        const updated: UserRecord = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        users.set(updated.id, updated);
        return updated;
      },
    },

    workspace: {
      findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
        let found: WorkspaceRecord | undefined;
        if (where.id) {
          found = workspaces.get(where.id);
        } else if (where.slug) {
          found = Array.from(workspaces.values()).find((w) => w.slug === where.slug);
        }
        if (!found) return null;
        const memberCount = Array.from(memberships.values()).filter(
          (m) => m.workspaceId === found!.id,
        ).length;
        const projectCount = Array.from(projects.values()).filter(
          (p) => p.workspaceId === found!.id && p.deletedAt === null,
        ).length;
        return {
          ...found,
          _count: {
            memberships: memberCount,
            projects: projectCount,
          },
        };
      },

      findFirst: async ({
        where,
      }: {
        where: { OR?: Array<{ id?: string; slug?: string }> };
      }) => {
        const clauses = where.OR || [];
        for (const ws of workspaces.values()) {
          for (const clause of clauses) {
            if ((clause.id && ws.id === clause.id) || (clause.slug && ws.slug === clause.slug)) {
              return ws;
            }
          }
        }
        return null;
      },

      create: async ({ data }: { data: { name: string; slug: string } }) => {
        const now = new Date();
        const record: WorkspaceRecord = {
          id: cuid(),
          name: data.name,
          slug: data.slug,
          createdAt: now,
          updatedAt: now,
        };
        workspaces.set(record.id, record);
        return record;
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { name?: string; slug?: string };
      }) => {
        const existing = workspaces.get(where.id);
        if (!existing) throw new Error('Workspace not found');
        const updated: WorkspaceRecord = {
          ...existing,
          name: data.name ?? existing.name,
          slug: data.slug ?? existing.slug,
          updatedAt: new Date(),
        };
        workspaces.set(updated.id, updated);
        return updated;
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = workspaces.get(where.id);
        if (!existing) throw new Error('Workspace not found');
        workspaces.delete(where.id);
        for (const [mId, m] of memberships.entries()) {
          if (m.workspaceId === where.id) memberships.delete(mId);
        }
        return existing;
      },
    },

    membership: {
      findUnique: async ({
        where,
      }: {
        where: {
          id?: string;
          userId_workspaceId?: { userId: string; workspaceId: string };
        };
      }) => {
        if (where.id) {
          return memberships.get(where.id) || null;
        }
        if (where.userId_workspaceId) {
          const { userId, workspaceId } = where.userId_workspaceId;
          return (
            Array.from(memberships.values()).find(
              (m) => m.userId === userId && m.workspaceId === workspaceId,
            ) || null
          );
        }
        return null;
      },

      findFirst: async ({
        where,
      }: {
        where: { id: string; workspaceId: string };
      }) => {
        const m = memberships.get(where.id);
        if (!m || m.workspaceId !== where.workspaceId) return null;
        const u = users.get(m.userId)!;
        return {
          ...m,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
          },
        };
      },

      findMany: async ({
        where,
      }: {
        where: { userId?: string; workspaceId?: string };
      }) => {
        return Array.from(memberships.values())
          .filter((m) => {
            if (where.userId && m.userId !== where.userId) return false;
            if (where.workspaceId && m.workspaceId !== where.workspaceId) return false;
            return true;
          })
          .map((m) => {
            const ws = workspaces.get(m.workspaceId)!;
            const u = users.get(m.userId)!;
            const wsMemberCount = Array.from(memberships.values()).filter(
              (x) => x.workspaceId === ws.id,
            ).length;
            const wsProjectCount = Array.from(projects.values()).filter(
              (p) => p.workspaceId === ws.id && p.deletedAt === null,
            ).length;
            return {
              ...m,
              workspace: {
                ...ws,
                _count: {
                  memberships: wsMemberCount,
                  projects: wsProjectCount,
                },
              },
              user: {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl,
              },
            };
          });
      },

      count: async ({
        where,
      }: {
        where: { workspaceId: string; role?: WorkspaceRole };
      }) => {
        return Array.from(memberships.values()).filter(
          (m) =>
            m.workspaceId === where.workspaceId &&
            (!where.role || m.role === where.role),
        ).length;
      },

      create: async ({
        data,
      }: {
        data: { userId: string; workspaceId: string; role: WorkspaceRole };
      }) => {
        const now = new Date();
        const record: MembershipRecord = {
          id: cuid(),
          userId: data.userId,
          workspaceId: data.workspaceId,
          role: data.role,
          createdAt: now,
          updatedAt: now,
        };
        memberships.set(record.id, record);
        return {
          ...record,
          workspace: workspaces.get(record.workspaceId)!,
        };
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { role: WorkspaceRole };
      }) => {
        const existing = memberships.get(where.id);
        if (!existing) throw new Error('Membership not found');
        const updated: MembershipRecord = {
          ...existing,
          role: data.role,
          updatedAt: new Date(),
        };
        memberships.set(updated.id, updated);
        const u = users.get(updated.userId)!;
        return {
          ...updated,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
          },
        };
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = memberships.get(where.id);
        if (!existing) throw new Error('Membership not found');
        memberships.delete(where.id);
        return existing;
      },
    },

    refreshToken: {
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          tokenHash: string;
          expiresAt: Date;
          userAgent?: string;
          ipAddress?: string;
        };
      }) => {
        const record: RefreshTokenRecord = {
          id: cuid(),
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
          replacedByTokenHash: null,
          userAgent: data.userAgent ?? null,
          ipAddress: data.ipAddress ?? null,
          createdAt: new Date(),
        };
        refreshTokens.set(record.id, record);
        return record;
      },

      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const found = Array.from(refreshTokens.values()).find(
          (t) => t.tokenHash === where.tokenHash,
        );
        if (!found) return null;
        const u = users.get(found.userId)!;
        return {
          ...found,
          user: {
            ...u,
            memberships: getUserMembershipsWithWorkspace(u.id),
          },
        };
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<RefreshTokenRecord>;
      }) => {
        const existing = refreshTokens.get(where.id);
        if (!existing) throw new Error('RefreshToken not found');
        const updated: RefreshTokenRecord = { ...existing, ...data };
        refreshTokens.set(updated.id, updated);
        return updated;
      },

      updateMany: async ({
        where,
        data,
      }: {
        where: { tokenHash?: string; userId?: string; revokedAt?: null };
        data: { revokedAt: Date };
      }) => {
        let count = 0;
        for (const [id, token] of refreshTokens.entries()) {
          if (where.tokenHash && token.tokenHash !== where.tokenHash) continue;
          if (where.userId && token.userId !== where.userId) continue;
          if (where.revokedAt === null && token.revokedAt !== null) continue;
          refreshTokens.set(id, { ...token, revokedAt: data.revokedAt });
          count++;
        }
        return { count };
      },
    },

    passwordResetToken: {
      create: async ({
        data,
      }: {
        data: { userId: string; tokenHash: string; expiresAt: Date };
      }) => {
        const record: PasswordResetTokenRecord = {
          id: cuid(),
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          usedAt: null,
          createdAt: new Date(),
        };
        passwordResetTokens.set(record.id, record);
        return record;
      },

      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const found = Array.from(passwordResetTokens.values()).find(
          (t) => t.tokenHash === where.tokenHash,
        );
        if (!found) return null;
        return {
          ...found,
          user: users.get(found.userId)!,
        };
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { usedAt: Date };
      }) => {
        const existing = passwordResetTokens.get(where.id);
        if (!existing) throw new Error('PasswordResetToken not found');
        const updated = { ...existing, ...data };
        passwordResetTokens.set(updated.id, updated);
        return updated;
      },
    },

    workspaceInvite: {
      create: async ({
        data,
      }: {
        data: {
          workspaceId: string;
          email: string;
          role: WorkspaceRole;
          token: string;
          invitedById: string;
          expiresAt: Date;
        };
      }) => {
        const record: WorkspaceInviteRecord = {
          id: cuid(),
          workspaceId: data.workspaceId,
          email: data.email.toLowerCase(),
          role: data.role,
          token: data.token,
          invitedById: data.invitedById,
          expiresAt: data.expiresAt,
          acceptedAt: null,
          revokedAt: null,
          createdAt: new Date(),
        };
        workspaceInvites.set(record.id, record);
        const ws = workspaces.get(record.workspaceId)!;
        const inviter = users.get(record.invitedById)!;
        return {
          ...record,
          workspace: { id: ws.id, name: ws.name, slug: ws.slug },
          invitedBy: { id: inviter.id, name: inviter.name, email: inviter.email },
        };
      },

      findMany: async ({ where }: { where: { workspaceId: string } }) => {
        const now = new Date();
        return Array.from(workspaceInvites.values())
          .filter(
            (inv) =>
              inv.workspaceId === where.workspaceId &&
              inv.acceptedAt === null &&
              inv.revokedAt === null &&
              inv.expiresAt > now,
          )
          .map((inv) => {
            const inviter = users.get(inv.invitedById)!;
            return {
              ...inv,
              invitedBy: { id: inviter.id, name: inviter.name, email: inviter.email },
            };
          });
      },

      findUnique: async ({ where }: { where: { token: string } }) => {
        const found = Array.from(workspaceInvites.values()).find(
          (inv) => inv.token === where.token,
        );
        if (!found) return null;
        const ws = workspaces.get(found.workspaceId)!;
        const inviter = users.get(found.invitedById)!;
        return {
          ...found,
          workspace: { id: ws.id, name: ws.name, slug: ws.slug },
          invitedBy: { id: inviter.id, name: inviter.name, email: inviter.email },
        };
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<WorkspaceInviteRecord>;
      }) => {
        const existing = workspaceInvites.get(where.id);
        if (!existing) throw new Error('Invite not found');
        const updated = { ...existing, ...data };
        workspaceInvites.set(updated.id, updated);
        return updated;
      },
    },

    // -------------------------------------------------------------
    // Fase 2: Projetos, Status, Tarefas, Etiquetas, Checklists, Comentários, Anexos, Visões Salvas
    // -------------------------------------------------------------
    project: {
      findMany: async ({
        where,
      }: {
        where: { workspaceId: string; deletedAt?: null };
      }) => {
        return Array.from(projects.values())
          .filter(
            (p) =>
              p.workspaceId === where.workspaceId &&
              (where.deletedAt === null ? p.deletedAt === null : true),
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map(getProjectRelations);
      },

      findUnique: async ({
        where,
      }: {
        where: { id?: string; workspaceId_key?: { workspaceId: string; key: string } };
      }) => {
        let found: ProjectRecord | undefined;
        if (where.id) {
          found = projects.get(where.id);
        } else if (where.workspaceId_key) {
          const { workspaceId, key } = where.workspaceId_key;
          found = Array.from(projects.values()).find(
            (p) => p.workspaceId === workspaceId && p.key === key,
          );
        }
        if (!found) return null;
        return getProjectRelations(found);
      },

      create: async ({
        data,
      }: {
        data: {
          workspaceId: string;
          name: string;
          key: string;
          description?: string | null;
          status: ProjectStatus;
          color?: string | null;
          startDate?: Date | null;
          dueDate?: Date | null;
          ownerId: string;
        };
      }) => {
        const now = new Date();
        const record: ProjectRecord = {
          id: cuid(),
          workspaceId: data.workspaceId,
          name: data.name,
          key: data.key,
          description: data.description ?? null,
          status: data.status,
          color: data.color ?? '#2563EB',
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          ownerId: data.ownerId,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        projects.set(record.id, record);
        return record;
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<ProjectRecord>;
      }) => {
        const existing = projects.get(where.id);
        if (!existing) throw new Error('Project not found');
        const updated: ProjectRecord = {
          ...existing,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
          updatedAt: new Date(),
        };
        projects.set(updated.id, updated);
        return getProjectRelations(updated);
      },
    },

    workflowStatus: {
      findMany: async ({ where }: { where: { projectId: string } }) => {
        return Array.from(workflowStatuses.values())
          .filter((s) => s.projectId === where.projectId)
          .sort((a, b) => a.position - b.position);
      },

      create: async ({
        data,
      }: {
        data: {
          projectId: string;
          name: string;
          category: StatusCategory;
          position: number;
          wipLimit?: number | null;
          color?: string | null;
        };
      }) => {
        const now = new Date();
        const record: WorkflowStatusRecord = {
          id: cuid(),
          projectId: data.projectId,
          name: data.name,
          category: data.category,
          position: data.position,
          wipLimit: data.wipLimit ?? null,
          color: data.color ?? null,
          createdAt: now,
          updatedAt: now,
        };
        workflowStatuses.set(record.id, record);
        return record;
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const status = workflowStatuses.get(where.id);
        if (!status) return null;
        const project = projects.get(status.projectId);
        return {
          ...status,
          project: project
            ? {
                id: project.id,
                workspaceId: project.workspaceId,
                deletedAt: project.deletedAt,
              }
            : null,
        };
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<WorkflowStatusRecord>;
      }) => {
        const existing = workflowStatuses.get(where.id);
        if (!existing) throw new Error('Status not found');
        const updated: WorkflowStatusRecord = {
          ...existing,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
          updatedAt: new Date(),
        };
        workflowStatuses.set(updated.id, updated);
        return updated;
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = workflowStatuses.get(where.id);
        if (existing) {
          workflowStatuses.delete(where.id);
        }
        return existing;
      },
    },

    task: {
      findMany: async ({
        where,
      }: {
        where: {
          projectId?: string;
          id?: { in: string[] };
          deletedAt?: null;
        };
      }) => {
        return Array.from(tasks.values())
          .filter((t) => {
            if (where.projectId && t.projectId !== where.projectId) return false;
            if (where.id?.in && !where.id.in.includes(t.id)) return false;
            if (where.deletedAt === null && t.deletedAt !== null) return false;
            return true;
          })
          .sort((a, b) => a.position - b.position || a.number - b.number)
          .map(getTaskWithRelations);
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const found = tasks.get(where.id);
        if (!found) return null;
        return getTaskWithRelations(found);
      },

      create: async ({
        data,
      }: {
        data: {
          projectId: string;
          number: number;
          title: string;
          description?: unknown;
          statusId: string;
          priority: TaskPriority;
          parentId?: string | null;
          assigneeIds: string[];
          startDate?: Date | null;
          dueDate?: Date | null;
          estimateMinutes?: number | null;
          progress: number;
          isMilestone: boolean;
          position: number;
        };
      }) => {
        const now = new Date();
        const record: TaskRecord = {
          id: cuid(),
          projectId: data.projectId,
          number: data.number,
          title: data.title,
          description: data.description ?? null,
          statusId: data.statusId,
          priority: data.priority,
          parentId: data.parentId ?? null,
          assigneeIds: data.assigneeIds || [],
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          estimateMinutes: data.estimateMinutes ?? null,
          progress: data.progress,
          isMilestone: data.isMilestone,
          position: data.position,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        tasks.set(record.id, record);
        return record;
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<TaskRecord>;
      }) => {
        const existing = tasks.get(where.id);
        if (!existing) throw new Error('Task not found');
        const updated: TaskRecord = {
          ...existing,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
          updatedAt: new Date(),
        };
        tasks.set(updated.id, updated);
        return updated;
      },

      updateMany: async ({
        where,
        data,
      }: {
        where: {
          projectId?: string;
          parentId?: string;
          id?: { in: string[] };
          deletedAt?: null;
        };
        data: Partial<TaskRecord>;
      }) => {
        let count = 0;
        for (const [id, task] of tasks.entries()) {
          if (where.projectId && task.projectId !== where.projectId) continue;
          if (where.parentId && task.parentId !== where.parentId) continue;
          if (where.id?.in && !where.id.in.includes(id)) continue;
          if (where.deletedAt === null && task.deletedAt !== null) continue;
          tasks.set(id, {
            ...task,
            ...Object.fromEntries(
              Object.entries(data).filter(([, v]) => v !== undefined),
            ),
            updatedAt: new Date(),
          });
          count++;
        }
        return { count };
      },

      count: async ({
        where,
      }: {
        where?: {
          statusId?: string;
          projectId?: string;
          deletedAt?: null;
        };
      }) => {
        return Array.from(tasks.values()).filter((t) => {
          if (where?.statusId && t.statusId !== where.statusId) return false;
          if (where?.projectId && t.projectId !== where.projectId) return false;
          if (where?.deletedAt === null && t.deletedAt !== null) return false;
          return true;
        }).length;
      },
    },

    label: {
      findMany: async ({ where }: { where: { workspaceId: string } }) => {
        return Array.from(labels.values())
          .filter((l) => l.workspaceId === where.workspaceId)
          .sort((a, b) => a.name.localeCompare(b.name));
      },

      findUnique: async ({
        where,
      }: {
        where: { id?: string; workspaceId_name?: { workspaceId: string; name: string } };
      }) => {
        if (where.id) return labels.get(where.id) || null;
        if (where.workspaceId_name) {
          const { workspaceId, name } = where.workspaceId_name;
          return (
            Array.from(labels.values()).find(
              (l) => l.workspaceId === workspaceId && l.name === name,
            ) || null
          );
        }
        return null;
      },

      create: async ({
        data,
      }: {
        data: { workspaceId: string; name: string; color: string };
      }) => {
        const now = new Date();
        const record: LabelRecord = {
          id: cuid(),
          workspaceId: data.workspaceId,
          name: data.name,
          color: data.color,
          createdAt: now,
          updatedAt: now,
        };
        labels.set(record.id, record);
        return record;
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = labels.get(where.id);
        if (!existing) throw new Error('Label not found');
        labels.delete(where.id);
        for (const [key, tl] of taskLabels.entries()) {
          if (tl.labelId === where.id) taskLabels.delete(key);
        }
        return existing;
      },
    },

    taskLabel: {
      findUnique: async ({
        where,
      }: {
        where: { taskId_labelId: { taskId: string; labelId: string } };
      }) => {
        const key = `${where.taskId_labelId.taskId}:${where.taskId_labelId.labelId}`;
        return taskLabels.get(key) || null;
      },

      create: async ({
        data,
      }: {
        data: { taskId: string; labelId: string };
      }) => {
        const key = `${data.taskId}:${data.labelId}`;
        const record: TaskLabelRecord = {
          taskId: data.taskId,
          labelId: data.labelId,
          createdAt: new Date(),
        };
        taskLabels.set(key, record);
        return record;
      },

      delete: async ({
        where,
      }: {
        where: { taskId_labelId: { taskId: string; labelId: string } };
      }) => {
        const key = `${where.taskId_labelId.taskId}:${where.taskId_labelId.labelId}`;
        const existing = taskLabels.get(key);
        taskLabels.delete(key);
        return existing;
      },
    },

    checklist: {
      create: async ({ data }: { data: { taskId: string; title: string } }) => {
        const now = new Date();
        const record: ChecklistRecord = {
          id: cuid(),
          taskId: data.taskId,
          title: data.title,
          createdAt: now,
          updatedAt: now,
        };
        checklists.set(record.id, record);
        return { ...record, items: [] };
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const cl = checklists.get(where.id);
        if (!cl) return null;
        const task = tasks.get(cl.taskId)!;
        const project = projects.get(task.projectId)!;
        const items = Array.from(checklistItems.values())
          .filter((i) => i.checklistId === cl.id)
          .sort((a, b) => a.position - b.position);
        return {
          ...cl,
          task: {
            ...task,
            project: { id: project.id, workspaceId: project.workspaceId },
          },
          items,
        };
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = checklists.get(where.id);
        if (!existing) throw new Error('Checklist not found');
        checklists.delete(where.id);
        for (const [id, item] of checklistItems.entries()) {
          if (item.checklistId === where.id) checklistItems.delete(id);
        }
        return existing;
      },
    },

    checklistItem: {
      create: async ({
        data,
      }: {
        data: { checklistId: string; text: string; done: boolean; position: number };
      }) => {
        const now = new Date();
        const record: ChecklistItemRecord = {
          id: cuid(),
          checklistId: data.checklistId,
          text: data.text,
          done: data.done,
          position: data.position,
          createdAt: now,
          updatedAt: now,
        };
        checklistItems.set(record.id, record);
        return record;
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const item = checklistItems.get(where.id);
        if (!item) return null;
        const cl = checklists.get(item.checklistId)!;
        const task = tasks.get(cl.taskId)!;
        const project = projects.get(task.projectId)!;
        return {
          ...item,
          checklist: {
            ...cl,
            task: {
              ...task,
              project: { id: project.id, workspaceId: project.workspaceId },
            },
          },
        };
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<ChecklistItemRecord>;
      }) => {
        const existing = checklistItems.get(where.id);
        if (!existing) throw new Error('ChecklistItem not found');
        const updated: ChecklistItemRecord = {
          ...existing,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
          updatedAt: new Date(),
        };
        checklistItems.set(updated.id, updated);
        return updated;
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = checklistItems.get(where.id);
        if (!existing) throw new Error('ChecklistItem not found');
        checklistItems.delete(where.id);
        return existing;
      },
    },

    comment: {
      findMany: async ({ where }: { where: { taskId: string } }) => {
        return Array.from(comments.values())
          .filter((c) => c.taskId === where.taskId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((c) => {
            const u = users.get(c.authorId)!;
            return {
              ...c,
              author: {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl,
              },
            };
          });
      },

      create: async ({
        data,
      }: {
        data: { taskId: string; authorId: string; body: unknown };
      }) => {
        const now = new Date();
        const record: CommentRecord = {
          id: cuid(),
          taskId: data.taskId,
          docId: null,
          authorId: data.authorId,
          body: data.body,
          createdAt: now,
          updatedAt: now,
        };
        comments.set(record.id, record);
        const u = users.get(record.authorId)!;
        return {
          ...record,
          author: {
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
          },
        };
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const c = comments.get(where.id);
        if (!c) return null;
        const task = c.taskId ? tasks.get(c.taskId) : null;
        const project = task ? projects.get(task.projectId) : null;
        return {
          ...c,
          task:
            task && project
              ? {
                  ...task,
                  project: { id: project.id, workspaceId: project.workspaceId },
                }
              : null,
        };
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = comments.get(where.id);
        if (!existing) throw new Error('Comment not found');
        comments.delete(where.id);
        return existing;
      },
    },

    attachment: {
      findMany: async ({ where }: { where: { taskId: string } }) => {
        return Array.from(attachments.values())
          .filter((a) => a.taskId === where.taskId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },

      create: async ({
        data,
      }: {
        data: {
          taskId: string;
          fileName: string;
          mimeType: string;
          size: number;
          storageKey: string;
        };
      }) => {
        const record: AttachmentRecord = {
          id: cuid(),
          taskId: data.taskId,
          fileName: data.fileName,
          mimeType: data.mimeType,
          size: data.size,
          storageKey: data.storageKey,
          createdAt: new Date(),
        };
        attachments.set(record.id, record);
        return record;
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const a = attachments.get(where.id);
        if (!a) return null;
        const task = tasks.get(a.taskId)!;
        const project = projects.get(task.projectId)!;
        return {
          ...a,
          task: {
            ...task,
            project: { id: project.id, workspaceId: project.workspaceId },
          },
        };
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = attachments.get(where.id);
        if (!existing) throw new Error('Attachment not found');
        attachments.delete(where.id);
        return existing;
      },
    },

    savedView: {
      findMany: async ({
        where,
      }: {
        where: {
          projectId: string;
          OR?: Array<{ ownerId?: string; shared?: boolean }>;
        };
      }) => {
        return Array.from(savedViews.values())
          .filter((v) => {
            if (v.projectId !== where.projectId) return false;
            if (!where.OR) return true;
            return where.OR.some(
              (clause) =>
                (clause.ownerId && v.ownerId === clause.ownerId) ||
                (clause.shared !== undefined && v.shared === clause.shared),
            );
          })
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      },

      findUnique: async ({ where }: { where: { id: string } }) => {
        const v = savedViews.get(where.id);
        if (!v) return null;
        const project = projects.get(v.projectId)!;
        return {
          ...v,
          project: { id: project.id, workspaceId: project.workspaceId },
        };
      },

      create: async ({
        data,
      }: {
        data: {
          projectId: string;
          ownerId: string;
          type: string;
          name: string;
          config: unknown;
          shared: boolean;
        };
      }) => {
        const now = new Date();
        const record: SavedViewRecord = {
          id: cuid(),
          projectId: data.projectId,
          ownerId: data.ownerId,
          type: data.type,
          name: data.name,
          config: data.config,
          shared: data.shared,
          createdAt: now,
          updatedAt: now,
        };
        savedViews.set(record.id, record);
        return record;
      },

      delete: async ({ where }: { where: { id: string } }) => {
        const existing = savedViews.get(where.id);
        if (!existing) throw new Error('SavedView not found');
        savedViews.delete(where.id);
        return existing;
      },
    },
  };

  return db;
}

export const testDb = createInMemoryPrisma();
