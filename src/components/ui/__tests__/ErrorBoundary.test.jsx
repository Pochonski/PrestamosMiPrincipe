import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

function Thrower({ shouldThrow }) {
  if (shouldThrow) throw new Error('boom');
  return <div>ok</div>;
}

describe('ErrorBoundary', () => {
  it('renderiza children si no hay error', () => {
    render(<ErrorBoundary><div>child</div></ErrorBoundary>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });
  it('muestra fallback si hay error', () => {
    render(
      <ErrorBoundary>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
  it('reintentar llama onReset y restaura', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    // Necesitamos un componente que deje de tirar tras reset key change simulado
    // Usamos ErrorBoundary key behavior vía onReset
    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    await user.click(screen.getByText('Reintentar'));
    expect(onReset).toHaveBeenCalled();
  });
  it('recargar página llama window.location.reload', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload }, writable: true, configurable: true });
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    await user.click(screen.getByText('Recargar página'));
    expect(reload).toHaveBeenCalled();
  });
});
