import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskGanttView } from '../src/components/gantt/TaskGanttView';
import { ganttApi } from '../src/lib/api-client';
import { GanttProjectDataDto, TaskPriority } from '@fluxo/shared';

vi.mock('../src/lib/api-client', () => ({
  ganttApi: {
    getGantt: vi.fn(),
    getBaselines: vi.fn(),
    createBaseline: vi.fn(),
    createDependency: vi.fn(),
    deleteDependency: vi.fn(),
    autoReschedule: vi.fn(),
  },
  tasksApi: {
    update: vi.fn(),
  },
}));

describe('Fase 4 UI: TaskGanttView (Gráfico Gantt Nativo SVG/CSS)', () => {
  let queryClient: QueryClient;

  const mockGanttData: GanttProjectDataDto = {
    projectId: 'p1',
    projectName: 'Projeto Alfa',
    projectStartDate: '2026-11-01',
    projectDueDate: '2026-11-30',
    totalProjectDurationDays: 14,
    criticalPathTaskIds: ['task-1', 'task-2'],
    tasks: [
      {
        id: 'task-1',
        projectId: 'p1',
        number: 1,
        key: 'ALF-1',
        title: 'Arquitetura do Banco de Dados',
        statusId: 'st-done',
        statusName: 'Concluído',
        statusCategory: 'DONE',
        statusColor: '#10B981',
        priority: TaskPriority.HIGH,
        assigneeIds: ['user-1'],
        startDate: '2026-11-01',
        dueDate: '2026-11-05',
        progress: 100,
        isMilestone: false,
        position: 1000,
        totalFloat: 0,
        isCritical: true,
        predecessorIds: [],
        successorIds: ['task-2'],
      },
      {
        id: 'task-2',
        projectId: 'p1',
        number: 2,
        key: 'ALF-2',
        title: 'Implementação da API',
        statusId: 'st-prog',
        statusName: 'Em Progresso',
        statusCategory: 'IN_PROGRESS',
        statusColor: '#3B82F6',
        priority: TaskPriority.URGENT,
        assigneeIds: ['user-1'],
        startDate: '2026-11-06',
        dueDate: '2026-11-15',
        progress: 50,
        isMilestone: false,
        position: 2000,
        totalFloat: 0,
        isCritical: true,
        predecessorIds: ['task-1'],
        successorIds: ['task-3'],
      },
      {
        id: 'task-3',
        projectId: 'p1',
        number: 3,
        key: 'ALF-3',
        title: 'Lançamento V1 (Marco)',
        statusId: 'st-todo',
        statusName: 'A Fazer',
        statusCategory: 'TODO',
        statusColor: '#64748B',
        priority: TaskPriority.MEDIUM,
        assigneeIds: [],
        startDate: '2026-11-15',
        dueDate: '2026-11-15',
        progress: 0,
        isMilestone: true,
        position: 3000,
        totalFloat: 3,
        isCritical: false,
        predecessorIds: ['task-2'],
        successorIds: [],
      },
    ],
    dependencies: [
      {
        id: 'dep-1',
        predecessorId: 'task-1',
        successorId: 'task-2',
        type: 'FS' as any,
        lagDays: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'dep-2',
        predecessorId: 'task-2',
        successorId: 'task-3',
        type: 'FS' as any,
        lagDays: 0,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const mockBaselines = [
    {
      id: 'base-1',
      projectId: 'p1',
      name: 'Baseline Inicial de Planejamento',
      description: 'Snapshot inicial',
      snapshotDate: '2026-11-01T00:00:00.000Z',
      createdAt: '2026-11-01T00:00:00.000Z',
      itemsCount: 3,
      items: [
        {
          id: 'item-1',
          baselineId: 'base-1',
          taskId: 'task-1',
          startDate: '2026-11-01',
          dueDate: '2026-11-05',
          progress: 0,
          statusCategory: 'DONE',
        },
      ],
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(ganttApi.getGantt).mockResolvedValue(mockGanttData);
    vi.mocked(ganttApi.getBaselines).mockResolvedValue(mockBaselines);
  });

  const renderComponent = (props?: { onOpenTaskDetail?: (id: string) => void; canWrite?: boolean }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TaskGanttView
          projectId="p1"
          canWrite={props?.canWrite ?? true}
          onOpenTaskDetail={props?.onOpenTaskDetail ?? vi.fn()}
        />
      </QueryClientProvider>,
    );
  };

  it('deve renderizar a tabela de tarefas e os nomes das tarefas no Gantt', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Arquitetura do Banco de Dados')).toBeInTheDocument();
      expect(screen.getByText('Implementação da API')).toBeInTheDocument();
      expect(screen.getByText('Lançamento V1 (Marco)')).toBeInTheDocument();
    });
  });

  it('deve permitir alternar o destaque do Caminho Crítico (CPM)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-critical-path')).toBeInTheDocument();
    });

    const cpmToggle = screen.getByTestId('toggle-critical-path');
    fireEvent.click(cpmToggle);

    // Duração do caminho crítico calculada no cabeçalho
    expect(screen.getByText(/14/)).toBeInTheDocument();
  });

  it('deve permitir alternar o nível de zoom (Dia, Semana, Mês, Trimestre)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('gantt-zoom-group')).toBeInTheDocument();
    });

    const weekZoom = screen.getByTestId('zoom-week');
    fireEvent.click(weekZoom);
    expect(weekZoom).toBeInTheDocument();
  });

  it('deve disparar onOpenTaskDetail ao clicar em uma tarefa na tabela do Gantt', async () => {
    const onOpenTaskDetail = vi.fn();
    renderComponent({ onOpenTaskDetail });

    await waitFor(() => {
      expect(screen.getByText('Arquitetura do Banco de Dados')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Arquitetura do Banco de Dados'));
    expect(onOpenTaskDetail).toHaveBeenCalledWith('task-1');
  });

  it('deve permitir alternar o seletor de linha de base (Baseline comparison)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('select-baseline')).toBeInTheDocument();
    });
  });

  it('deve ocultar e exibir a tabela lateral esquerda ao clicar no botão de alternância', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-table-button')).toBeInTheDocument();
      expect(screen.getByTestId('gantt-table-container')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTestId('toggle-table-button');
    // Clicar para ocultar a tabela
    fireEvent.click(toggleBtn);

    // O container da tabela fica oculto e o botão flutuante para reabrir aparece
    await waitFor(() => {
      expect(screen.getByTestId('expand-table-floating-button')).toBeInTheDocument();
    });

    // Clicar no botão flutuante para restaurar a tabela
    const floatingBtn = screen.getByTestId('expand-table-floating-button');
    fireEvent.click(floatingBtn);

    await waitFor(() => {
      expect(screen.getByTestId('gantt-table-container')).toBeVisible();
    });
  });

  it('deve alternar a escala para Trimestre (QUARTER) sem sobreposição de textos', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('zoom-quarter')).toBeInTheDocument();
    });

    const quarterZoom = screen.getByTestId('zoom-quarter');
    fireEvent.click(quarterZoom);

    // No modo Trimestre, a régua de tempo exibe grupos de Trimestre e Meses
    await waitFor(() => {
      expect(screen.getByText(/Trimestre/i)).toBeInTheDocument();
    });
  });

  it('deve alternar modo de tela cheia (fullscreen) pelo botão da barra de ferramentas', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-fullscreen-button')).toBeInTheDocument();
    });

    const fullscreenBtn = screen.getByTestId('toggle-fullscreen-button');
    fireEvent.click(fullscreenBtn);

    const ganttContainer = screen.getByTestId('gantt-container');
    expect(ganttContainer).toHaveStyle({ position: 'fixed' });
  });
});
