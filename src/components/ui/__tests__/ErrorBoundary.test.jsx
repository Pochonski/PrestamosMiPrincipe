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

describe('ErrorBoundary chunk auto-reload', () => {
  function ChunkThrower() {
    throw new Error('Failed to load module script: Expected a JavaScript-or-Wasm module script');
  }

  function mockReload() {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload }, writable: true, configurable: true });
    return reload;
  }

  it('error MIME de chunk dispara una recarga y usa clave fija', () => {
    sessionStorage.clear();
    const reload = mockReload();
    render(
      <ErrorBoundary>
        <ChunkThrower />
      </ErrorBoundary>
    );
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
    expect(sessionStorage.getItem('pmp:chunk-retry')).toContain('"count":1');
    const legacy = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (/^pmp:chunk-retry-\d+$/.test(k || '')) legacy.push(k);
    }
    expect(legacy).toEqual([]);
  });

  it('no entra en loop: tras el máximo no recarga y muestra pantalla manual', () => {
    sessionStorage.clear();
    sessionStorage.setItem('pmp:chunk-retry', JSON.stringify({ count: 2, ts: Date.now() }));
    const reload = mockReload();
    render(
      <ErrorBoundary>
        <ChunkThrower />
      </ErrorBoundary>
    );
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
    expect(screen.getByText(/recarga forzada/)).toBeInTheDocument();
  });
});
