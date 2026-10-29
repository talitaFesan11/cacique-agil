import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 5: Documentos Colaborativos, Wiki e Versões', () => {
  const app = createApp();

  beforeEach(() => {
    testDb.reset();
    vi.restoreAllMocks();
  });

  async function registerUser(name: string, email: string) {
    const res = await request(app).post('/api/v1/auth/register').send({
      name,
      email,
      password: 'Password@123',
    });
    return {
      accessToken: res.body.accessToken as string,
      user: res.body.user as { id: string; email: string; name: string },
      defaultWorkspace: res.body.workspaces[0].workspace as {
        id: string;
        name: string;
        slug: string;
      },
    };
  }

  it('cria documento, cria subpágina, move na árvore e lista hierarquia', async () => {
    const owner = await registerUser('Ana Docs', 'ana.docs@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    // 1. Criar documento raiz
    const doc1Res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        title: 'Documento Principal',
        icon: '🚀',
      });

    expect(doc1Res.status).toBe(201);
    expect(doc1Res.body.data.title).toBe('Documento Principal');
    expect(doc1Res.body.data.icon).toBe('🚀');
    const doc1Id = doc1Res.body.data.id;

    // 2. Criar subpágina vinculada ao doc1
    const subDocRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        parentId: doc1Id,
        title: 'Subpágina de Arquitetura',
        icon: '📐',
      });

    expect(subDocRes.status).toBe(201);
    expect(subDocRes.body.data.parentId).toBe(doc1Id);
    const subDocId = subDocRes.body.data.id;

    // 3. Obter árvore de documentos
    const treeRes = await request(app)
      .get(`/api/v1/workspaces/${wsId}/documents/tree`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(treeRes.status).toBe(200);
    expect(treeRes.body.data.length).toBe(1);
    expect(treeRes.body.data[0].id).toBe(doc1Id);
    expect(treeRes.body.data[0].children.length).toBe(1);
    expect(treeRes.body.data[0].children[0].id).toBe(subDocId);

    // 4. Prevenção de ciclo: mover doc1 para ser filho de subDoc deve falhar com 400
    const cyclicMoveRes = await request(app)
      .post(`/api/v1/documents/${doc1Id}/move`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ parentId: subDocId });

    expect(cyclicMoveRes.status).toBe(400);

    // 5. Mover subpágina para a raiz
    const moveRes = await request(app)
      .post(`/api/v1/documents/${subDocId}/move`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ parentId: null });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.parentId).toBeNull();
  });

  it('garante isolamento multi-tenant: usuário de outro workspace não acessa documento', async () => {
    const ownerA = await registerUser('User A', 'user.a@fluxopro.local');
    const ownerB = await registerUser('User B', 'user.b@fluxopro.local');

    const docARes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .send({
        workspaceId: ownerA.defaultWorkspace.id,
        title: 'Doc Confidencial Workspace A',
      });
    const docAId = docARes.body.data.id;

    // User B tenta ler doc do Workspace A
    const readRes = await request(app)
      .get(`/api/v1/documents/${docAId}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`);
    expect(readRes.status).toBe(403);

    // User B tenta atualizar doc do Workspace A
    const updateRes = await request(app)
      .patch(`/api/v1/documents/${docAId}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .send({ title: 'Ataque hacker' });
    expect(updateRes.status).toBe(403);

    // User B tenta deletar doc do Workspace A
    const deleteRes = await request(app)
      .delete(`/api/v1/documents/${docAId}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('gerencia favoritos, templates e exportação para Markdown', async () => {
    const owner = await registerUser('Carlos Wiki', 'carlos.wiki@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    // 1. Criar doc
    const docRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        title: 'Guia de Contribuição',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Guia de Contribuição' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Boas práticas de commit e fluxo de PR.' }],
            },
          ],
        },
      });
    const docId = docRes.body.data.id;

    // 2. Favoritar
    const favRes1 = await request(app)
      .post(`/api/v1/documents/${docId}/favorite`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(favRes1.status).toBe(200);
    expect(favRes1.body.data.isFavorite).toBe(true);

    // 3. Desfavoritar
    const favRes2 = await request(app)
      .post(`/api/v1/documents/${docId}/favorite`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(favRes2.status).toBe(200);
    expect(favRes2.body.data.isFavorite).toBe(false);

    // 4. Listar templates
    const templatesRes = await request(app)
      .get(`/api/v1/workspaces/${wsId}/documents/templates`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(templatesRes.status).toBe(200);
    expect(templatesRes.body.data.predefined.length).toBeGreaterThanOrEqual(3);

    // 5. Criar documento a partir de template
    const templateDocRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        templateId: 'template-meeting-notes',
        title: 'Ata da Reunião Semanal',
      });
    expect(templateDocRes.status).toBe(201);
    expect(templateDocRes.body.data.title).toBe('Ata da Reunião Semanal');
    expect(templateDocRes.body.data.contentJson.type).toBe('doc');

    // 6. Exportar para Markdown
    const exportRes = await request(app)
      .get(`/api/v1/documents/${docId}/export?format=markdown`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain('# Guia de Contribuição');
  });

  it('registra versões manuais e realiza restauração atômica', async () => {
    const owner = await registerUser('Marina Versões', 'marina.versions@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    const docRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        title: 'Documento Versionado',
        contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'v1 original' }] }] },
      });
    const docId = docRes.body.data.id;

    // 1. Criar versão 1
    const v1Res = await request(app)
      .post(`/api/v1/documents/${docId}/versions`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Versão 1.0 Aprovada' });
    expect(v1Res.status).toBe(201);
    expect(v1Res.body.data.versionNumber).toBe(1);
    expect(v1Res.body.data.name).toBe('Versão 1.0 Aprovada');
    const v1Id = v1Res.body.data.id;

    // 2. Modificar o documento para v2
    await request(app)
      .patch(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'v2 alterada' }] }] },
      });

    // 3. Restaurar versão 1
    const restoreRes = await request(app)
      .post(`/api/v1/documents/${docId}/versions/${v1Id}/restore`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.document.contentJson.content[0].content[0].text).toBe('v1 original');
  });
});
