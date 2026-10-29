import { test, expect } from 'playwright/test';

test.describe('Fase 6 E2E: Quadros Brancos (Whiteboards), Canvas Infinito, Post-its, Tarefas Vivas, Modelos e Sincronização', () => {
  test('Fluxo completo: Galeria de Quadros -> Canvas Colaborativo -> Post-its e Tarefa Viva FLX-1 -> Modelos -> Aba Quadros no Projeto', async ({
    page,
  }) => {
    test.setTimeout(120000);

    // 1. Login com o usuário demo Owner (Ana Silva)
    await page.goto('/pt-BR/login');
    await page.getByTestId('fill-demo-owner').click();
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL('**/pt-BR/workspaces/**');
    await expect(page.getByTestId('user-profile-button')).toBeVisible({ timeout: 15000 });

    // 2. Navegar para a Galeria de Quadros Brancos
    await page.goto('/pt-BR/whiteboards');
    await page.waitForLoadState('networkidle');

    // Validação da Galeria e Quadros Semeados
    await expect(page.getByText('Quadros Brancos').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Brainstorming — Lançamento v1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Fluxograma de Arquitetura & Dados')).toBeVisible();
    await expect(page.getByText('Retrospectiva da Sprint 1')).toBeVisible();

    // Screenshot 1: Galeria de Quadros Brancos
    await page.screenshot({
      path: '../../docs/phases/fase-06/screenshots/phase6-whiteboards-gallery.png',
      fullPage: true,
    });

    // 3. Abrir o Quadro Principal com Tarefa Vinculada (Brainstorming — Lançamento v1)
    await page.getByText('Brainstorming — Lançamento v1').click();
    await page.waitForURL('**/pt-BR/whiteboards/**');
    await page.waitForLoadState('networkidle');

    // Validação do Canvas e Toolbar
    await expect(page.getByTestId('whiteboard-canvas-area')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('tool-select')).toBeVisible();
    await expect(page.getByTestId('tool-sticky')).toBeVisible();
    await expect(page.getByTestId('tool-templates')).toBeVisible();

    // Validação de elementos renderizados no canvas (Post-its e Card de Tarefa Viva FLX-1)
    await expect(page.getByText(/Explorar canvas infinito/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Permitir converter notas adesivas/i)).toBeVisible();
    await expect(page.getByText('FLX-1')).toBeVisible({ timeout: 10000 });

    // Screenshot 2: Canvas Infinito com Post-its, Formas e Conectores
    await page.screenshot({
      path: '../../docs/phases/fase-06/screenshots/phase6-whiteboard-canvas.png',
      fullPage: true,
    });

    // Screenshot 3: Detalhe do Card de Tarefa Viva FLX-1
    const taskCardLocator = page.locator('[data-testid^="task-card-"]').first();
    if (await taskCardLocator.isVisible()) {
      await taskCardLocator.screenshot({
        path: '../../docs/phases/fase-06/screenshots/phase6-whiteboard-task-card.png',
      });
    }

    // 4. Testar Abertura do Modal de Modelos Prontos
    await page.getByTestId('tool-templates').click();
    await expect(page.getByText('Galeria de Modelos de Quadros')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Brainstorming Colaborativo')).toBeVisible();
    await expect(page.getByText('Fluxograma de Processo')).toBeVisible();
    await expect(page.getByText('Mapa Mental (Mindmap)')).toBeVisible();
    await expect(page.getByText('Retrospectiva de Sprint')).toBeVisible();

    // Screenshot 4: Modal de Modelos Prontos
    await page.screenshot({
      path: '../../docs/phases/fase-06/screenshots/phase6-whiteboard-templates.png',
      fullPage: true,
    });

    // Fechar modal de templates
    await page.getByRole('button', { name: /cancelar/i }).click();
    await page.waitForTimeout(400);

    // 5. Navegar para a página de Projetos e validar a Aba de Quadros
    await page.goto('/pt-BR/projects');
    await expect(page.getByTestId('project-card-FLX')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('open-project-FLX').click();
    await page.waitForURL('**/pt-BR/projects/**');

    // Clicar na aba Quadros
    const whiteboardsTab = page.getByTestId('tab-whiteboards');
    await expect(whiteboardsTab).toBeVisible({ timeout: 10000 });
    await whiteboardsTab.click();

    // Validar listagem de quadros vinculados ao projeto FLX
    await expect(page.getByText(/Quadros Brancos do Projeto/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Brainstorming — Lançamento v1').first()).toBeVisible();

    // Screenshot 5: Aba Quadros no Projeto
    await page.screenshot({
      path: '../../docs/phases/fase-06/screenshots/phase6-project-whiteboards-tab.png',
      fullPage: true,
    });
  });
});
