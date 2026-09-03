import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';

vi.mock('../../../services/theme', () => ({ toggleTheme: vi.fn() }));
import { toggleTheme } from '../../../services/theme';

describe('ThemeToggle', () => {
  it('dark muestra sol', () => {
    render(<ThemeToggle theme="dark" />);
    expect(screen.getByLabelText(/claro/)).toBeInTheDocument();
  });
  it('light muestra luna', () => {
    render(<ThemeToggle theme="light" />);
    expect(screen.getByLabelText(/oscuro/)).toBeInTheDocument();
  });
  it('onToggle llamado', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<ThemeToggle theme="light" onToggle={fn} />);
    await user.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledWith('dark');
  });
  it('sin onToggle llama servicio', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle theme="light" />);
    await user.click(screen.getByRole('button'));
    expect(toggleTheme).toHaveBeenCalled();
  });
});
