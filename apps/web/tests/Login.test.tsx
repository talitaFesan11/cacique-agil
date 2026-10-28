import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkspaceRole } from '@fluxo/shared';
import LoginPage from '../src/app/[locale]/login/page';
import { WorkspaceSelector } from '../src/components/workspace/WorkspaceSelector';
import { useAuthStore } from '../src/features/auth/auth-store';

describe('Fase 1 UI: Login & WorkspaceSelector', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('renderiza formulário de login e preenche credenciais demo ao clicar no atalho', () => {
    render(<LoginPage />);

    expect(screen.getByText('loginTitle')).toBeInTheDocument();
    const emailInput = screen.getByTestId('login-email-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('login-password-input') as HTMLInputElement;

    const demoOwnerBtn = screen.getByTestId('fill-demo-owner');
    fireEvent.click(demoOwnerBtn);

    expect(emailInput.value).toBe('admin@fluxopro.local');
    expect(passwordInput.value).toBe('Senha@123');
  });

  it('WorkspaceSelector exibe o workspace ativo e o papel RBAC quando autenticado', () => {
    useAuthStore.getState().setSession({
      accessToken: 'fake-jwt-token',
      user: {
        id: 'u1',
        email: 'admin@fluxopro.local',
        name: 'Ana Silva',
        locale: 'pt-BR',
        createdAt: new Date().toISOString(),
      },
      workspaces: [
        {
          id: 'ws1',
          name: 'FluxoPro Org',
          slug: 'fluxopro-org',
          role: WorkspaceRole.OWNER,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ws2',
          name: 'Engenharia',
          slug: 'engenharia',
          role: WorkspaceRole.ADMIN,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(<WorkspaceSelector />);

    expect(screen.getByText('FluxoPro Org')).toBeInTheDocument();
    expect(screen.getByText('OWNER')).toBeInTheDocument();
  });
});
