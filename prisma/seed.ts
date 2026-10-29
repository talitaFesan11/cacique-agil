import {
  PrismaClient,
  WorkspaceRole,
  ProjectStatus,
  StatusCategory,
  TaskPriority,
  DependencyType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // 1. Limpeza em ordem reversa para garantir idempotência do seed em dev
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.documentFavorite.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.taskBaselineItem.deleteMany();
  await prisma.projectBaseline.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workflowStatus.deleteMany();
  await prisma.document.deleteMany();
  await prisma.whiteboard.deleteMany();
  await prisma.keyResultCheckIn.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.savedView.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 2. Criar Usuários iniciais (Senha padrão de dev: Senha@123 -> hash bcrypt custo 12)
  const passwordHash = '$2a$12$nSZKwMOW2qJ.kvpg1PSrVuVxqUgx/34xIK1gFuOUce5P.q33s9fDa';

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fluxopro.local',
      name: 'Ana Silva (Owner)',
      passwordHash,
      locale: 'pt-BR',
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'membro@fluxopro.local',
      name: 'Carlos Souza (Member)',
      passwordHash,
      locale: 'pt-BR',
    },
  });

  const guestUser = await prisma.user.create({
    data: {
      email: 'convidado@fluxopro.local',
      name: 'Marina Costa (Guest)',
      passwordHash,
      locale: 'pt-BR',
    },
  });

  const externalUser = await prisma.user.create({
    data: {
      email: 'externo@acme.local',
      name: 'Roberto Lima (Acme Owner)',
      passwordHash,
      locale: 'pt-BR',
    },
  });
  console.log(`✓ Usuários criados (senha dev: Senha@123)`);

  // 3. Criar Workspaces
  const defaultWorkspace = await prisma.workspace.create({
    data: {
      name: 'Cacique Agil Org',
      slug: 'fluxopro-org',
    },
  });

  const secondaryWorkspace = await prisma.workspace.create({
    data: {
      name: 'Engenharia & Produto',
      slug: 'engenharia-produto',
    },
  });

  const externalWorkspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp (Isolado)',
      slug: 'acme-corp',
    },
  });
  console.log(
    `✓ Workspaces criados: ${defaultWorkspace.slug}, ${secondaryWorkspace.slug}, ${externalWorkspace.slug}`,
  );

  // 4. Criar Associações (Memberships)
  await prisma.membership.createMany({
    data: [
      { userId: adminUser.id, workspaceId: defaultWorkspace.id, role: WorkspaceRole.OWNER },
      { userId: memberUser.id, workspaceId: defaultWorkspace.id, role: WorkspaceRole.MEMBER },
      { userId: guestUser.id, workspaceId: defaultWorkspace.id, role: WorkspaceRole.GUEST },
      { userId: adminUser.id, workspaceId: secondaryWorkspace.id, role: WorkspaceRole.ADMIN },
      { userId: externalUser.id, workspaceId: externalWorkspace.id, role: WorkspaceRole.OWNER },
    ],
  });
  console.log('✓ Memberships configurados com papéis OWNER, ADMIN, MEMBER e GUEST');

  // 4.1 Criar Convite Pendente de exemplo
  await prisma.workspaceInvite.create({
    data: {
      workspaceId: defaultWorkspace.id,
      email: 'novo.dev@fluxopro.local',
      role: WorkspaceRole.MEMBER,
      token: 'convite-demo-token-fase1',
      invitedById: adminUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.2 Criar Etiquetas do Workspace (Fase 2)
  const labelBackend = await prisma.label.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'Backend',
      color: '#8B5CF6',
    },
  });
  const labelFrontend = await prisma.label.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'Frontend',
      color: '#3B82F6',
    },
  });
  const labelSecurity = await prisma.label.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'Segurança',
      color: '#EF4444',
    },
  });
  const labelUx = await prisma.label.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'UX & Design',
      color: '#10B981',
    },
  });
  console.log('✓ Etiquetas do workspace criadas');

  // 5. Criar Projetos
  const defaultProject = await prisma.project.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'Lançamento v1',
      key: 'FLX',
      description: 'Projeto inaugural da plataforma Cacique Agil com visões integradas',
      status: ProjectStatus.ACTIVE,
      color: '#2563EB',
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      dueDate: new Date('2026-12-15T00:00:00.000Z'),
      ownerId: adminUser.id,
    },
  });

  const designProject = await prisma.project.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'Design System & Acessibilidade',
      key: 'DSYS',
      description: 'Tokens MUI v6, modo escuro e conformidade WCAG 2.1 AA',
      status: ProjectStatus.PLANNING,
      color: '#9333EA',
      ownerId: adminUser.id,
    },
  });
  console.log(`✓ Projetos criados: ${defaultProject.name} [${defaultProject.key}] e ${designProject.name} [${designProject.key}]`);

  // 6. Criar Status do Fluxo de Trabalho (Colunas)
  const statusTodo = await prisma.workflowStatus.create({
    data: {
      projectId: defaultProject.id,
      name: 'A Fazer',
      category: StatusCategory.TODO,
      position: 1000,
      color: '#64748B',
    },
  });

  const statusInProgress = await prisma.workflowStatus.create({
    data: {
      projectId: defaultProject.id,
      name: 'Em Andamento',
      category: StatusCategory.IN_PROGRESS,
      position: 2000,
      wipLimit: 4,
      color: '#3B82F6',
    },
  });

  const statusInReview = await prisma.workflowStatus.create({
    data: {
      projectId: defaultProject.id,
      name: 'Em Revisão',
      category: StatusCategory.IN_PROGRESS,
      position: 3000,
      wipLimit: 2,
      color: '#F59E0B',
    },
  });

  const statusDone = await prisma.workflowStatus.create({
    data: {
      projectId: defaultProject.id,
      name: 'Concluído',
      category: StatusCategory.DONE,
      position: 4000,
      color: '#10B981',
    },
  });

  await prisma.workflowStatus.createMany({
    data: [
      {
        projectId: designProject.id,
        name: 'A Fazer',
        category: StatusCategory.TODO,
        position: 1000,
        color: '#64748B',
      },
      {
        projectId: designProject.id,
        name: 'Em Andamento',
        category: StatusCategory.IN_PROGRESS,
        position: 2000,
        color: '#F59E0B',
      },
      {
        projectId: designProject.id,
        name: 'Concluído',
        category: StatusCategory.DONE,
        position: 3000,
        color: '#10B981',
      },
    ],
  });
  console.log('✓ Status de fluxo configurados');

  // 7. Criar Tarefas Iniciais com Subtarefas, Checklists, Comentários e Anexos
  const task1 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 1,
      title: 'Configurar Monorepo e Docker (Fase 0)',
      description: {
        type: 'doc',
        text: 'Estruturação base com pnpm workspaces, Express, Next.js 15 e Prisma.',
      },
      statusId: statusDone.id,
      priority: TaskPriority.HIGH,
      assigneeIds: [adminUser.id],
      startDate: new Date('2026-10-20T09:00:00.000Z'),
      dueDate: new Date('2026-10-23T18:00:00.000Z'),
      estimateMinutes: 180,
      progress: 100,
      position: 1000,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 2,
      title: 'Implementar Autenticação e RBAC Multi-Tenant (Fase 1)',
      description: {
        type: 'doc',
        text: 'Login, registro, JWT com refresh tokens rotativos e isolamento entre workspaces.',
      },
      statusId: statusDone.id,
      priority: TaskPriority.URGENT,
      assigneeIds: [adminUser.id, memberUser.id],
      startDate: new Date('2026-10-24T09:00:00.000Z'),
      dueDate: new Date('2026-10-27T18:00:00.000Z'),
      estimateMinutes: 240,
      progress: 100,
      position: 2000,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 3,
      title: 'Construir Visão Lista de Tarefas, Drawer Lateral e Filtros (Fase 2)',
      description: {
        type: 'doc',
        text: 'Visão Lista agrupada, edição inline, drawer de detalhes completo com subtarefas, checklists, etiquetas, anexos e comentários com @menção.',
      },
      statusId: statusInProgress.id,
      priority: TaskPriority.URGENT,
      assigneeIds: [adminUser.id, memberUser.id],
      startDate: new Date('2026-10-25T09:00:00.000Z'),
      dueDate: new Date('2026-11-05T18:00:00.000Z'),
      estimateMinutes: 360,
      progress: 65,
      isMilestone: true,
      position: 1000,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 4,
      title: 'Implementar subtarefas em até 3 níveis e ações em massa',
      description: {
        type: 'doc',
        text: 'Subtarefa direta vinculada à entrega da Visão Lista.',
      },
      statusId: statusTodo.id,
      priority: TaskPriority.HIGH,
      parentId: task3.id,
      assigneeIds: [memberUser.id],
      dueDate: new Date('2026-11-02T18:00:00.000Z'),
      estimateMinutes: 120,
      progress: 20,
      position: 1000,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 5,
      title: 'Quadro Kanban com Drag & Drop via @dnd-kit (Fase 3)',
      description: {
        type: 'doc',
        text: 'Ordenação fracionária, colunas dinâmicas, limites WIP e swimlanes.',
      },
      statusId: statusInProgress.id,
      priority: TaskPriority.HIGH,
      assigneeIds: [adminUser.id, memberUser.id],
      startDate: new Date('2026-10-26T00:00:00.000Z'),
      dueDate: new Date('2026-11-10T18:00:00.000Z'),
      estimateMinutes: 300,
      progress: 80,
      position: 2000,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 6,
      title: 'Sincronização em Tempo Real via Socket.IO e Presença',
      description: {
        type: 'doc',
        text: 'Salas de projeto, atualização automática de cache e avatares online.',
      },
      statusId: statusInReview.id,
      priority: TaskPriority.URGENT,
      assigneeIds: [adminUser.id],
      dueDate: new Date('2026-11-08T18:00:00.000Z'),
      estimateMinutes: 240,
      progress: 90,
      position: 1000,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 7,
      title: 'Validar propagação de movimentação de cards em menos de 1s',
      description: {
        type: 'doc',
        text: 'Critério de aceite da Fase 3 com teste multi-sessão.',
      },
      statusId: statusInReview.id,
      priority: TaskPriority.MEDIUM,
      assigneeIds: [memberUser.id],
      dueDate: new Date('2026-11-09T18:00:00.000Z'),
      estimateMinutes: 120,
      progress: 75,
      position: 2000,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 8,
      title: 'Alerta visual de limite WIP excedido na coluna Em Revisão',
      description: {
        type: 'doc',
        text: 'Esta tarefa propositalmente excede o limite WIP (3 tarefas com limite de 2).',
      },
      statusId: statusInReview.id,
      priority: TaskPriority.LOW,
      assigneeIds: [guestUser.id],
      startDate: new Date('2026-11-15T09:00:00.000Z'),
      dueDate: new Date('2026-11-19T18:00:00.000Z'),
      estimateMinutes: 90,
      progress: 50,
      position: 3000,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 9,
      title: 'Marco: Lançamento da Release v1.0',
      description: {
        type: 'doc',
        text: 'Marco de entrega final consolidando todas as 4 fases iniciais.',
      },
      statusId: statusTodo.id,
      priority: TaskPriority.URGENT,
      assigneeIds: [adminUser.id],
      startDate: new Date('2026-11-21T00:00:00.000Z'),
      dueDate: new Date('2026-11-21T00:00:00.000Z'),
      estimateMinutes: 0,
      progress: 0,
      isMilestone: true,
      position: 4000,
    },
  });

  // Vincular etiquetas
  await prisma.taskLabel.createMany({
    data: [
      { taskId: task1.id, labelId: labelBackend.id },
      { taskId: task2.id, labelId: labelSecurity.id },
      { taskId: task2.id, labelId: labelBackend.id },
      { taskId: task3.id, labelId: labelFrontend.id },
      { taskId: task3.id, labelId: labelUx.id },
      { taskId: task4.id, labelId: labelBackend.id },
      { taskId: task5.id, labelId: labelFrontend.id },
      { taskId: task6.id, labelId: labelBackend.id },
      { taskId: task7.id, labelId: labelFrontend.id },
      { taskId: task8.id, labelId: labelUx.id },
      { taskId: task9.id, labelId: labelBackend.id },
    ],
  });

  // 8. Dependências de Tarefas (Fase 4 - Caminho Crítico)
  await prisma.taskDependency.createMany({
    data: [
      {
        predecessorId: task1.id,
        successorId: task2.id,
        type: DependencyType.FS,
        lagDays: 0,
      },
      {
        predecessorId: task2.id,
        successorId: task3.id,
        type: DependencyType.FS,
        lagDays: 0,
      },
      {
        predecessorId: task3.id,
        successorId: task5.id,
        type: DependencyType.FS,
        lagDays: 0,
      },
      {
        predecessorId: task5.id,
        successorId: task6.id,
        type: DependencyType.FS,
        lagDays: 0,
      },
      {
        predecessorId: task6.id,
        successorId: task7.id,
        type: DependencyType.FS,
        lagDays: 1,
      },
      {
        predecessorId: task7.id,
        successorId: task9.id,
        type: DependencyType.FS,
        lagDays: 0,
      },
    ],
  });

  // 9. Linha de Base (Baseline - Fase 4)
  const baseline = await prisma.projectBaseline.create({
    data: {
      projectId: defaultProject.id,
      name: 'Linha de Base Aprovada (Sprint 1)',
      description: 'Snapshot inicial de datas acordadas para a entrega v1.0',
    },
  });

  await prisma.taskBaselineItem.createMany({
    data: [
      {
        baselineId: baseline.id,
        taskId: task1.id,
        startDate: new Date('2026-10-20T09:00:00.000Z'),
        dueDate: new Date('2026-10-23T18:00:00.000Z'),
      },
      {
        baselineId: baseline.id,
        taskId: task2.id,
        startDate: new Date('2026-10-24T09:00:00.000Z'),
        dueDate: new Date('2026-10-27T18:00:00.000Z'),
      },
      {
        baselineId: baseline.id,
        taskId: task3.id,
        startDate: new Date('2026-10-27T09:00:00.000Z'),
        dueDate: new Date('2026-11-03T18:00:00.000Z'),
      },
      {
        baselineId: baseline.id,
        taskId: task5.id,
        startDate: new Date('2026-11-04T09:00:00.000Z'),
        dueDate: new Date('2026-11-11T18:00:00.000Z'),
      },
      {
        baselineId: baseline.id,
        taskId: task6.id,
        startDate: new Date('2026-11-12T09:00:00.000Z'),
        dueDate: new Date('2026-11-16T18:00:00.000Z'),
      },
      {
        baselineId: baseline.id,
        taskId: task7.id,
        startDate: new Date('2026-11-17T09:00:00.000Z'),
        dueDate: new Date('2026-11-19T18:00:00.000Z'),
      },
      {
        baselineId: baseline.id,
        taskId: task9.id,
        startDate: new Date('2026-11-20T00:00:00.000Z'),
        dueDate: new Date('2026-11-20T00:00:00.000Z'),
      },
    ],
  });

  // Criar Checklist na task3
  const checklist = await prisma.checklist.create({
    data: {
      taskId: task3.id,
      title: 'Critérios de Aceite da Fase 2',
    },
  });

  await prisma.checklistItem.createMany({
    data: [
      {
        checklistId: checklist.id,
        text: 'CRUD de projetos com chave única (FLX) e status iniciais',
        done: true,
        position: 1000,
      },
      {
        checklistId: checklist.id,
        text: 'Drawer de detalhes com edição inline, etiquetas e subtarefas',
        done: true,
        position: 2000,
      },
      {
        checklistId: checklist.id,
        text: 'Comentários com menções (@) e upload validado de anexos',
        done: false,
        position: 3000,
      },
    ],
  });

  // Criar Comentário na task3
  await prisma.comment.create({
    data: {
      taskId: task3.id,
      authorId: adminUser.id,
      body: {
        text: 'Olá @carlos, já deixei os schemas Zod prontos em packages/shared para integrarmos o Drawer!',
        mentions: ['carlos'],
      },
    },
  });

  // Criar Anexo de exemplo na task3
  await prisma.attachment.create({
    data: {
      taskId: task3.id,
      fileName: 'especificacao-visao-lista-v1.pdf',
      mimeType: 'application/pdf',
      size: 245760,
      storageKey: `workspaces/${defaultWorkspace.id}/tasks/${task3.id}/demo-spec-v1.pdf`,
    },
  });

  // Criar Visão Salva compartilhada no projeto
  await prisma.savedView.create({
    data: {
      projectId: defaultProject.id,
      ownerId: adminUser.id,
      type: 'LIST',
      name: 'Tarefas Urgentes',
      shared: true,
      config: {
        priority: TaskPriority.URGENT,
        groupBy: 'status',
      },
    },
  });

  console.log(
    `✓ Tarefas criadas: ${defaultProject.key}-${task1.number} até ${defaultProject.key}-${task8.number} com etiquetas, checklist, comentário, anexo e visão salva`,
  );

  // 10. Documentos Colaborativos, Versões, Favoritos e Templates (Fase 5)
  const docPrd = await prisma.document.create({
    data: {
      workspaceId: defaultWorkspace.id,
      projectId: defaultProject.id,
      title: 'Especificação e Arquitetura do Produto (PRD)',
      icon: '🚀',
      createdById: adminUser.id,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Especificação do Cacique Agil' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Este documento centraliza a arquitetura do produto e os objetivos da versão v1.0.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'A primeira entrega estratégica está associada à tarefa principal: ',
              },
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: `#${defaultProject.key}-${task1.number} — ${task1.title}`,
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Módulos Concluídos' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Autenticação e Workspaces (Fase 1)' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Projetos e Visão Lista de Tarefas (Fase 2)' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Quadro Kanban e Tempo Real (Fase 3)' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Gantt, CPM, Dependências e Calendário (Fase 4)' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        marks: [{ type: 'bold' }],
                        text: 'Documentos Colaborativos, TipTap & Yjs (Fase 5)',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  });

  const docDesign = await prisma.document.create({
    data: {
      workspaceId: defaultWorkspace.id,
      projectId: defaultProject.id,
      parentId: docPrd.id,
      title: 'Diretrizes de Design e UX',
      icon: '🎨',
      createdById: memberUser.id,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Diretrizes de Design System' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Padrões de acessibilidade WCAG 2.1 AA, modo claro/escuro com paleta de tokens MUI centralizados.',
              },
            ],
          },
        ],
      },
    },
  });

  const docMeeting = await prisma.document.create({
    data: {
      workspaceId: defaultWorkspace.id,
      projectId: defaultProject.id,
      title: 'Ata da Reunião de Kickoff da Sprint',
      icon: '📝',
      createdById: adminUser.id,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Ata de Reunião — Kickoff da Sprint' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Participantes: Ana Silva (Owner), Carlos Souza (Member).',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Decisões Aprovadas' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Foco total na entrega da wiki colaborativa com sincronização CRDT Yjs e edição simultânea.',
              },
            ],
          },
        ],
      },
    },
  });

  // Favorito do admin no PRD
  await prisma.documentFavorite.create({
    data: {
      userId: adminUser.id,
      docId: docPrd.id,
    },
  });

  // Versão 1 arquivada do PRD
  await prisma.documentVersion.create({
    data: {
      docId: docPrd.id,
      versionNumber: 1,
      name: 'Versão Inicial Aprovada',
      createdById: adminUser.id,
      contentJson: docPrd.contentJson,
    },
  });

  // Comentário inline no PRD
  await prisma.comment.create({
    data: {
      docId: docPrd.id,
      authorId: memberUser.id,
      selectedText: 'arquitetura do produto',
      body: {
        text: 'Excelente contextualização técnica, alinhado com o roadmap!',
      },
    },
  });

  // Modelos pré-definidos (Templates)
  await prisma.document.createMany({
    data: [
      {
        workspaceId: defaultWorkspace.id,
        title: 'Modelo: Ata de Reunião',
        icon: '📋',
        isTemplate: true,
        templateCategory: 'MEETING',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Ata de Reunião: [Título do Tópico]' }],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'Data: ',
                },
                { type: 'text', text: '[Inserir Data] | ' },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'Participantes: ',
                },
                { type: 'text', text: '[Nomes]' },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Pauta e Discussão' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }],
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Decisões Tomadas' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '• [Decisão 1 aprovada pelo time]' }],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Plano de Ação' }],
            },
            {
              type: 'taskList',
              content: [
                {
                  type: 'taskItem',
                  attrs: { checked: false },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ação imediata com responsável' }] }],
                },
              ],
            },
          ],
        },
      },
      {
        workspaceId: defaultWorkspace.id,
        title: 'Modelo: PRD (Product Requirements Document)',
        icon: '📑',
        isTemplate: true,
        templateCategory: 'PRD',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'PRD: [Nome da Funcionalidade]' }],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '1. Problema e Oportunidade' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Qual problema do usuário estamos resolvendo?' }],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '2. Objetivos e Métricas de Sucesso' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Meta 1: Reduzir tempo de ciclo em 20%' }] }],
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '3. Requisitos Funcionais' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Descreva os fluxos de interação e casos de uso essenciais.' }],
            },
          ],
        },
      },
      {
        workspaceId: defaultWorkspace.id,
        title: 'Modelo: Retrospectiva de Sprint',
        icon: '🔄',
        isTemplate: true,
        templateCategory: 'RETROSPECTIVE',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Retrospectiva: Sprint [Número]' }],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'O que correu bem? 🎉' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Excelente colaboração no fechamento das tarefas prioritárias.' }] }],
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'O que podemos melhorar? 🤔' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alinhar critérios de aceite mais cedo na sprint.' }] }],
                },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Plano de Ação para a Próxima Sprint 🚀' }],
            },
            {
              type: 'taskList',
              content: [
                {
                  type: 'taskItem',
                  attrs: { checked: false },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item de ação acordado' }] }],
                },
              ],
            },
          ],
        },
      },
    ],
  });

  console.log(
    `✓ Documentos criados: '${docPrd.title}' (com subpágina '${docDesign.title}'), '${docMeeting.title}', favorito, versão v1, comentário inline e 3 templates de demonstração`,
  );

  // -------------------------------------------------------------
  // Fase 6: Quadros Brancos (Whiteboards) e EntityLinks de Tarefas
  // -------------------------------------------------------------
  const wb1Elements = [
    {
      id: 'frame-ideias',
      type: 'frame',
      x: 80,
      y: 60,
      width: 320,
      height: 540,
      text: '💡 Ideias de Produto',
      backgroundColor: '#f8fafc',
      color: '#0284c7',
      zIndex: 0,
    },
    {
      id: 'frame-acoes',
      type: 'frame',
      x: 440,
      y: 60,
      width: 340,
      height: 540,
      text: '🎯 Tarefas do Projeto (Vinculadas)',
      backgroundColor: '#f8fafc',
      color: '#16a34a',
      zIndex: 0,
    },
    {
      id: 'sticky-1',
      type: 'sticky',
      x: 110,
      y: 130,
      width: 220,
      height: 180,
      text: 'Explorar canvas infinito para mapeamento visual de fluxos de trabalho',
      backgroundColor: '#fef08a',
      color: '#854d0e',
      zIndex: 1,
    },
    {
      id: 'sticky-2',
      type: 'sticky',
      x: 110,
      y: 340,
      width: 220,
      height: 180,
      text: 'Permitir converter notas adesivas em tarefas reais com 1 clique',
      backgroundColor: '#fed7aa',
      color: '#9a3412',
      zIndex: 1,
    },
    {
      id: 'card-task-1',
      type: 'task_card',
      x: 470,
      y: 130,
      width: 280,
      height: 140,
      taskId: task1.id,
      taskKey: 'FLX-1',
      taskTitle: task1.title,
      taskPriority: task1.priority,
      taskStatusName: 'A Fazer',
      taskStatusCategory: 'TODO',
      color: '#0f172a',
      backgroundColor: '#ffffff',
      zIndex: 1,
    },
    {
      id: 'arrow-sticky-to-card',
      type: 'arrow',
      x: 330,
      y: 200,
      width: 140,
      height: 10,
      fromElementId: 'sticky-1',
      toElementId: 'card-task-1',
      fromPoint: { x: 330, y: 200 },
      toPoint: { x: 470, y: 200 },
      color: '#6366f1',
      strokeWidth: 3,
      zIndex: 1,
    },
  ];

  const wb1 = await prisma.whiteboard.create({
    data: {
      workspaceId: defaultWorkspace.id,
      projectId: defaultProject.id,
      title: 'Brainstorming — Lançamento v1',
      description: 'Mapeamento visual de ideias, desafios e tarefas prioritárias do projeto.',
      templateCategory: 'brainstorming',
      createdById: adminUser.id,
      elementsJson: wb1Elements,
    },
  });

  // Vínculo EntityLink Whiteboard <-> Task
  await prisma.entityLink.create({
    data: {
      workspaceId: defaultWorkspace.id,
      fromType: 'whiteboard',
      fromId: wb1.id,
      toType: 'task',
      toId: task1.id,
    },
  });

  // 2. Fluxograma de Arquitetura & Dados
  const wb2Elements = [
    {
      id: 'step-start',
      type: 'shape',
      shapeType: 'ellipse',
      x: 400,
      y: 60,
      width: 180,
      height: 80,
      text: 'Início do Ciclo',
      backgroundColor: '#bbf7d0',
      color: '#14532d',
      zIndex: 2,
    },
    {
      id: 'step-process',
      type: 'shape',
      shapeType: 'rectangle',
      x: 390,
      y: 200,
      width: 200,
      height: 90,
      text: 'Processar Mudança de Status',
      backgroundColor: '#e0f2fe',
      color: '#075985',
      zIndex: 2,
    },
    {
      id: 'step-decision',
      type: 'shape',
      shapeType: 'diamond',
      x: 390,
      y: 350,
      width: 200,
      height: 140,
      text: 'Limite WIP Excedido?',
      backgroundColor: '#fef08a',
      color: '#713f12',
      zIndex: 2,
    },
    {
      id: 'step-end',
      type: 'shape',
      shapeType: 'ellipse',
      x: 400,
      y: 560,
      width: 180,
      height: 80,
      text: 'Sincronizar em Tempo Real (Socket.IO)',
      backgroundColor: '#fed7aa',
      color: '#7c2d12',
      zIndex: 2,
    },
    {
      id: 'flow-arr-1',
      type: 'arrow',
      x: 490,
      y: 140,
      width: 10,
      height: 60,
      fromPoint: { x: 490, y: 140 },
      toPoint: { x: 490, y: 200 },
      color: '#64748b',
      strokeWidth: 3,
      zIndex: 1,
    },
    {
      id: 'flow-arr-2',
      type: 'arrow',
      x: 490,
      y: 290,
      width: 10,
      height: 60,
      fromPoint: { x: 490, y: 290 },
      toPoint: { x: 490, y: 350 },
      color: '#64748b',
      strokeWidth: 3,
      zIndex: 1,
    },
    {
      id: 'flow-arr-3',
      type: 'arrow',
      x: 490,
      y: 490,
      width: 10,
      height: 70,
      fromPoint: { x: 490, y: 490 },
      toPoint: { x: 490, y: 560 },
      color: '#16a34a',
      strokeWidth: 3,
      text: 'Não',
      zIndex: 1,
    },
  ];

  const wb2 = await prisma.whiteboard.create({
    data: {
      workspaceId: defaultWorkspace.id,
      projectId: defaultProject.id,
      title: 'Fluxograma de Arquitetura & Dados',
      description: 'Diagrama de fluxo de execução dos eventos de Socket.IO e regras WIP.',
      templateCategory: 'flowchart',
      createdById: adminUser.id,
      elementsJson: wb2Elements,
    },
  });

  // 3. Retrospectiva da Sprint 1
  const wb3Elements = [
    {
      id: 'frame-went-well',
      type: 'frame',
      x: 80,
      y: 60,
      width: 320,
      height: 540,
      text: '🌟 O que funcionou muito bem',
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      zIndex: 0,
    },
    {
      id: 'frame-to-improve',
      type: 'frame',
      x: 440,
      y: 60,
      width: 320,
      height: 540,
      text: '🔧 O que podemos ajustar',
      backgroundColor: '#fffbeb',
      color: '#b45309',
      zIndex: 0,
    },
    {
      id: 'sticky-retro-1',
      type: 'sticky',
      x: 110,
      y: 130,
      width: 220,
      height: 180,
      text: 'Excelente entrega das visões Gantt, Calendário e Wiki Colaborativa na data prevista!',
      backgroundColor: '#bbf7d0',
      color: '#14532d',
      zIndex: 1,
    },
    {
      id: 'sticky-retro-2',
      type: 'sticky',
      x: 470,
      y: 130,
      width: 220,
      height: 180,
      text: 'Ajustar contraste do tema escuro no editor de canvas.',
      backgroundColor: '#fed7aa',
      color: '#7c2d12',
      zIndex: 1,
    },
  ];

  const wb3 = await prisma.whiteboard.create({
    data: {
      workspaceId: defaultWorkspace.id,
      title: 'Retrospectiva da Sprint 1',
      description: 'Quadro ágil para retrospectiva com post-its coloridos e ações da equipe.',
      templateCategory: 'retrospective',
      createdById: adminUser.id,
      elementsJson: wb3Elements,
    },
  });

  console.log(
    `✓ Quadros Brancos criados: '${wb1.title}' (com card de tarefa FLX-1 vinculado via EntityLink), '${wb2.title}' e '${wb3.title}'`,
  );

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
