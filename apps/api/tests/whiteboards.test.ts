import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 6: Quadros Brancos (Whiteboards), Templates e Conversão em Tarefas', () => {
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

  async function createProject(token: string, workspaceId: string, name: string, key: string) {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workspaceId,
        name,
        key,
      });
    return res.body;
  }

  it('lista modelos pré-definidos de quadros brancos', async () => {
    const owner = await registerUser('Carlos Whiteboard', 'carlos.wb@cacique.local');
    const res = await request(app)
      .get('/api/v1/whiteboards/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    const categories = res.body.data.map((t: { id: string }) => t.id);
    expect(categories).toContain('brainstorming');
    expect(categories).toContain('mindmap');
    expect(categories).toContain('flowchart');
    expect(categories).toContain('retrospective');
  });

  it('cria quadro branco a partir de template, atualiza elementos e exporta para SVG', async () => {
    const owner = await registerUser('Beatriz Canvas', 'beatriz.canvas@cacique.local');
    const wsId = owner.defaultWorkspace.id;
    const project = await createProject(owner.accessToken, wsId, 'Lançamento v1', 'FLX');

    // 1. Cria quadro com template de Brainstorming
    const createRes = await request(app)
      .post('/api/v1/whiteboards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        projectId: project.id,
        title: 'Brainstorming de Produto',
        templateCategory: 'brainstorming',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Brainstorming de Produto');
    expect(createRes.body.data.templateCategory).toBe('brainstorming');
    expect(createRes.body.data.elementsJson.length).toBeGreaterThan(0);
    const boardId = createRes.body.data.id;

    // 2. Busca quadro por ID
    const getRes = await request(app)
      .get(`/api/v1/whiteboards/${boardId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(boardId);
    expect(getRes.body.data.elementsCount).toBeGreaterThan(0);

    // 3. Atualiza título
    const updateRes = await request(app)
      .patch(`/api/v1/whiteboards/${boardId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Brainstorming Atualizado',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Brainstorming Atualizado');

    // 4. Exporta para SVG
    const svgRes = await request(app)
      .get(`/api/v1/whiteboards/${boardId}/export?format=svg`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(svgRes.status).toBe(200);
    const contentType = String(svgRes.headers['content-type'] || '');
    expect(contentType).toContain('image/svg+xml');
    const svgText = svgRes.text || (svgRes.body ? svgRes.body.toString() : '');
    expect(svgText).toContain('<svg');
  });

  it('converte nota adesiva em tarefa real no projeto e vincula via EntityLink', async () => {
    const owner = await registerUser('Daniel Sticky', 'daniel.sticky@cacique.local');
    const wsId = owner.defaultWorkspace.id;
    const project = await createProject(owner.accessToken, wsId, 'Core Engine', 'ENG');

    // 1. Cria quadro com post-it
    const boardRes = await request(app)
      .post('/api/v1/whiteboards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        projectId: project.id,
        title: 'Quadro de Arquitetura',
        initialElements: [
          {
            id: 'sticky-auth',
            type: 'sticky',
            x: 100,
            y: 150,
            width: 200,
            height: 180,
            text: 'Refatorar validação JWT nos WebSockets',
            backgroundColor: '#fef08a',
            color: '#854d0e',
          },
        ],
      });

    expect(boardRes.status).toBe(201);
    const boardId = boardRes.body.data.id;

    // 2. Converte post-it em tarefa
    const convertRes = await request(app)
      .post(`/api/v1/whiteboards/${boardId}/convert-sticky`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        stickyId: 'sticky-auth',
        projectId: project.id,
        priority: 'HIGH',
      });

    expect(convertRes.status).toBe(201);
    expect(convertRes.body.data.task).toBeDefined();
    expect(convertRes.body.data.task.title).toBe('Refatorar validação JWT nos WebSockets');
    expect(convertRes.body.data.task.priority).toBe('HIGH');
    expect(convertRes.body.data.task.key).toBe('ENG-1');

    // O elemento no canvas é convertido em task_card
    expect(convertRes.body.data.element.type).toBe('task_card');
    expect(convertRes.body.data.element.taskId).toBe(convertRes.body.data.task.id);
    expect(convertRes.body.data.element.taskKey).toBe('ENG-1');

    // 3. Verifica quadro atualizado
    const updatedBoardRes = await request(app)
      .get(`/api/v1/whiteboards/${boardId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(updatedBoardRes.status).toBe(200);
    expect(updatedBoardRes.body.data.linkedTasksCount).toBe(1);
    const cardEl = updatedBoardRes.body.data.elementsJson.find((e: { id: string }) => e.id === 'sticky-auth');
    expect(cardEl.type).toBe('task_card');
  });

  it('impede que usuário de outro workspace acesse o quadro branco (isolamento multi-tenant)', async () => {
    const userA = await registerUser('User Alpha', 'alpha@cacique.local');
    const userB = await registerUser('User Beta', 'beta@cacique.local');

    const boardRes = await request(app)
      .post('/api/v1/whiteboards')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        workspaceId: userA.defaultWorkspace.id,
        title: 'Quadro Privado Alpha',
      });

    expect(boardRes.status).toBe(201);
    const boardId = boardRes.body.data.id;

    // User B tenta ler quadro de User A
    const forbiddenGet = await request(app)
      .get(`/api/v1/whiteboards/${boardId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(forbiddenGet.status).toBe(403);

    // User B tenta excluir quadro de User A
    const forbiddenDelete = await request(app)
      .delete(`/api/v1/whiteboards/${boardId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(forbiddenDelete.status).toBe(403);
  });
});
