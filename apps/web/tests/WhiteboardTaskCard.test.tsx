import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhiteboardTaskCard } from '../src/components/whiteboard/WhiteboardTaskCard';
import { CanvasElement, TaskPriority } from '@fluxo/shared';

describe('Fase 6 UI: WhiteboardTaskCard (Card de Tarefa no Canvas)', () => {
  const mockElement: CanvasElement = {
    id: 'el-task-1',
    type: 'task_card',
    x: 200,
    y: 150,
    width: 260,
    height: 120,
    taskId: 'task-100',
    taskKey: 'FLX-42',
    taskTitle: 'Implementar Canvas de Whiteboard',
    taskStatusName: 'Em Progresso',
    taskPriority: TaskPriority.HIGH,
  };

  it('renderiza o card com chave FLX-42, título e status', () => {
    render(
      <WhiteboardTaskCard
        element={mockElement}
        isSelected={false}
        onOpenTask={vi.fn()}
      />
    );

    expect(screen.getByText('FLX-42')).toBeInTheDocument();
    expect(screen.getByText('Implementar Canvas de Whiteboard')).toBeInTheDocument();
    expect(screen.getByText('Em Progresso')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('abre os detalhes da tarefa ao clicar no botão de abrir ou duplo clique', () => {
    const handleOpenTask = vi.fn();
    render(
      <WhiteboardTaskCard
        element={mockElement}
        isSelected={false}
        onOpenTask={handleOpenTask}
      />
    );

    const openBtn = screen.getByLabelText(/abrir detalhes da tarefa/i);
    fireEvent.click(openBtn);
    expect(handleOpenTask).toHaveBeenCalledWith('task-100');
  });
});
