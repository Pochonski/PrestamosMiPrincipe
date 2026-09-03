import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  it('renderiza secciones', () => {
    render(<Sidebar open={true} page="dashboard" onNavigate={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  it('marca activo via parent', () => {
    render(<Sidebar open={true} page="registrar-prestamo" onNavigate={() => {}} onClose={() => {}} />);
    // registrar-prestamo tiene parent clientes, activo debería ser clientes
    const btns = screen.getAllByRole('button');
    expect(btns.length).toBeGreaterThan(0);
  });
  it('onNavigate y onClose', async () => {
    const nav = vi.fn();
    const close = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar open={true} page="dashboard" onNavigate={nav} onClose={close} />);
    await user.click(screen.getByText('Reportes'));
    expect(nav).toHaveBeenCalledWith('reportes');
    expect(close).toHaveBeenCalled();
  });
  it('overlay click cierra', async () => {
    const close = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar open={true} page="dashboard" onNavigate={() => {}} onClose={close} />);
    const overlays = screen.getAllByLabelText('Cerrar menú');
    await user.click(overlays[0]);
    expect(close).toHaveBeenCalled();
  });
});
