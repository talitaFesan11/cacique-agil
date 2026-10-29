import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhiteboardToolbar } from '../src/components/whiteboard/WhiteboardToolbar';

describe('Fase 6 UI: WhiteboardToolbar', () => {
  it('renderiza os botões de ferramentas e indicador de zoom', () => {
    render(
      <WhiteboardToolbar
        currentMode="select"
        onSelectMode={vi.fn()}
        onOpenTaskDrawer={vi.fn()}
        onOpenTemplates={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onResetZoom={vi.fn()}
        zoomLevel={1}
        selectedStickyCount={0}
        onConvertSelection={vi.fn()}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByTestId('tool-select')).toBeInTheDocument();
    expect(screen.getByTestId('tool-sticky')).toBeInTheDocument();
  });

  it('permite alternar ferramentas clicando no post-it', () => {
    const handleSelectMode = vi.fn();
    render(
      <WhiteboardToolbar
        currentMode="select"
        onSelectMode={handleSelectMode}
        onOpenTaskDrawer={vi.fn()}
        onOpenTemplates={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onResetZoom={vi.fn()}
        zoomLevel={1}
        selectedStickyCount={0}
        onConvertSelection={vi.fn()}
      />
    );

    const stickyBtn = screen.getByTestId('tool-sticky');
    fireEvent.click(stickyBtn);
    expect(handleSelectMode).toHaveBeenCalledWith('sticky');
  });

  it('aciona zoom in e zoom out ao clicar nos controles de zoom', () => {
    const handleZoomIn = vi.fn();
    const handleZoomOut = vi.fn();

    render(
      <WhiteboardToolbar
        currentMode="select"
        onSelectMode={vi.fn()}
        onOpenTaskDrawer={vi.fn()}
        onOpenTemplates={vi.fn()}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={vi.fn()}
        zoomLevel={1.25}
        selectedStickyCount={0}
        onConvertSelection={vi.fn()}
      />
    );

    expect(screen.getByText('125%')).toBeInTheDocument();

    const zoomInBtn = screen.getByTestId('zoom-in');
    fireEvent.click(zoomInBtn);
    expect(handleZoomIn).toHaveBeenCalled();

    const zoomOutBtn = screen.getByTestId('zoom-out');
    fireEvent.click(zoomOutBtn);
    expect(handleZoomOut).toHaveBeenCalled();
  });

  it('exibe botão de conversão em lote quando múltiplas notas estão selecionadas', () => {
    const handleConvertBatch = vi.fn();
    render(
      <WhiteboardToolbar
        currentMode="select"
        onSelectMode={vi.fn()}
        onOpenTaskDrawer={vi.fn()}
        onOpenTemplates={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onResetZoom={vi.fn()}
        zoomLevel={1}
        selectedStickyCount={3}
        onConvertSelection={handleConvertBatch}
      />
    );

    const batchBtn = screen.getByTestId('convert-selection-btn');
    expect(batchBtn).toBeInTheDocument();
    fireEvent.click(batchBtn);
    expect(handleConvertBatch).toHaveBeenCalled();
  });
});
