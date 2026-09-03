import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileBottomNav } from '../MobileBottomNav';

describe('MobileBottomNav', () => {
  it('renderiza los 4 items en orden y marca activo', () => {
    render(<MobileBottomNav page="dashboard" onNavigate={() => {}} />);
    const items = screen.getAllByRole('button');
    expect(items.map((b) => b.textContent)).toEqual([
      'Dashboard',
      'Clientes',
      'Atrasados',
      'Registrar préstamo',
    ]);
    expect(screen.getByText('Dashboard').closest('button')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('cliente-detalle marca Clientes como activo', () => {
    render(<MobileBottomNav page="cliente-detalle" onNavigate={() => {}} />);
    expect(screen.getByText('Clientes').closest('button')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('registrar-prestamo marca Registrar préstamo activo', () => {
    render(<MobileBottomNav page="registrar-prestamo" onNavigate={() => {}} />);
    expect(screen.getByText('Registrar préstamo').closest('button')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('atrasados marca Atrasados activo', () => {
    render(<MobileBottomNav page="atrasados" onNavigate={() => {}} />);
    expect(screen.getByText('Atrasados').closest('button')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('no crashea con page desconocido', () => {
    const { container } = render(
      <MobileBottomNav page="inexistente" onNavigate={() => {}} />,
    );
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('onNavigate llama con el id correcto al click', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<MobileBottomNav page="dashboard" onNavigate={fn} />);
    await user.click(screen.getByText('Atrasados'));
    expect(fn).toHaveBeenCalledWith('atrasados', {});
  });
});
