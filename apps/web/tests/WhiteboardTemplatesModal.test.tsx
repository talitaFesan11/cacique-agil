import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhiteboardTemplatesModal } from '../src/components/whiteboard/WhiteboardTemplatesModal';
import { PredefinedWhiteboardTemplateDto } from '@fluxo/shared';

describe('Fase 6 UI: WhiteboardTemplatesModal (Modelos de Quadro Branco)', () => {
  const mockTemplates: PredefinedWhiteboardTemplateDto[] = [
    {
      id: 'brainstorming',
      name: 'Brainstorming Colaborativo',
      description: 'Quadro estruturado com 4 colunas temáticas para geração ágil de ideias e soluções.',
      icon: '💡',
      elements: [],
    },
    {
      id: 'flowchart',
      name: 'Fluxograma de Processos',
      description: 'Fluxo padrão com nós de início, processo, decisão e encerramento.',
      icon: '🔀',
      elements: [],
    },
  ];

  it('renderiza os modelos disponíveis no modal', () => {
    render(
      <WhiteboardTemplatesModal
        open={true}
        onClose={vi.fn()}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    expect(screen.getByText('Galeria de Modelos de Quadros')).toBeInTheDocument();
    expect(screen.getByText('Brainstorming Colaborativo')).toBeInTheDocument();
    expect(screen.getByText('Fluxograma de Processos')).toBeInTheDocument();
  });

  it('dispara onSelectTemplate ao clicar em um modelo', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();
    render(
      <WhiteboardTemplatesModal
        open={true}
        onClose={handleClose}
        templates={mockTemplates}
        onSelectTemplate={handleSelect}
      />
    );

    fireEvent.click(screen.getByText('Brainstorming Colaborativo'));
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'brainstorming',
        name: 'Brainstorming Colaborativo',
      })
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('fecha o modal ao clicar no botão Cancelar', () => {
    const handleClose = vi.fn();
    render(
      <WhiteboardTemplatesModal
        open={true}
        onClose={handleClose}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(handleClose).toHaveBeenCalled();
  });
});
