'use client';

import { create } from 'zustand';
import { UserDto, WorkspaceDto, WorkspaceRole } from '@fluxo/shared';

export interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
  workspaces: WorkspaceDto[];
  activeWorkspaceId: string | null;
  isInitialized: boolean;
  setSession: (params: {
    accessToken: string;
    user: UserDto;
    workspaces?: WorkspaceDto[];
  }) => void;
  setWorkspaces: (workspaces: WorkspaceDto[]) => void;
  setActiveWorkspaceId: (workspaceId: string) => void;
  clearSession: () => void;
  setInitialized: (initialized: boolean) => void;
}

const ACTIVE_WS_STORAGE_KEY = 'fluxopro_active_workspace_id';
const ACCESS_TOKEN_STORAGE_KEY = 'fluxopro_access_token';

const getSavedWorkspaceId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ACTIVE_WS_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  workspaces: [],
  activeWorkspaceId: null,
  isInitialized: false,

  setSession: ({ accessToken, user, workspaces }) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      } catch {
        // ignore storage errors
      }
    }

    const currentWorkspaces = workspaces ?? get().workspaces;
    const savedId = get().activeWorkspaceId || getSavedWorkspaceId();
    const validSaved = currentWorkspaces.find((w) => w.id === savedId || w.slug === savedId);
    const nextActiveId = validSaved
      ? validSaved.id
      : currentWorkspaces[0]?.id ?? null;

    if (nextActiveId && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, nextActiveId);
      } catch {
        // ignore
      }
    }

    set({
      accessToken,
      user,
      workspaces: currentWorkspaces,
      activeWorkspaceId: nextActiveId,
      isInitialized: true,
    });
  },

  setWorkspaces: (workspaces) => {
    const savedId = get().activeWorkspaceId || getSavedWorkspaceId();
    const validSaved = workspaces.find((w) => w.id === savedId || w.slug === savedId);
    const nextActiveId = validSaved ? validSaved.id : workspaces[0]?.id ?? null;

    if (nextActiveId && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, nextActiveId);
      } catch {
        // ignore
      }
    }

    set({
      workspaces,
      activeWorkspaceId: nextActiveId,
    });
  },

  setActiveWorkspaceId: (workspaceId) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, workspaceId);
      } catch {
        // ignore
      }
    }
    set({ activeWorkspaceId: workspaceId });
  },

  clearSession: () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    set({
      accessToken: null,
      user: null,
      workspaces: [],
      activeWorkspaceId: null,
      isInitialized: true,
    });
  },

  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));

export const mapMembershipsToWorkspaces = (
  memberships?: Array<{
    id: string;
    workspaceId: string;
    role: WorkspaceRole;
    workspace: { id: string; name: string; slug: string; createdAt: string | Date };
  }>,
): WorkspaceDto[] => {
  if (!memberships) return [];
  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
    createdAt:
      typeof m.workspace.createdAt === 'string'
        ? m.workspace.createdAt
        : m.workspace.createdAt.toISOString(),
  }));
};
