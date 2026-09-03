import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../UserMenu';

const mockSignOut = vi.fn().mockResolvedValue();
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../../features/auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'ana@test.com' }, profile: { full_name: 'Ana Pérez' }, signOut: mockSignOut }),
}));

describe('UserMenu', () => {
  it('renderiza nombre', () => {
    render(<MemoryRouter><UserMenu /></MemoryRouter>);
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
  });
  it('abre menu y cierra sesión', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><UserMenu /></MemoryRouter>);
    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByText('Cerrar sesión'));
    expect(mockSignOut).toHaveBeenCalled();
  });
  it('escape cierra', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><UserMenu /></MemoryRouter>);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
