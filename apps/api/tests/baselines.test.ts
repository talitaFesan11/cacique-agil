import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 4: Linha de Base (Baseline) do Projeto', () => {
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

  it('cria snapshot de baseline, lista, consulta detalhes com itens e exclui', async () => {
    const owner = await registerUser('Marina Baseline', 'marina.base@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    // 1. Criar projeto
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        name: 'Projeto Baseline Teste',
        key: 'BSL',
      });
    const projectId = projRes.body.id;

    // 2. Criar tarefas
    await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Tarefa Planejada 1',
        startDate: '2026-11-01T09:00:00.000Z',
        dueDate: '2026-11-05T18:00:00.000Z',
      });

    await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Tarefa Planejada 2',
        startDate: '2026-11-06T09:00:00.000Z',
        dueDate: '2026-11-12T18:00:00.000Z',
      });

    // 3. Criar baseline
    const createRes = await request(app)
      .post(`/api/v1/projects/${projectId}/baselines`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Plano Original Aprovado',
        description: 'Primeiro snapshot do comitê de planejamento',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Plano Original Aprovado');
    expect(createRes.body.data.itemCount).toBe(2);
    const baselineId = createRes.body.data.id;

    // 4. Listar baselines
    const listRes = await request(app)
      .get(`/api/v1/projects/${projectId}/baselines`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);

    // 5. Consultar detalhes de uma baseline
    const getRes = await request(app)
      .get(`/api/v1/projects/${projectId}/baselines/${baselineId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.items.length).toBe(2);

    // 6. Consultar Gantt passando baselineId para verificar varianceDays
    const ganttRes = await request(app)
      .get(`/api/v1/projects/${projectId}/gantt?baselineId=${baselineId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(ganttRes.status).toBe(200);
    expect(ganttRes.body.data.tasks[0].baselineDueDate).toBeDefined();

    // 7. Excluir baseline
    const deleteRes = await request(app)
      .delete(`/api/v1/projects/${projectId}/baselines/${baselineId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(deleteRes.status).toBe(204);
  });
});
