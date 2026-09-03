import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppShell } from '../AppShell';

vi.mock('../../../features/auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'a@b.com' }, profile: { full_name: 'Ana' }, currentOrg: { rol: 'admin' }, signOut: vi.fn() }),
}));
vi.mock('../../../services/theme', () => ({
  getTheme: vi.fn(() => 'light'),
  setTheme: vi.fn(),
}));
vi.mock('../../../services/notificaciones', () => ({
  countNoLeidas: vi.fn().mockResolvedValue(5),
}));
vi.mock('../../../lib/events', () => ({
  onDataChanged: vi.fn(() => () => {}),
}));
vi.mock('../UserMenu', () => ({
  UserMenu: () => <div data-testid="usermenu" />,
}));

const Dummy = () => <div>DummyPage</div>;

describe('AppShell', () => {
  beforeEach(() => vi.clearAllMocks());
  it('renderiza con pages', async () => {
    render(<AppShell pages={{ dashboard: Dummy }} />);
    expect(await screen.findByText('DummyPage')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
  });
  it('muestra placeholder si page no existe', async () => {
    const { container } = render(<AppShell pages={{}} />);
    // AppShell defaults page to dashboard, but Dummy not in pages, so placeholder?
    // It will try to render pages['dashboard'] which is undefined -> placeholder
    expect(container.textContent).toContain('Página no encontrada');
  });
});
