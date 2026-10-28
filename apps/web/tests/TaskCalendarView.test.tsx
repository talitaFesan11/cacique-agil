import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskCalendarView } from '../src/components/calendar/TaskCalendarView';
import { tasksApi } from '../src/lib/api-client';
import { TaskDto, TaskPriority } from '@fluxo/shared';

vi.mock('../src/lib/api-client', () => ({
  tasksApi: {
    listByProject: vi.fn(),
  },
}));

describe('Fase 4 UI: TaskCalendarView (Visão de Calendário Mês/Semana)', () => {
  let queryClient: QueryClient;

  const mockTasks: TaskDto[] = [
    {
      id: 'task-1',
      projectId: 'p1',
      number: 1,
      key: 'ALF-1',
      title: 'Entrega da Documentação',
      statusId: 'st-todo',
      priority: TaskPriority.HIGH,
      assigneeIds: [],
      labels: [],
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      progress: 0,
      isMilestone: false,
      position: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      projectId: 'p1',
      number: 2,
      key: 'ALF-2',
      title: 'Marco de Homologação',
      statusId: 'st-done',
      priority: TaskPriority.URGENT,
      assigneeIds: [],
      labels: [],
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      progress: 100,
      isMilestone: true,
      position: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(tasksApi.listByProject).mockResolvedValue(mockTasks);
  });

  const renderComponent = (props?: { onOpenTaskDetail?: (id: string) => void; canWrite?: boolean }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TaskCalendarView
          projectId="p1"
          canWrite={props?.canWrite ?? true}
          onOpenTaskDetail={props?.onOpenTaskDetail ?? vi.fn()}
        />
      </QueryClientProvider>,
    );
  };

  it('deve carregar e renderizar as tarefas do dia atual na visão mensal', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Entrega da Documentação')).toBeInTheDocument();
      expect(screen.getByText('Marco de Homologação')).toBeInTheDocument();
    });
  });

  it('deve permitir alternar entre visualização de mês e semana', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('calendar-view-mode')).toBeInTheDocument();
    });

    const weekBtn = screen.getByTestId('calendar-mode-week');
    fireEvent.click(weekBtn);

    // Na visão semanal as tarefas do dia continuam visíveis
    await waitFor(() => {
      expect(screen.getByText('Entrega da Documentação')).toBeInTheDocument();
    });
  });

  it('deve navegar para mês anterior e próximo', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('calendar-prev-button')).toBeInTheDocument();
    });

    const prevBtn = screen.getByTestId('calendar-prev-button');
    const nextBtn = screen.getByTestId('calendar-next-button');

    fireEvent.click(prevBtn);
    fireEvent.click(nextBtn);
  });

  it('deve disparar onOpenTaskDetail ao clicar no chip da tarefa', async () => {
    const onOpenTaskDetail = vi.fn();
    renderComponent({ onOpenTaskDetail });

    await waitFor(() => {
      expect(screen.getByText('Entrega da Documentação')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Entrega da Documentação'));
    expect(onOpenTaskDetail).toHaveBeenCalledWith('task-1');
  });
});
