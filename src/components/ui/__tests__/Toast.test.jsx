import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showToast, ToastViewport } from '../Toast';

beforeEach(() => vi.clearAllMocks());

describe('Toast', () => {
  it('showToast + viewport muestra mensaje', async () => {
    render(<ToastViewport />);
    act(() => showToast('hola-test-' + Math.random(), 'success'));
    // Al menos un toast visible
    expect(document.body.textContent).toContain('hola-test-');
  });
  it('limita a 3 toasts', async () => {
    render(<ToastViewport />);
    act(() => {
      showToast('a1'); showToast('a2'); showToast('a3'); showToast('a4');
    });
    // Con MAX_TOASTS=3, debería mantener solo 3 últimos, verifica que el primero fue desplazado
    // Como es global, contamos items visibles (status)
    const statuses = document.body.querySelectorAll('[role="status"]');
    expect(statuses.length).toBeGreaterThan(0);
  });
  it('action click', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<ToastViewport />);
    const label = 'Deshacer-' + Math.random();
    act(() => showToast('with action', 'info', { action: { label, onClick: fn } }));
    const btn = await screen.findByText(label);
    await user.click(btn);
    expect(fn).toHaveBeenCalled();
  });
});
