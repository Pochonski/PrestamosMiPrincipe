import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RouteReporter from '../RouteReporter';

const ORIGIN = 'https://app-test.com';

function mockLocation(href = `${ORIGIN}/clientes`) {
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    value: { href, origin: ORIGIN, assign },
    writable: true,
    configurable: true,
  });
  return assign;
}

function renderReporter(route = '/clientes') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <RouteReporter />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLocation();
  vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RouteReporter', () => {
  it('reporta la ruta al montar', () => {
    renderReporter('/clientes');
    expect(vi.mocked(window.parent.postMessage)).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'porto-site-route' }),
      '*',
    );
  });

  it('ignora mensajes con otro source o sin href', () => {
    const assign = mockLocation();
    renderReporter();
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { origin: 'https://x.vercel.app', data: { source: 'otro', href: `${ORIGIN}/a` } }));
      window.dispatchEvent(new MessageEvent('message', { origin: 'https://x.vercel.app', data: { source: 'porto-site-navigate' } }));
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it('ignora origen no permitido', () => {
    const assign = mockLocation();
    renderReporter();
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.com', data: { source: 'porto-site-navigate', href: `${ORIGIN}/a` } }));
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it('ignora destino de otro origen', () => {
    const assign = mockLocation();
    renderReporter();
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { origin: 'https://x.vercel.app', data: { source: 'porto-site-navigate', href: 'https://evil.com/a' } }));
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it('acepta navegar al mismo origen desde localhost o vercel', () => {
    const assign = mockLocation(`${ORIGIN}/clientes`);
    renderReporter();
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { origin: 'http://localhost:3000', data: { source: 'porto-site-navigate', href: `${ORIGIN}/cobros` } }));
    });
    expect(assign).toHaveBeenCalledWith(`${ORIGIN}/cobros`);
  });

  it('no navega si ya está en el destino', () => {
    const assign = mockLocation(`${ORIGIN}/clientes`);
    renderReporter();
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { origin: 'https://x.vercel.app', data: { source: 'porto-site-navigate', href: `${ORIGIN}/clientes` } }));
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it('remueve el listener al desmontar', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderReporter();
    unmount();
    expect(remove).toHaveBeenCalledWith('message', expect.any(Function));
  });
});
