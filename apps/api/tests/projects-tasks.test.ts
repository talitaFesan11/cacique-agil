import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 2: Projetos, Tarefas, Checklists, Comentários, Etiquetas, Anexos e Visões Salvas', () => {
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

  it('CRUD DE PROJETOS E TAREFAS: cria projeto com 3 status padrão, numeração sequencial FLX-1/FLX-2 e valida limite de 3 níveis de subtarefas', async () => {
    const owner = await registerUser('Owner Dev', 'owner@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    // 1. Criar projeto FLX
    const createProjRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        name: 'Plataforma FluxoPro',
        key: 'flx',
        description: 'Projeto principal da Fase 2',
        status: 'ACTIVE',
        color: '#2563EB',
      });

    expect(createProjRes.status).toBe(201);
    expect(createProjRes.body.key).toBe('FLX');
    expect(createProjRes.body.statuses).toHaveLength(3);
    const projectId = createProjRes.body.id as string;
    const statuses = createProjRes.body.statuses as Array<{
      id: string;
      name: string;
      category: string;
    }>;

    // 2. Chave duplicada no mesmo workspace -> 409
    const dupProjRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        workspaceId: wsId,
        name: 'Outro Projeto',
        key: 'FLX',
      });
    expect(dupProjRes.status).toBe(409);
    expect(dupProjRes.body.error.code).toBe('PROJECT_KEY_ALREADY_EXISTS');

    // 3. Criar tarefa 1 -> deve receber chave FLX-1
    const task1Res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Implementar Visão Lista de Tarefas',
        priority: 'HIGH',
        assigneeIds: [owner.user.id],
        estimateMinutes: 120,
      });

    expect(task1Res.status).toBe(201);
    expect(task1Res.body.number).toBe(1);
    expect(task1Res.body.key).toBe('FLX-1');
    expect(task1Res.body.priority).toBe('HIGH');

    const task1Id = task1Res.body.id as string;

    // 4. Criar subtarefa nível 2 -> deve receber chave FLX-2
    const task2Res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Subtarefa Nível 2',
        parentId: task1Id,
        priority: 'MEDIUM',
      });
    expect(task2Res.status).toBe(201);
    expect(task2Res.body.key).toBe('FLX-2');
    expect(task2Res.body.parentId).toBe(task1Id);

    const task2Id = task2Res.body.id as string;

    // 5. Criar sub-subtarefa nível 3 -> permitido (FLX-3)
    const task3Res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Subtarefa Nível 3',
        parentId: task2Id,
      });
    expect(task3Res.status).toBe(201);
    expect(task3Res.body.key).toBe('FLX-3');

    const task3Id = task3Res.body.id as string;

    // 6. Tentar criar subtarefa nível 4 -> rejeitado com 400 MAX_SUBTASK_DEPTH_EXCEEDED
    const task4Res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Subtarefa Nível 4 Inválida',
        parentId: task3Id,
      });
    expect(task4Res.status).toBe(400);
    expect(task4Res.body.error.code).toBe('MAX_SUBTASK_DEPTH_EXCEEDED');

    // 7. Atualizar tarefa para status DONE -> progress atualiza para 100
    const doneStatus = statuses.find((s) => s.category === 'DONE')!;
    const patchTaskRes = await request(app)
      .patch(`/api/v1/tasks/${task1Id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        statusId: doneStatus.id,
        title: 'Implementar Visão Lista (Atualizada)',
      });
    expect(patchTaskRes.status).toBe(200);
    expect(patchTaskRes.body.progress).toBe(100);
    expect(patchTaskRes.body.title).toBe('Implementar Visão Lista (Atualizada)');
  });

  it('SUB-RECURSOS E FILTROS: etiquetas, checklists com progresso, comentários com @menção, anexos validados e visões salvas', async () => {
    const owner = await registerUser('Ana Silva', 'ana@fluxopro.local');
    const wsId = owner.defaultWorkspace.id;

    const projRes = await request(app)
      .post(`/api/v1/workspaces/${wsId}/projects`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Produto Core',
        key: 'CORE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id as string;

    // 1. Criar etiqueta no workspace
    const labelRes = await request(app)
      .post(`/api/v1/workspaces/${wsId}/labels`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Backend',
        color: '#8B5CF6',
      });
    expect(labelRes.status).toBe(201);
    const labelId = labelRes.body.id as string;

    // 2. Criar tarefa já com etiqueta vinculada
    const taskRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Criar endpoints REST de tarefas',
        priority: 'URGENT',
        labelIds: [labelId],
      });
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.labels).toHaveLength(1);
    expect(taskRes.body.labels[0].name).toBe('Backend');
    const taskId = taskRes.body.id as string;

    // 3. Criar checklist e 2 itens, marcando 1 como concluído
    const clRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/checklists`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Critérios de Aceite' });
    expect(clRes.status).toBe(201);
    const checklistId = clRes.body.id as string;

    const item1Res = await request(app)
      .post(`/api/v1/checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ text: 'Validar schemas Zod' });
    expect(item1Res.status).toBe(201);

    const item2Res = await request(app)
      .post(`/api/v1/checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ text: 'Escrever testes Supertest' });
    expect(item2Res.status).toBe(201);

    const toggleItemRes = await request(app)
      .patch(`/api/v1/checklist-items/${item1Res.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ done: true });
    expect(toggleItemRes.status).toBe(200);
    expect(toggleItemRes.body.done).toBe(true);

    // 4. Adicionar comentário com menção @carlos
    const commentRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        text: 'Revisar validação de RBAC com @carlos antes do merge.',
      });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.body.mentions).toContain('carlos');

    // 5. Registrar anexo válido e rejeitar tipo MIME não permitido
    const validAttachRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        fileName: 'arquitetura-fase2.pdf',
        mimeType: 'application/pdf',
        size: 102400,
      });
    expect(validAttachRes.status).toBe(201);
    expect(validAttachRes.body.storageKey).toContain(`workspaces/${wsId}/tasks/${taskId}/`);

    const invalidAttachRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        fileName: 'malware.exe',
        mimeType: 'application/x-msdownload',
        size: 2048,
      });
    expect(invalidAttachRes.status).toBe(400);

    // 6. Consultar detalhes completos da tarefa para o Drawer
    const detailRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.checklistSummary).toEqual({
      totalItems: 2,
      completedItems: 1,
    });
    expect(detailRes.body.commentCount).toBe(1);
    expect(detailRes.body.attachmentCount).toBe(1);

    // 7. Filtrar tarefas por busca e por etiqueta
    const searchRes = await request(app)
      .get(`/api/v1/projects/${projectId}/tasks?search=CORE-1&labelId=${labelId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body).toHaveLength(1);

    const emptySearchRes = await request(app)
      .get(`/api/v1/projects/${projectId}/tasks?search=inexistente`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(emptySearchRes.status).toBe(200);
    expect(emptySearchRes.body).toHaveLength(0);

    // 8. Criar e listar Visão Salva (SavedView)
    const savedViewRes = await request(app)
      .post(`/api/v1/projects/${projectId}/saved-views`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Urgentes de Backend',
        type: 'LIST',
        shared: true,
        config: {
          priority: 'URGENT',
          labelId,
          groupBy: 'status',
        },
      });
    expect(savedViewRes.status).toBe(201);

    const listViewsRes = await request(app)
      .get(`/api/v1/projects/${projectId}/saved-views`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(listViewsRes.status).toBe(200);
    expect(listViewsRes.body).toHaveLength(1);
    expect(listViewsRes.body[0].name).toBe('Urgentes de Backend');
  });

  it('ISOLAMENTO MULTI-TENANT E RBAC (GUEST vs MEMBER): impede acesso entre workspaces e bloqueia escrita de GUEST em projetos/tarefas', async () => {
    const tenantA = await registerUser('Tenant A Owner', 'tenanta@org.local');
    const tenantB = await registerUser('Tenant B Owner', 'tenantb@org.local');
    const guest = await registerUser('Guest User', 'guest@org.local');

    const wsA = tenantA.defaultWorkspace.id;

    // Convidar e aceitar Guest no Workspace A
    const inviteRes = await request(app)
      .post(`/api/v1/workspaces/${wsA}/invites`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({ email: 'guest@org.local', role: 'GUEST' });
    await request(app)
      .post(`/api/v1/workspaces/invites/${inviteRes.body.token}/accept`)
      .set('Authorization', `Bearer ${guest.accessToken}`);

    // Criar projeto e tarefa no Workspace A
    const projRes = await request(app)
      .post(`/api/v1/workspaces/${wsA}/projects`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({ name: 'Projeto Secreto A', key: 'SECA' });
    const projectId = projRes.body.id as string;

    const taskRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({ title: 'Tarefa Confidencial A' });
    const taskId = taskRes.body.id as string;

    // 1. Tenant B tenta ler projeto ou tarefa de Tenant A -> 403 FORBIDDEN
    const bGetProj = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tenantB.accessToken}`);
    expect(bGetProj.status).toBe(403);

    const bGetTasks = await request(app)
      .get(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${tenantB.accessToken}`);
    expect(bGetTasks.status).toBe(403);

    const bPatchTask = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tenantB.accessToken}`)
      .send({ title: 'Hack' });
    expect(bPatchTask.status).toBe(403);

    // 2. Guest no Workspace A PODE ler projetos, tarefas e comentar (seção 1.1)
    const guestGetTasks = await request(app)
      .get(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${guest.accessToken}`);
    expect(guestGetTasks.status).toBe(200);
    expect(guestGetTasks.body).toHaveLength(1);

    const guestComment = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${guest.accessToken}`)
      .send({ text: 'Comentário do cliente convidado' });
    expect(guestComment.status).toBe(201);

    // 3. Guest NÃO PODE criar ou editar projetos/tarefas -> 403 INSUFFICIENT_ROLE
    const guestCreateTask = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${guest.accessToken}`)
      .send({ title: 'Tentativa Guest' });
    expect(guestCreateTask.status).toBe(403);
    expect(guestCreateTask.body.error.code).toBe('INSUFFICIENT_ROLE');

    const guestPatchTask = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${guest.accessToken}`)
      .send({ title: 'Tentativa Edição Guest' });
    expect(guestPatchTask.status).toBe(403);
  });
});
