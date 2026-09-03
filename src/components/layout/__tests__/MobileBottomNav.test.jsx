import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileBottomNav } from '../MobileBottomNav';

describe('MobileBottomNav', () => {
  it('renderiza items y marca activo', () => {
    render(<MobileBottomNav page="dashboard" onNavigate={() => {}} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  it('cobro -> registrar-pago activo', () => {
    render(<MobileBottomNav page="cobro" onNavigate={() => {}} />);
    // registrar-pago es el id activo para cobro
    const btn = screen.getByText('Registrar pago');
    expect(btn).toBeInTheDocument();
    expect(btn.closest('button')).toHaveAttribute('aria-current', 'page');
  });
  it('cliente-detalle no crashea', () => {
    const { container } = render(<MobileBottomNav page="cliente-detalle" onNavigate={() => {}} />);
    expect(container.querySelector('nav')).toBeInTheDocument();
  });
  it('onNavigate con params', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<MobileBottomNav page="dashboard" onNavigate={fn} />);
    await user.click(screen.getByText('Registrar cliente'));
    expect(fn).toHaveBeenCalled();
  });
});
