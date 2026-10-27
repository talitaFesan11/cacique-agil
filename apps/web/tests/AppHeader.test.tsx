import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppHeader } from '../src/components/layout/AppHeader';

describe('AppHeader Component', () => {
  it('renderiza o título da aplicação e botão do menu', () => {
    const handleToggle = vi.fn();
    render(<AppHeader onToggleSidebar={handleToggle} />);

    expect(screen.getByText('appName')).toBeInTheDocument();

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    expect(menuButton).toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
