import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionCard } from '../QuickActionCard';
import { Bell } from 'lucide-react';

describe('QuickActionCard', () => {
  it('renderiza label e icono', () => {
    render(<QuickActionCard icon={Bell} label="Notificaciones" tone="gold" />);
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('muestra badge cuando > 0', () => {
    render(<QuickActionCard icon={Bell} label="X" badge={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('no muestra badge cuando es 0 o ausente', () => {
    const { rerender } = render(<QuickActionCard icon={Bell} label="X" badge={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    rerender(<QuickActionCard icon={Bell} label="X" />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('llama onClick', async () => {
    const fn = vi.fn();
    render(<QuickActionCard icon={Bell} label="X" onClick={fn} />);
    await userEvent.click(screen.getByText('X'));
    expect(fn).toHaveBeenCalledOnce();
  });
});