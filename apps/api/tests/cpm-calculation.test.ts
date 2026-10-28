import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import {
  calculateCPM,
  DependencyType,
} from '@fluxo/shared';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 4: Algoritmo CPM (Critical Path Method) e Endpoint de Gantt', () => {
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

  describe('Algoritmo Matemático de CPM (@fluxo/shared)', () => {
    it('identifica corretamente caminho crítico em sequência simples e caminhos paralelos', () => {
      // Grafo:
      // T1 (duração 5) -> T2 (duração 10) -> T4 (duração 2)
      // T1 (duração 5) -> T3 (duração 3)  -> T4 (duração 2)
      // Caminho crítico deve ser T1 -> T2 -> T4 (5 + 10 + 2 = 17 dias)
      // T3 tem folga total (float) = 7 dias
      const tasks = [
        { id: 'T1', durationDays: 5 },
        { id: 'T2', durationDays: 10 },
        { id: 'T3', durationDays: 3 },
        { id: 'T4', durationDays: 2 },
      ];

      const dependencies = [
        { predecessorId: 'T1', successorId: 'T2', type: DependencyType.FS },
        { predecessorId: 'T1', successorId: 'T3', type: DependencyType.FS },
        { predecessorId: 'T2', successorId: 'T4', type: DependencyType.FS },
        { predecessorId: 'T3', successorId: 'T4', type: DependencyType.FS },
      ];

      const result = calculateCPM(tasks, dependencies, new Date('2026-11-01'));

      expect(result.projectDurationDays).toBe(17);
      expect(result.criticalPathTaskIds).toContain('T1');
      expect(result.criticalPathTaskIds).toContain('T2');
      expect(result.criticalPathTaskIds).toContain('T4');
      expect(result.criticalPathTaskIds).not.toContain('T3');

      const t3Metrics = result.metricsByTaskId.get('T3');
      expect(t3Metrics).toBeDefined();
      expect(t3Metrics?.isCritical).toBe(false);
      expect(t3Metrics?.totalFloat).toBe(7);

      const t2Metrics = result.metricsByTaskId.get('T2');
      expect(t2Metrics?.isCritical).toBe(true);
      expect(t2Metrics?.totalFloat).toBe(0);
    });

    it('trata marco (isMilestone) com duração zero', () => {
      const tasks = [
        { id: 'T1', durationDays: 4 },
        { id: 'M1', isMilestone: true },
      ];
      const dependencies = [
        { predecessorId: 'T1', successorId: 'M1', type: DependencyType.FS },
      ];

      const result = calculateCPM(tasks, dependencies, new Date('2026-11-01'));
      expect(result.projectDurationDays).toBe(4);
      expect(result.criticalPathTaskIds).toContain('M1');
    });
  });

  describe('Endpoints GET /projects/:id/gantt e /workload', () => {
    it('retorna dados do Gantt estruturados com CPM e tarefas enriquecidas', async () => {
      const owner = await registerUser('Carlos Gantt', 'carlos.gantt@fluxopro.local');
      const wsId = owner.defaultWorkspace.id;

      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          workspaceId: wsId,
          name: 'Projeto Gantt Teste',
          key: 'GNT',
        });
      const projectId = projRes.body.id;

      // Criar 2 tarefas
      const t1 = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Tarefa A',
          startDate: '2026-11-01T09:00:00.000Z',
          dueDate: '2026-11-05T18:00:00.000Z',
          estimateMinutes: 240,
        });

      const t2 = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Tarefa B',
          startDate: '2026-11-06T09:00:00.000Z',
          dueDate: '2026-11-10T18:00:00.000Z',
          estimateMinutes: 180,
        });

      // Conectar T1 -> T2
      await request(app)
        .post(`/api/v1/projects/${projectId}/dependencies`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          predecessorId: t1.body.id,
          successorId: t2.body.id,
          type: DependencyType.FS,
        });

      // Consultar Gantt
      const ganttRes = await request(app)
        .get(`/api/v1/projects/${projectId}/gantt`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(ganttRes.status).toBe(200);
      expect(ganttRes.body.data.projectId).toBe(projectId);
      expect(ganttRes.body.data.tasks.length).toBe(2);
      expect(ganttRes.body.data.dependencies.length).toBe(1);
      expect(ganttRes.body.data.criticalPathTaskIds.length).toBeGreaterThan(0);

      // Consultar Workload
      const workloadRes = await request(app)
        .get(`/api/v1/projects/${projectId}/workload`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(workloadRes.status).toBe(200);
      expect(workloadRes.body.data.members).toBeDefined();
    });
  });
});
