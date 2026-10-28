import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusCategory, TaskDto, TaskPriority, WorkflowStatusDto } from '@fluxo/shared';
import { TaskListView } from '../src/components/tasks/TaskListView';

describe('Fase 2 UI: TaskListView (Visão Lista de Tarefas)', () => {
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
      id: 'st-doing',
      projectId: 'p1',
      name: 'Em Andamento',
      category: StatusCategory.IN_PROGRESS,
      position: 2000,
      color: '#F59E0B',
    },
  ];

  const sampleTasks: TaskDto[] = [
    {
      id: 't1',
      projectId: 'p1',
      projectKey: 'FLX',
      number: 1,
      key: 'FLX-1',
      title: 'Construir Visão Lista de Tarefas',
      statusId: 'st-doing',
      priority: TaskPriority.URGENT,
      assigneeIds: [],
      progress: 50,
      isMilestone: true,
      position: 1000,
      labels: [
        { id: 'l1', workspaceId: 'ws1', name: 'Frontend', color: '#3B82F6' },
      ],
      checklistSummary: { totalItems: 3, completedItems: 2 },
      commentCount: 4,
      attachmentCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('renderiza tarefas agrupadas por status com chave, etiquetas, indicadores de checklist/comentários e abre o drawer ao clicar', () => {
    const onSelectTask = vi.fn();
    const onQuickCreateTask = vi.fn().mockResolvedValue(undefined);
    const onInlineUpdateTask = vi.fn().mockResolvedValue(undefined);
    const onBulkAction = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskListView
        tasks={sampleTasks}
        statuses={statuses}
        members={[]}
        groupBy="status"
        selectedTaskId={null}
        onSelectTask={onSelectTask}
        onQuickCreateTask={onQuickCreateTask}
        onInlineUpdateTask={onInlineUpdateTask}
        onBulkAction={onBulkAction}
        canWrite={true}
      />,
    );

    expect(screen.getByText('FLX-1')).toBeInTheDocument();
    expect(screen.getByText('Construir Visão Lista de Tarefas')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Construir Visão Lista de Tarefas'));
    expect(onSelectTask).toHaveBeenCalledWith('t1');
  });
});
