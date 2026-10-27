import {
  PrismaClient,
  WorkspaceRole,
  ProjectStatus,
  StatusCategory,
  TaskPriority,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // 1. Limpeza em ordem reversa para garantir idempotência do seed em dev
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
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
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 2. Criar Usuário Admin inicial
  // Hash padrão pré-computado compatível com bcrypt ou argon2 para testes de dev
  const passwordHash = '$2b$12$K8yXFsmxGqXoZ0t5dYxU5.F.G9M2Wd3kL.5s9aH8b2tQ1o9e9P'; // hash mock para dev
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fluxopro.local',
      name: 'Admin FluxoPro',
      passwordHash,
      locale: 'pt-BR',
    },
  });
  console.log(`✓ Usuário criado: ${adminUser.email} (${adminUser.id})`);

  // 3. Criar Workspace Padrão
  const defaultWorkspace = await prisma.workspace.create({
    data: {
      name: 'FluxoPro Org',
      slug: 'fluxopro-org',
    },
  });
  console.log(`✓ Workspace criado: ${defaultWorkspace.name} (${defaultWorkspace.id})`);

  // 4. Criar Associação (Membership)
  const membership = await prisma.membership.create({
    data: {
      userId: adminUser.id,
      workspaceId: defaultWorkspace.id,
      role: WorkspaceRole.OWNER,
    },
  });
  console.log(`✓ Membership criado com papel: ${membership.role}`);

  // 5. Criar Projeto Padrão
  const defaultProject = await prisma.project.create({
    data: {
      workspaceId: defaultWorkspace.id,
      name: 'Lançamento v1',
      key: 'FLX',
      description: 'Projeto inaugural da plataforma FluxoPro',
      status: ProjectStatus.ACTIVE,
      color: '#2563EB',
      ownerId: adminUser.id,
    },
  });
  console.log(`✓ Projeto criado: ${defaultProject.name} [${defaultProject.key}]`);

  // 6. Criar Status do Fluxo de Trabalho (Colunas do Kanban)
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
      wipLimit: 5,
      color: '#F59E0B',
    },
  });

  const statusDone = await prisma.workflowStatus.create({
    data: {
      projectId: defaultProject.id,
      name: 'Concluído',
      category: StatusCategory.DONE,
      position: 3000,
      color: '#10B981',
    },
  });
  console.log('✓ Status de fluxo configurados (A Fazer, Em Andamento, Concluído)');

  // 7. Criar Tarefas Iniciais
  const task1 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 1,
      title: 'Configurar Monorepo e Docker (Fase 0)',
      description: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Estruturação base com pnpm workspaces, Express, Next.js e Prisma.',
              },
            ],
          },
        ],
      },
      statusId: statusDone.id,
      priority: TaskPriority.HIGH,
      progress: 100,
      position: 1000,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: defaultProject.id,
      number: 2,
      title: 'Implementar Autenticação e RBAC (Fase 1)',
      description: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Login, registro, JWT com refresh tokens e isolamento entre workspaces.',
              },
            ],
          },
        ],
      },
      statusId: statusTodo.id,
      priority: TaskPriority.URGENT,
      progress: 0,
      position: 2000,
    },
  });
  console.log(
    `✓ Tarefas criadas: ${defaultProject.key}-${task1.number} e ${defaultProject.key}-${task2.number}`,
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
