import { test, expect } from 'playwright/test';

test.describe('Fase 1 E2E: Autenticação, Seletor de Workspace, Convites e RBAC', () => {
  test('Fluxo completo: Login como Owner -> Visualizar Membros/RBAC -> Alternar Workspace -> Convidar Membro', async ({
    page,
  }) => {
    await page.goto('/pt-BR/login');
    await expect(page.getByTestId('login-email-input')).toBeVisible();

    // Preenche credenciais de Owner (Ana Silva)
    await page.getByTestId('fill-demo-owner').click();
    await page.getByTestId('login-submit-button').click();

    // Redireciona para configurações do workspace padrão (fluxopro-org)
    await page.waitForURL('**/pt-BR/workspaces/fluxopro-org/settings');
    await expect(page.getByTestId('active-workspace-role-chip')).toContainText('OWNER');
    await expect(page.getByTestId('member-row-admin@fluxopro.local')).toBeVisible();
    await expect(page.getByTestId('member-row-membro@fluxopro.local')).toBeVisible();

    // Abre seletor de workspace e verifica múltiplos workspaces do usuário
    await page.getByTestId('workspace-selector-button').click();
    await expect(page.getByTestId('workspace-option-fluxopro-org')).toBeVisible();
    await expect(page.getByTestId('workspace-option-engenharia-produto')).toBeVisible();
    await page.keyboard.press('Escape');

    // Envia convite para novo membro
    await page.getByTestId('open-invite-dialog-button').click();
    await page.locator('input[type="email"]').fill('colaborador.e2e@fluxopro.local');
    await page.locator('button[type="submit"]').filter({ hasText: /Enviar Convite/i }).click();

    await expect(page.getByTestId('workspace-feedback-alert')).toBeVisible();
    await expect(
      page.getByTestId('invite-row-colaborador.e2e@fluxopro.local').first(),
    ).toBeVisible();
  });
});
