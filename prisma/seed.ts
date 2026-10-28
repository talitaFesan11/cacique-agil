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
