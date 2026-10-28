'use client';

import React, { useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import { useAuthStore, mapMembershipsToWorkspaces } from './auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    if (isInitialized) return;

    let mounted = true;

    async function bootstrapSession() {
      try {
        const storedToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('fluxopro_access_token')
            : null;

        if (storedToken) {
          const me = await authApi.me();
          if (mounted) {
            setSession({
              accessToken: storedToken,
              user: me.user,
              workspaces: mapMembershipsToWorkspaces(me.workspaces),
            });
          }
          return;
        }

        // Tenta restaurar via cookie httpOnly de refresh token
        const refreshed = await authApi.refresh();
        if (mounted) {
          setSession({
            accessToken: refreshed.accessToken,
            user: refreshed.user,
            workspaces: mapMembershipsToWorkspaces(refreshed.workspaces),
          });
        }
      } catch {
        if (mounted) {
          clearSession();
        }
      }
    }

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [isInitialized, setSession, clearSession]);

  return <>{children}</>;
}
