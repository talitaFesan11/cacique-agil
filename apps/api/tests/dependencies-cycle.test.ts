import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import {
  DependencyType,
  detectDependencyCycle,
  validateGraphAcyclic,
} from '@fluxo/shared';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 4: Dependências e Algoritmo de Detecção de Ciclos (DAG)', () => {
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

  describe('Algoritmo Puro de Detecção de Ciclos (@fluxo/shared)', () => {
    it('rejeita auto-dependência direta (u -> u)', () => {
      const result = detectDependencyCycle([], {
        predecessorId: 'task-A',
        successorId: 'task-A',
      });
      expect(result.hasCycle).toBe(true);
      expect(result.message).toContain('depender de si mesma');
    });

    it('detecta ciclo simples de 2 nós (A -> B e B -> A)', () => {
      const existing = [{ predecessorId: 'task-A', successorId: 'task-B' }];
      const candidate = { predecessorId: 'task-B', successorId: 'task-A' };

      const result = detectDependencyCycle(existing, candidate);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['task-B', 'task-A', 'task-B']);
    });

    it('detecta ciclo composto em cadeia (A -> B -> C -> A)', () => {
      const existing = [
        { predecessorId: 'task-A', successorId: 'task-B' },
        { predecessorId: 'task-B', successorId: 'task-C' },
      ];
      const candidate = { predecessorId: 'task-C', successorId: 'task-A' };

      const result = detectDependencyCycle(existing, candidate);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['task-C', 'task-A', 'task-B', 'task-C']);
    });

    it('permite grafo acíclico válido em diamante (A -> B -> D e A -> C -> D)', () => {
      const edges = [
        { predecessorId: 'task-A', successorId: 'task-B' },
        { predecessorId: 'task-A', successorId: 'task-C' },
        { predecessorId: 'task-B', successorId: 'task-D' },
      ];
      const candidate = { predecessorId: 'task-C', successorId: 'task-D' };

      const result = detectDependencyCycle(edges, candidate);
      expect(result.hasCycle).toBe(false);
      expect(validateGraphAcyclic([...edges, candidate]).hasCycle).toBe(false);
    });
  });

  describe('Endpoints REST de Dependências e Auto-Reschedule', () => {
    it('cria dependência válida e bloqueia dependência circular com status 422', async () => {
      const owner = await registerUser('Ana Owner', 'ana.deps@fluxopro.local');
      const wsId = owner.defaultWorkspace.id;

      // 1. Criar projeto
      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          workspaceId: wsId,
          name: 'Projeto Dependências',
          key: 'DEP',
        });
      const projectId = projRes.body.id;

      // 2. Criar 3 tarefas: T1, T2, T3
      const t1 = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Tarefa 1',
          startDate: '2026-11-01T09:00:00.000Z',
          dueDate: '2026-11-05T18:00:00.000Z',
        });
      const t2 = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Tarefa 2',
          startDate: '2026-11-06T09:00:00.000Z',
          dueDate: '2026-11-10T18:00:00.000Z',
        });
      const t3 = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Tarefa 3',
          startDate: '2026-11-11T09:00:00.000Z',
          dueDate: '2026-11-15T18:00:00.000Z',
        });

      // 3. Adicionar T1 -> T2 (FS)
      const dep1Res = await request(app)
        .post(`/api/v1/projects/${projectId}/dependencies`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          predecessorId: t1.body.id,
          successorId: t2.body.id,
          type: DependencyType.FS,
          lagDays: 0,
        });
      expect(dep1Res.status).toBe(201);
      expect(dep1Res.body.data.predecessorId).toBe(t1.body.id);
      expect(dep1Res.body.data.successorId).toBe(t2.body.id);

      // 4. Adicionar T2 -> T3 (FS)
      const dep2Res = await request(app)
        .post(`/api/v1/projects/${projectId}/dependencies`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          predecessorId: t2.body.id,
          successorId: t3.body.id,
          type: DependencyType.FS,
          lagDays: 0,
        });
      expect(dep2Res.status).toBe(201);

      // 5. Tentar adicionar T3 -> T1 (fecharia ciclo T1 -> T2 -> T3 -> T1) -> deve retornar 422
      const cycleRes = await request(app)
        .post(`/api/v1/projects/${projectId}/dependencies`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          predecessorId: t3.body.id,
          successorId: t1.body.id,
          type: DependencyType.FS,
        });
      expect(cycleRes.status).toBe(422);
      expect(cycleRes.body.error.code).toBe('DEPENDENCY_CYCLE_DETECTED');

      // 6. Listar dependências do projeto
      const listRes = await request(app)
        .get(`/api/v1/projects/${projectId}/dependencies`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(2);

      // 7. Auto-reschedule endpoint
      const rescheduleRes = await request(app)
        .post(`/api/v1/projects/${projectId}/auto-reschedule`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({});
      expect(rescheduleRes.status).toBe(200);

      // 8. Excluir dependência
      const deleteRes = await request(app)
        .delete(`/api/v1/projects/${projectId}/dependencies/${dep1Res.body.data.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(deleteRes.status).toBe(204);
    });
  });
});
