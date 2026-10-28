import { test, expect } from 'playwright/test';

test.describe('Fase 4 E2E: Gráfico Gantt, CPM, Dependências, Linhas de Base, Calendário e Carga de Trabalho', () => {
  test('Fluxo completo: Gantt -> CPM -> Zoom -> Dependências -> Linha de Base -> Calendário (Mês/Semana) -> Carga de Trabalho', async ({
    page,
  }) => {
    test.setTimeout(180000);
    // 1. Login com o usuário demo Owner
    await page.goto('/pt-BR/login');
    await page.getByTestId('fill-demo-owner').click();
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL('**/pt-BR/workspaces/**');
    await expect(page.getByTestId('user-profile-button')).toBeVisible({ timeout: 10000 });

    // 2. Validação da Home em Modo Claro e Modo Escuro (cabeçalho de bem-vindo e textos)
    await page.goto('/pt-BR');
    await expect(page.getByTestId('user-profile-button')).toBeVisible({ timeout: 20000 });
    const welcomeHeading = page.locator('h1').first();
    await expect(welcomeHeading).toBeVisible();
    await expect(welcomeHeading).toHaveText(/Bem-vindo/i);

    // Screenshot Home Modo Claro
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-home-light.png',
      fullPage: true,
    });

    // Alternar para Modo Escuro
    const themeBtn = page.getByTestId('theme-toggle-button');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(500);

    // Verificar se o texto "Bem-vindo" e cartões continuam visíveis no Modo Escuro
    await expect(welcomeHeading).toBeVisible();
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-home-dark.png',
      fullPage: true,
    });

    // 3. Navegar para a página de Projetos e abrir o projeto principal FLX
    await page.goto('/pt-BR/projects');
    await expect(page.getByTestId('user-profile-button')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('project-card-FLX')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('open-project-FLX').click();
    await page.waitForURL('**/pt-BR/projects/**');

    // 4. Testar Visão Gantt no Modo Escuro
    const ganttTab = page.getByTestId('tab-gantt');
    await expect(ganttTab).toBeVisible();
    await ganttTab.click();

    // Aguardar container do Gantt
    await expect(page.getByTestId('gantt-container')).toBeVisible({ timeout: 10000 });

    // Verificar tarefas renderizadas na tabela lateral do Gantt
    await expect(page.getByText('Configurar Monorepo e Docker (Fase 0)').first()).toBeVisible();

    // Screenshot Gantt Modo Escuro
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-gantt-dark.png',
      fullPage: true,
    });

    // Alternar de volta para Modo Claro
    await themeBtn.click();
    await page.waitForTimeout(500);

    // Alternar Caminho Crítico (CPM)
    const cpmToggle = page.getByTestId('toggle-critical-path');
    await expect(cpmToggle).toBeVisible();
    await cpmToggle.click();

    // Alternar Níveis de Zoom (Semana e Mês)
    const zoomWeek = page.getByTestId('zoom-week');
    if (await zoomWeek.isVisible()) {
      await zoomWeek.click();
    }

    // Capturar Screenshot do Gantt Modo Claro com CPM e Linhas de Dependência
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-gantt-cpm.png',
      fullPage: true,
    });

    // 4.1 Testar Escala Trimestre (QUARTER) com linhas e calendário nítidos
    const zoomQuarter = page.getByTestId('zoom-quarter');
    await expect(zoomQuarter).toBeVisible();
    await zoomQuarter.click();
    await page.waitForTimeout(500);

    // Capturar Screenshot do Gantt em Escala Trimestre
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-gantt-quarter.png',
      fullPage: true,
    });

    // Voltar para Semana para testar colapso da tabela lateral
    await zoomWeek.click();
    await page.waitForTimeout(300);

    // 4.2 Testar Ocultar/Colapsar Coluna Lateral Esquerda (Gráfico Maior e Flexível)
    const toggleTableBtn = page.getByTestId('toggle-table-button');
    await expect(toggleTableBtn).toBeVisible();
    await toggleTableBtn.click();
    await page.waitForTimeout(500);

    // Verificar se botão flutuante para reabrir tabela está presente
    const expandFloatingBtn = page.getByTestId('expand-table-floating-button');
    await expect(expandFloatingBtn).toBeVisible();

    // Capturar Screenshot do Gantt com Tabela Oculta (gráfico expandido)
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-gantt-table-collapsed.png',
      fullPage: true,
    });

    // Reabrir a tabela lateral pelo botão flutuante
    await expandFloatingBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('gantt-table-container')).toBeVisible();

    // 4.3 Testar Modo Tela Cheia (Fullscreen)
    const fullscreenBtn = page.getByTestId('toggle-fullscreen-button');
    await expect(fullscreenBtn).toBeVisible();
    await fullscreenBtn.click();
    await page.waitForTimeout(500);

    // Capturar Screenshot do Gantt em Tela Cheia
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-gantt-fullscreen.png',
      fullPage: true,
    });

    // Sair de tela cheia
    await fullscreenBtn.click();
    await page.waitForTimeout(300);

    // 4.4 Testar Exportação do Gráfico de Gantt em Imagem PNG com Datas e Linhas
    const exportBtn = page.getByTestId('export-png-button');
    await expect(exportBtn).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;
    await download.saveAs('../../docs/phases/fase-04/screenshots/phase4-gantt-exported.png');

    // 5. Testar Visão de Calendário (Mês e Semana)
    const calendarTab = page.getByTestId('tab-calendar');
    await expect(calendarTab).toBeVisible();
    await calendarTab.click();

    await expect(page.getByTestId('calendar-container')).toBeVisible({ timeout: 10000 });

    // Alternar para modo Semana
    const weekModeBtn = page.getByTestId('calendar-mode-week');
    await expect(weekModeBtn).toBeVisible();
    await weekModeBtn.click();

    // Capturar Screenshot do Calendário
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-calendar.png',
      fullPage: true,
    });

    // 6. Testar Visão de Carga de Trabalho (Workload)
    const workloadTab = page.getByTestId('tab-workload');
    await expect(workloadTab).toBeVisible();
    await workloadTab.click();

    await expect(page.getByTestId('workload-container')).toBeVisible({ timeout: 10000 });

    // Capturar Screenshot da Carga de Trabalho
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-workload.png',
      fullPage: true,
    });

    // 7. Testar Drawer de Detalhes da Tarefa e Seção de Dependências
    // Volta para a aba Lista para abrir a tarefa FLX-2
    const listTab = page.getByTestId('tab-list');
    await listTab.click();

    const taskRow = page.getByText('Configurar Monorepo e Docker (Fase 0)').first();
    await expect(taskRow).toBeVisible();
    await taskRow.click();

    await expect(page.getByTestId('task-detail-drawer')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Dependências de Tarefas')).toBeVisible();

    // Capturar Screenshot do Drawer com Dependências
    await page.screenshot({
      path: '../../docs/phases/fase-04/screenshots/phase4-dependencies-drawer.png',
    });
  });
});
