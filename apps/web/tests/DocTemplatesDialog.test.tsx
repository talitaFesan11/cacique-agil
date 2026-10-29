import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocTemplatesDialog } from '../src/components/docs/DocTemplatesDialog';
import { PredefinedTemplateDto } from '@fluxo/shared';

describe('Fase 5 UI: DocTemplatesDialog (Galeria de Modelos)', () => {
  const mockTemplates: { predefined: PredefinedTemplateDto[]; custom: PredefinedTemplateDto[] } = {
    predefined: [
      {
        id: 'meeting-notes',
        title: 'Ata de Reunião',
        description: 'Estrutura para pauta, participantes e itens de ação.',
        category: 'MEETING',
        icon: '📝',
        contentJson: { type: 'doc', content: [] },
      },
      {
        id: 'prd',
        title: 'Especificação de Produto (PRD)',
        description: 'Documento completo com contexto, metas e requisitos.',
        category: 'PRD',
        icon: '🚀',
        contentJson: { type: 'doc', content: [] },
      },
    ],
    custom: [],
  };

  it('renderiza os modelos disponíveis e a opção de documento em branco', () => {
    render(
      <DocTemplatesDialog
        open={true}
        onClose={vi.fn()}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    expect(screen.getByText('Galeria de Modelos de Documento')).toBeInTheDocument();
    expect(screen.getByText('Documento em Branco')).toBeInTheDocument();
    expect(screen.getByText('Ata de Reunião')).toBeInTheDocument();
    expect(screen.getByText('Especificação de Produto (PRD)')).toBeInTheDocument();
  });

  it('dispara onSelectTemplate ao clicar em um modelo', () => {
    const handleSelect = vi.fn();
    render(
      <DocTemplatesDialog
        open={true}
        onClose={vi.fn()}
        templates={mockTemplates}
        onSelectTemplate={handleSelect}
      />
    );

    fireEvent.click(screen.getByText('Ata de Reunião'));
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'meeting-notes',
        title: 'Ata de Reunião',
      })
    );
  });

  it('dispara onClose ao clicar no botão Fechar', () => {
    const handleClose = vi.fn();
    render(
      <DocTemplatesDialog
        open={true}
        onClose={handleClose}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(handleClose).toHaveBeenCalled();
  });
});
