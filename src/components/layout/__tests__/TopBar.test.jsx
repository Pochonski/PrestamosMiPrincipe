import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBar } from '../TopBar';

vi.mock('../UserMenu', () => ({ UserMenu: () => <div data-testid="usermenu" /> }));

describe('TopBar', () => {
  it('renderiza label de page', () => {
    render(<TopBar page="dashboard" onNavigate={() => {}} onOpenSidebar={() => {}} theme="light" onToggleTheme={() => {}} notificationCount={0} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  it('badge notificaciones', () => {
    render(<TopBar page="dashboard" onNavigate={() => {}} onOpenSidebar={() => {}} theme="light" notificationCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  it('click notificaciones', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<TopBar page="dashboard" onNavigate={fn} onOpenSidebar={() => {}} theme="light" />);
    await user.click(screen.getByLabelText('Notificaciones'));
    expect(fn).toHaveBeenCalledWith('notificaciones');
  });
  it('click abrir menu', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<TopBar page="dashboard" onNavigate={() => {}} onOpenSidebar={fn} theme="light" />);
    await user.click(screen.getByLabelText('Abrir menú'));
    expect(fn).toHaveBeenCalled();
  });
});
