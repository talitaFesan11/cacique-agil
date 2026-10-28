import { test, expect } from 'playwright/test';

test.describe('Fase 2 E2E: Projetos e Tarefas (Visão Lista) — Criar -> Editar -> Comentar -> Filtrar', () => {
  test('Fluxo completo: Login -> Abrir Projeto FLX -> Criar Tarefa -> Editar no Drawer -> Checklist & Comentário -> Filtrar e Salvar Visão', async ({
    page,
  }) => {
    // 1. Login como Owner
    await page.goto('/pt-BR/login');
    await page.getByTestId('fill-demo-owner').click();
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL('**/pt-BR/workspaces/fluxopro-org/settings');

    // 2. Navegar para a listagem de Projetos
    await page.goto('/pt-BR/projects');
    await expect(page.getByTestId('project-card-FLX')).toBeVisible();
    await page.screenshot({ path: '/tmp/phase2-projects-list.png', fullPage: true });

    // 3. Abrir a Visão Lista do Projeto FLX
    await page.getByTestId('open-project-FLX').click();
    await page.waitForURL('**/pt-BR/projects/**');
    await expect(page.getByTestId('task-row-FLX-1')).toBeVisible();
    await expect(page.getByTestId('task-row-FLX-3')).toBeVisible();
    await page.screenshot({ path: '/tmp/phase2-tasks-list-view.png', fullPage: true });

    // 4. Criar nova tarefa rapidamente na Visão Lista
    const uniqueTaskTitle = `Tarefa E2E Lista ${Date.now()}`;
    await page.getByTestId('quick-add-task-input').fill(uniqueTaskTitle);
    await page.getByTestId('quick-add-task-button').click();

    await expect(page.getByText(uniqueTaskTitle)).toBeVisible();

    // 5. Abrir a tarefa no Drawer lateral e editar título, checklist e comentário
    await page.getByText(uniqueTaskTitle).click();
    await expect(page.getByTestId('task-detail-drawer')).toBeVisible();

    const editedTitle = `${uniqueTaskTitle} (Editada)`;
    const titleInput = page.getByTestId('drawer-task-title-input');
    await titleInput.fill(editedTitle);
    await page.getByTestId('drawer-save-title-button').click();

    // Criar checklist no Drawer
    await page.getByTestId('drawer-new-checklist-input').fill('Checklist E2E');
    await page.getByTestId('drawer-add-checklist-button').click();
    await expect(page.getByText('Checklist E2E')).toBeVisible();

    // Comentar na tarefa com menção @carlos
    await page
      .getByTestId('drawer-comment-input')
      .fill('Comentário automatizado E2E mencionando @carlos com sucesso!');
    await page.getByTestId('drawer-send-comment-button').click();
    await expect(
      page.getByText('Comentário automatizado E2E mencionando @carlos com sucesso!'),
    ).toBeVisible();

    await page.screenshot({ path: '/tmp/phase2-task-detail-drawer.png' });

    // Fechar o Drawer
    await page.getByTestId('close-task-drawer-button').click();

    // 6. Filtrar pela busca e salvar uma Visão Salva
    await page.getByTestId('task-search-input').fill(editedTitle);
    await expect(page.getByText(editedTitle)).toBeVisible();

    const savedViewName = `Visão E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-save-view-dialog-button').click();
    await page.getByTestId('saved-view-name-input').fill(savedViewName);
    await page.getByTestId('confirm-save-view-button').click();

    await expect(page.getByTestId('saved-view-name-input')).toBeHidden();
    await expect(page.getByTestId(`saved-view-chip-${savedViewName}`)).toBeVisible();
    await page.screenshot({ path: '/tmp/phase2-filtered-saved-view.png', fullPage: true });
  });
});
