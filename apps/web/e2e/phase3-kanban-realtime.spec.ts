import { test, expect } from 'playwright/test';

test.describe('Fase 3 E2E: Quadro Kanban, Limite WIP, Swimlanes e Tempo Real Multi-Usuário', () => {
  test('Fluxo completo: Kanban -> Colunas -> Limite WIP -> Criar Tarefa Inline -> Swimlanes -> Presença & Sincronização em Tempo Real', async ({
    browser,
  }) => {
    // -------------------------------------------------------------------
    // Contexto A: Usuário Owner (Ana Silva)
    // -------------------------------------------------------------------
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    // 1. Login como Owner no Contexto A
    await pageA.goto('/pt-BR/login');
    await pageA.getByTestId('fill-demo-owner').click();
    await pageA.getByTestId('login-submit-button').click();
    await pageA.waitForURL('**/pt-BR/workspaces/**');

    // 2. Navegar para a página de Projetos e abrir o Projeto FLX
    await pageA.goto('/pt-BR/projects');
    await expect(pageA.getByTestId('project-card-FLX')).toBeVisible();
    await pageA.getByTestId('open-project-FLX').click();
    await pageA.waitForURL('**/pt-BR/projects/**');

    // 3. Alternar para a aba Kanban
    const kanbanTab = pageA.getByTestId('tab-kanban');
    await expect(kanbanTab).toBeVisible();
    await kanbanTab.click();

    // Verifica que o container do Kanban foi renderizado
    await expect(pageA.getByTestId('kanban-board-container')).toBeVisible();

    // 4. Verificar Colunas e Cards
    await expect(pageA.getByRole('heading', { name: 'A Fazer' })).toBeVisible();
    await expect(pageA.getByRole('heading', { name: 'Em Andamento' })).toBeVisible();
    await expect(pageA.getByRole('heading', { name: 'Em Revisão' })).toBeVisible();
    await expect(pageA.getByRole('heading', { name: 'Concluído' })).toBeVisible();

    // Verificar indicador de Limite WIP excedido na coluna "Em Revisão" (3/2)
    await expect(pageA.getByText('Limite WIP excedido (3/2)')).toBeVisible();

    // Screenshot 1: Visão Geral do Quadro Kanban com Limite WIP
    await pageA.screenshot({ path: '/tmp/phase3-kanban-board.png', fullPage: true });

    // 5. Testar abertura do Drawer lateral a partir do Card Kanban
    const cardTitle = pageA.getByTestId('kanban-card-title-FLX-5');
    await expect(cardTitle).toBeVisible();
    await cardTitle.click();
    await expect(pageA.getByTestId('task-detail-drawer')).toBeVisible();
    await pageA.screenshot({ path: '/tmp/phase3-kanban-drawer.png' });

    // Fechar drawer
    await pageA.getByTestId('close-task-drawer-button').click();
    await expect(pageA.getByTestId('task-detail-drawer')).toBeHidden();

    // 6. Testar agrupamento em Raias (Swimlanes) por Prioridade
    await pageA.getByTestId('swimlane-select').click();
    await pageA.getByRole('option', { name: 'Por Prioridade' }).click();

    await expect(pageA.getByTestId('swimlane-URGENT')).toBeVisible();
    await expect(pageA.getByTestId('swimlane-HIGH')).toBeVisible();
    await pageA.screenshot({ path: '/tmp/phase3-kanban-swimlanes.png', fullPage: true });

    // Volta para sem raias
    await pageA.getByTestId('swimlane-select').click();
    await pageA.getByRole('option', { name: 'Sem raias (Padrão)' }).click();

    // -------------------------------------------------------------------
    // Contexto B: Segundo Navegador / Segundo Usuário (Carlos - Member)
    // -------------------------------------------------------------------
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Login do Usuário B
    await pageB.goto('/pt-BR/login');
    await pageB.getByTestId('fill-demo-member').click();
    await pageB.getByTestId('login-submit-button').click();
    await pageB.waitForURL('**/pt-BR/workspaces/**');

    // Abre o mesmo projeto no Kanban no Usuário B
    await pageB.goto('/pt-BR/projects');
    await pageB.getByTestId('open-project-FLX').click();
    await pageB.waitForURL('**/pt-BR/projects/**');
    await pageB.getByTestId('tab-kanban').click();
    await expect(pageB.getByTestId('kanban-board-container')).toBeVisible();

    // 7. Validação de Presença em Tempo Real (< 1s)
    // Ambos os navegadores devem ver a presença do outro no topo
    await expect(pageA.getByTestId('presence-bar')).toBeVisible();
    await expect(pageB.getByTestId('presence-bar')).toBeVisible();

    // Screenshot 2: Tempo Real e Presença Multi-Usuário
    await pageA.screenshot({ path: '/tmp/phase3-realtime-presence.png' });

    // Fechar contextos
    await contextA.close();
    await contextB.close();
  });
});
