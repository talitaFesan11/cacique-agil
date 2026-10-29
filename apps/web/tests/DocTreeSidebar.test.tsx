import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocTreeSidebar } from '../src/components/docs/DocTreeSidebar';
import { DocumentTreeNodeDto } from '@fluxo/shared';

describe('Fase 5 UI: DocTreeSidebar (Hierarquia de Páginas Wiki)', () => {
  const mockTree: DocumentTreeNodeDto[] = [
    {
      id: 'doc-1',
      workspaceId: 'ws-1',
      projectId: null,
      title: 'Especificação do Produto (PRD)',
      icon: '🚀',
      parentId: null,
      isTemplate: false,
      isFavorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: 'doc-1-1',
          workspaceId: 'ws-1',
          projectId: null,
          title: 'Diretrizes de Design',
          icon: '🎨',
          parentId: 'doc-1',
          isTemplate: false,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: [],
        },
      ],
    },
    {
      id: 'doc-2',
      workspaceId: 'ws-1',
      projectId: null,
      title: 'Ata de Reunião Semanal',
      icon: '📝',
      parentId: null,
      isTemplate: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
    },
  ];

  it('renderiza árvore de documentos com títulos e ícones', () => {
    render(
      <DocTreeSidebar
        tree={mockTree}
        selectedDocId="doc-1"
        onSelectDoc={vi.fn()}
        onCreateDoc={vi.fn()}
        onToggleFavorite={vi.fn()}
        onRenameDoc={vi.fn()}
        onDeleteDoc={vi.fn()}
        onOpenTemplates={vi.fn()}
      />
    );

    expect(screen.getAllByText('Especificação do Produto (PRD)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Diretrizes de Design')).toBeInTheDocument();
    expect(screen.getByText('Ata de Reunião Semanal')).toBeInTheDocument();
  });

  it('exibe seção de favoritos com o documento marcado como favorito', () => {
    render(
      <DocTreeSidebar
        tree={mockTree}
        selectedDocId={null}
        onSelectDoc={vi.fn()}
        onCreateDoc={vi.fn()}
        onToggleFavorite={vi.fn()}
        onRenameDoc={vi.fn()}
        onDeleteDoc={vi.fn()}
        onOpenTemplates={vi.fn()}
      />
    );

    expect(screen.getByText('Favoritos')).toBeInTheDocument();
  });

  it('filtra páginas dinamicamente ao digitar no campo de busca', () => {
    render(
      <DocTreeSidebar
        tree={mockTree}
        selectedDocId={null}
        onSelectDoc={vi.fn()}
        onCreateDoc={vi.fn()}
        onToggleFavorite={vi.fn()}
        onRenameDoc={vi.fn()}
        onDeleteDoc={vi.fn()}
        onOpenTemplates={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar páginas...');
    fireEvent.change(searchInput, { target: { value: 'Design' } });

    expect(screen.getByText('Diretrizes de Design')).toBeInTheDocument();
    // PRD permanece visível pois contém o filho que deu match
    expect(screen.getByText('Especificação do Produto (PRD)')).toBeInTheDocument();
    // Ata não deve aparecer na árvore filtrada
    expect(screen.queryByText('Ata de Reunião Semanal')).not.toBeInTheDocument();
  });

  it('dispara onSelectDoc ao clicar no item de documento', () => {
    const handleSelect = vi.fn();
    render(
      <DocTreeSidebar
        tree={mockTree}
        selectedDocId={null}
        onSelectDoc={handleSelect}
        onCreateDoc={vi.fn()}
        onToggleFavorite={vi.fn()}
        onRenameDoc={vi.fn()}
        onDeleteDoc={vi.fn()}
        onOpenTemplates={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Ata de Reunião Semanal'));
    expect(handleSelect).toHaveBeenCalledWith('doc-2');
  });

  it('dispara onCreateDoc ao clicar no botão "Nova Página"', () => {
    const handleCreate = vi.fn();
    render(
      <DocTreeSidebar
        tree={mockTree}
        selectedDocId={null}
        onSelectDoc={vi.fn()}
        onCreateDoc={handleCreate}
        onToggleFavorite={vi.fn()}
        onRenameDoc={vi.fn()}
        onDeleteDoc={vi.fn()}
        onOpenTemplates={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /nova página/i }));
    expect(handleCreate).toHaveBeenCalledWith(null);
  });

  it('dispara onOpenTemplates ao clicar no botão "Modelos"', () => {
    const handleOpenTemplates = vi.fn();
    render(
      <DocTreeSidebar
        tree={mockTree}
        selectedDocId={null}
        onSelectDoc={vi.fn()}
        onCreateDoc={vi.fn()}
        onToggleFavorite={vi.fn()}
        onRenameDoc={vi.fn()}
        onDeleteDoc={vi.fn()}
        onOpenTemplates={handleOpenTemplates}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /modelos/i }));
    expect(handleOpenTemplates).toHaveBeenCalled();
  });
});
