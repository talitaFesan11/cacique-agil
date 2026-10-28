import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusCategory, TaskDto, TaskPriority, WorkflowStatusDto } from '@fluxo/shared';
import { TaskKanbanView } from '../src/components/kanban/TaskKanbanView';

describe('Fase 3 UI: TaskKanbanView (Quadro Kanban com Limite WIP e Swimlanes)', () => {
  const statuses: WorkflowStatusDto[] = [
    {
      id: 'st-todo',
      projectId: 'p1',
      name: 'A Fazer',
      category: StatusCategory.TODO,
      position: 1000,
      color: '#64748B',
    },
    {
      id: 'st-review',
      projectId: 'p1',
      name: 'Em Revisão',
      category: StatusCategory.IN_PROGRESS,
      position: 2000,
      wipLimit: 1, // Limite de 1 para testar o alerta de limite excedido
      color: '#F59E0B',
    },
    {
      id: 'st-done',
      projectId: 'p1',
      name: 'Concluído',
      category: StatusCategory.DONE,
      position: 3000,
      color: '#10B981',
    },
  ];

  const sampleTasks: TaskDto[] = [
    {
      id: 't1',
      projectId: 'p1',
      number: 1,
      key: 'FLX-1',
      title: 'Configurar Monorepo',
      statusId: 'st-todo',
      priority: TaskPriority.HIGH,
      assigneeIds: [],
      progress: 0,
      isMilestone: false,
      position: 1000,
      labels: [{ id: 'l1', workspaceId: 'ws1', name: 'Infra', color: '#64748B' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't2',
      projectId: 'p1',
      number: 2,
      key: 'FLX-2',
      title: 'Primeira Tarefa em Revisão',
      statusId: 'st-review',
      priority: TaskPriority.URGENT,
      assigneeIds: [],
      progress: 80,
      isMilestone: false,
      position: 1000,
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't3',
      projectId: 'p1',
      number: 3,
      key: 'FLX-3',
      title: 'Segunda Tarefa em Revisão (Excede WIP)',
      statusId: 'st-review',
      priority: TaskPriority.MEDIUM,
      assigneeIds: [],
      progress: 90,
      isMilestone: false,
      position: 2000,
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('renderiza colunas, cartões de tarefas e alerta de limite WIP excedido quando a coluna tem mais tarefas do que o limite', () => {
    const onSelectTask = vi.fn();
    const onMoveTask = vi.fn().mockResolvedValue(undefined);
    const onQuickCreateTask = vi.fn().mockResolvedValue(undefined);
    const onCreateStatus = vi.fn().mockResolvedValue(undefined);
    const onUpdateStatus = vi.fn().mockResolvedValue(undefined);
    const onDeleteStatus = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskKanbanView
        tasks={sampleTasks}
        statuses={statuses}
        members={[]}
        selectedTaskId={null}
        onSelectTask={onSelectTask}
        onMoveTask={onMoveTask}
        onQuickCreateTask={onQuickCreateTask}
        onCreateStatus={onCreateStatus}
        onUpdateStatus={onUpdateStatus}
        onDeleteStatus={onDeleteStatus}
        canWrite={true}
      />,
    );

    // 1. Verifica nomes das colunas
    expect(screen.getByText('A Fazer')).toBeInTheDocument();
    expect(screen.getByText('Em Revisão')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();

    // 2. Verifica cards renderizados
    expect(screen.getByText('Configurar Monorepo')).toBeInTheDocument();
    expect(screen.getByText('Primeira Tarefa em Revisão')).toBeInTheDocument();
    expect(screen.getByText('Segunda Tarefa em Revisão (Excede WIP)')).toBeInTheDocument();

    // 3. Verifica badge e alerta visual de Limite WIP (2/1 na coluna Em Revisão)
    expect(screen.getByTestId('kanban-wip-badge-st-review')).toBeInTheDocument();
    expect(screen.getByText('2/1')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-wip-alert-st-review')).toBeInTheDocument();
    expect(screen.getByText(/Limite WIP excedido/i)).toBeInTheDocument();

    // 4. Clique no card chama onSelectTask para abrir o drawer
    fireEvent.click(screen.getByText('Configurar Monorepo'));
    expect(onSelectTask).toHaveBeenCalledWith('t1');

    // 5. Botão de Nova Coluna abre o modal de criação
    const addColBtn = screen.getByTestId('add-column-button');
    fireEvent.click(addColBtn);
    expect(screen.getByTestId('column-settings-dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Nova Coluna').length).toBeGreaterThanOrEqual(2);
  });
});
