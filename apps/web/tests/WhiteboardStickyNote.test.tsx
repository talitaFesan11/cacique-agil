import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhiteboardStickyNote } from '../src/components/whiteboard/WhiteboardStickyNote';
import { CanvasElement } from '@fluxo/shared';

describe('Fase 6 UI: WhiteboardStickyNote', () => {
  const mockSticky: CanvasElement = {
    id: 'sticky-1',
    type: 'sticky',
    x: 100,
    y: 100,
    width: 200,
    height: 180,
    text: 'Ideia inicial do produto',
    color: 'yellow',
  };

  it('renderiza o post-it com o texto fornecido', () => {
    render(
      <WhiteboardStickyNote
        element={mockSticky}
        isSelected={false}
        onUpdate={vi.fn()}
        onConvertToTask={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Ideia inicial do produto')).toBeInTheDocument();
  });

  it('permite alterar o texto do post-it acionando onUpdate', () => {
    const handleUpdate = vi.fn();
    render(
      <WhiteboardStickyNote
        element={mockSticky}
        isSelected={false}
        onUpdate={handleUpdate}
        onConvertToTask={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const textarea = screen.getByDisplayValue('Ideia inicial do produto');
    fireEvent.change(textarea, { target: { value: 'Ideia atualizada' } });
    expect(handleUpdate).toHaveBeenCalledWith({ text: 'Ideia atualizada' });
  });

  it('aciona conversão para tarefa ao clicar no botão de conversão', () => {
    const handleConvertToTask = vi.fn();
    render(
      <WhiteboardStickyNote
        element={mockSticky}
        isSelected={true}
        onUpdate={vi.fn()}
        onConvertToTask={handleConvertToTask}
        onDelete={vi.fn()}
      />
    );

    const convertBtn = screen.getByTestId('convert-sticky-btn-sticky-1');
    fireEvent.click(convertBtn);
    expect(handleConvertToTask).toHaveBeenCalledWith(mockSticky);
  });
});
