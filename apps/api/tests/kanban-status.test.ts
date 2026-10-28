import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';
import { socketEmitter } from '../src/realtime/socket.emitter.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 3: Kanban — Gestão de Status, Limite WIP, Ordenação e Eventos', () => {
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

  it('KANBAN STATUS CRUD: cria status, atualiza nome/cor/limite WIP, reordena e valida exclusão protegida', async () => {
    const owner = await registerUser('Admin Kanban', 'admin.kanban@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    // 1. Criar projeto
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        name: 'Projeto Kanban Teste',
        key: 'KNB',
      });

    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id as string;
    const initialStatuses = projRes.body.statuses as Array<{ id: string; name: string }>;
    expect(initialStatuses.length).toBe(3); // A Fazer, Em Andamento, Concluído

    // 2. Criar novo status "Em Revisão" com wipLimit: 2 e cor #F59E0B
    const createStatusRes = await request(app)
      .post(`/api/v1/projects/${projectId}/statuses`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Em Revisão',
        category: 'IN_PROGRESS',
        color: '#F59E0B',
        wipLimit: 2,
      });

    expect(createStatusRes.status).toBe(201);
    expect(createStatusRes.body.name).toBe('Em Revisão');
    expect(createStatusRes.body.wipLimit).toBe(2);
    expect(createStatusRes.body.color).toBe('#F59E0B');
    const reviewStatusId = createStatusRes.body.id as string;

    // 3. Atualizar status (PATCH)
    const updateStatusRes = await request(app)
      .patch(`/api/v1/projects/${projectId}/statuses/${reviewStatusId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Revisão Técnica',
        wipLimit: 3,
        color: '#8B5CF6',
      });

    expect(updateStatusRes.status).toBe(200);
    expect(updateStatusRes.body.name).toBe('Revisão Técnica');
    expect(updateStatusRes.body.wipLimit).toBe(3);
    expect(updateStatusRes.body.color).toBe('#8B5CF6');

    // 4. Criar tarefa no status "Revisão Técnica"
    const taskRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Tarefa para Testar Exclusão Protegida',
        statusId: reviewStatusId,
      });
    expect(taskRes.status).toBe(201);

    // 5. Tentar excluir status que contém tarefas -> 400 STATUS_IN_USE
    const deleteUsedStatusRes = await request(app)
      .delete(`/api/v1/projects/${projectId}/statuses/${reviewStatusId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(deleteUsedStatusRes.status).toBe(400);
    expect(deleteUsedStatusRes.body.error.code).toBe('STATUS_IN_USE');

    // 6. Mover tarefa para outro status (Concluído) e excluir status agora vazio
    const doneStatus = initialStatuses.find((s) => s.name === 'Concluído')!;
    const moveRes = await request(app)
      .post(`/api/v1/tasks/${taskRes.body.id}/move`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        statusId: doneStatus.id,
        position: 1500,
      });
    expect(moveRes.status).toBe(200);
    expect(moveRes.body.statusId).toBe(doneStatus.id);
    expect(moveRes.body.position).toBe(1500);

    // Exclusão bem-sucedida
    const deleteEmptyStatusRes = await request(app)
      .delete(`/api/v1/projects/${projectId}/statuses/${reviewStatusId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(deleteEmptyStatusRes.status).toBe(200);

    // 7. Reordenar status restantes
    const reorderRes = await request(app)
      .post(`/api/v1/projects/${projectId}/statuses/reorder`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        statusIds: [doneStatus.id, initialStatuses[0]!.id],
      });
    expect(reorderRes.status).toBe(200);
    expect(reorderRes.body[0].id).toBe(doneStatus.id);
    expect(reorderRes.body[0].position).toBe(1000);
  });

  it('KANBAN MOVE & EMISSÃO SOCKET: mover card atualiza ordenação fracionária e dispara socketEmitter', async () => {
    const owner = await registerUser('Carlos Move', 'carlos.move@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        name: 'Projeto Move',
        key: 'MOV',
      });

    const projectId = projRes.body.id as string;
    const todoStatus = projRes.body.statuses.find((s: { name: string }) => s.name === 'A Fazer')!;
    const inProgressStatus = projRes.body.statuses.find((s: { name: string }) => s.name === 'Em Andamento')!;

    // Criar duas tarefas
    const t1 = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Task 1', statusId: todoStatus.id });

    const t2 = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Task 2', statusId: todoStatus.id });

    // Espia emissão de socket
    const movedSpy = vi.spyOn(socketEmitter, 'taskMoved');
    const updatedSpy = vi.spyOn(socketEmitter, 'taskUpdated');

    // Mover Task 2 para "Em Andamento" com posição fracionária
    const moveRes = await request(app)
      .post(`/api/v1/tasks/${t2.body.id}/move`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        statusId: inProgressStatus.id,
        position: 1250.5,
      });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.statusId).toBe(inProgressStatus.id);
    expect(moveRes.body.position).toBe(1250.5);

    expect(movedSpy).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({
        taskId: t2.body.id,
        projectId,
        statusId: inProgressStatus.id,
        position: 1250.5,
      }),
    );
    expect(updatedSpy).toHaveBeenCalledWith(projectId, expect.objectContaining({ id: t2.body.id }));
  });
});
