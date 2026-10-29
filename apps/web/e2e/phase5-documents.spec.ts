import { test, expect } from 'playwright/test';

test.describe('Fase 5 E2E: Documentos Colaborativos, TipTap + Yjs, Wiki Tree, Versões, Comentários e Templates', () => {
  test('Fluxo completo: Wiki Tree -> Editor TipTap -> Bloco de Tarefa -> Templates -> Versões -> Comentários -> Aba Docs no Projeto', async ({
    page,
  }) => {
    test.setTimeout(120000);

    // 1. Login com o usuário demo Owner (Ana Silva)
    await page.goto('/pt-BR/login');
    await page.getByTestId('fill-demo-owner').click();
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL('**/pt-BR/workspaces/**');
    await expect(page.getByTestId('user-profile-button')).toBeVisible({ timeout: 15000 });

    // 2. Navegar para a seção de Documentos
    await page.goto('/pt-BR/docs');
    await page.waitForLoadState('networkidle');

    // 3. Validação da Árvore de Documentos (Wiki Tree)
    await expect(page.getByTestId('create-doc-root-button')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Especificação e Arquitetura do Produto (PRD)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Diretrizes de Design e UX')).toBeVisible();
    await expect(page.getByText('Ata da Reunião de Kickoff da Sprint')).toBeVisible();

    // Seção de Favoritos visível no topo da barra
    await expect(page.getByText('Favoritos')).toBeVisible();

    // Testar filtro dinâmico de busca de documentos
    const searchInput = page.getByTestId('search-docs-input').locator('input');
    await searchInput.fill('Design');
    await page.waitForTimeout(300);
    await expect(page.getByText('Diretrizes de Design e UX')).toBeVisible();
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // Screenshot 1: Árvore de Documentos (Wiki Tree)
    await page.screenshot({
      path: '../../docs/phases/fase-05/screenshots/phase5-docs-tree.png',
      fullPage: true,
    });

    // 4. Abrir o Documento Principal (PRD)
    await page.getByText('Especificação e Arquitetura do Produto (PRD)').first().click();
    await page.waitForURL('**/pt-BR/docs/**');
    await page.waitForLoadState('networkidle');

    // Validação do Editor TipTap
    await expect(page.getByTestId('doc-title-input')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('toggle-doc-favorite-bar')).toBeVisible();
    await expect(page.getByText('Especificação do Cacique Agil')).toBeVisible({ timeout: 10000 });

    // Embutir bloco de tarefa viva via toolbar
    await page.getByTestId('embed-task-button').click();
    await expect(page.getByText('Embutir Tarefa no Documento')).toBeVisible();
    await page.getByTestId('confirm-embed-task-button').click();

    // Validar bloco de tarefa embutida (FLX-1)
    await expect(page.locator('.embedded-task-wrapper').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('FLX-1').first()).toBeVisible();

    // Screenshot 2: Editor com Toolbar e Bloco de Tarefa
    await page.screenshot({
      path: '../../docs/phases/fase-05/screenshots/phase5-doc-editor.png',
      fullPage: true,
    });

    // 5. Galeria de Modelos (Templates Dialog)
    await page.getByTestId('open-templates-button').click();
    await expect(page.getByText('Galeria de Modelos de Documento')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('template-card-template-meeting-notes')).toBeVisible();
    await expect(page.getByTestId('template-card-template-prd')).toBeVisible();
    await expect(page.getByTestId('template-card-template-retrospective')).toBeVisible();

    // Screenshot 3: Modal de Modelos
    await page.screenshot({
      path: '../../docs/phases/fase-05/screenshots/phase5-doc-templates.png',
      fullPage: true,
    });

    // Fechar diálogo de templates
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 6. Painel de Histórico de Versões
    await page.getByTestId('open-versions-button').click();
    await expect(page.getByText('Histórico de Versões')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Versão Inicial Aprovada/i)).toBeVisible();
    await expect(page.getByTestId('create-version-button')).toBeVisible();
    await expect(page.getByRole('button', { name: /Restaurar/i })).toBeVisible();

    // Screenshot 4: Gaveta de Versões
    await page.screenshot({
      path: '../../docs/phases/fase-05/screenshots/phase5-doc-versions.png',
      fullPage: true,
    });

    // Fechar drawer de versões
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 7. Painel de Comentários Inline
    await page.getByTestId('open-comments-button').click();
    await expect(page.getByText(/Comentários/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Excelente contextualização técnica, alinhado com o roadmap!')).toBeVisible();
    await expect(page.getByText('“arquitetura do produto”')).toBeVisible();
    await expect(page.getByTestId('comment-input')).toBeVisible();

    // Screenshot 5: Comentários Inline
    await page.screenshot({
      path: '../../docs/phases/fase-05/screenshots/phase5-doc-comments.png',
      fullPage: true,
    });

    // Fechar drawer de comentários
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 8. Navegar para a página de Projetos e validar a Aba de Docs
    await page.goto('/pt-BR/projects');
    await expect(page.getByTestId('project-card-FLX')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('open-project-FLX').click();
    await page.waitForURL('**/pt-BR/projects/**');

    // Clicar na aba Documentos
    const docsTab = page.getByTestId('tab-docs');
    await expect(docsTab).toBeVisible({ timeout: 10000 });
    await docsTab.click();

    // Validar listagem de documentos vinculados ao projeto FLX
    await expect(page.getByText('Documentos do Projeto')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Especificação e Arquitetura do Produto (PRD)').first()).toBeVisible();

    // Screenshot 6: Aba Docs no Projeto
    await page.screenshot({
      path: '../../docs/phases/fase-05/screenshots/phase5-project-docs.png',
      fullPage: true,
    });
  });
});
