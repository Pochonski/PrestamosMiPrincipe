import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResumenPage } from '../index';
import * as clientesService from '../../../services/clientes';
import * as prestamosService from '../../../services/prestamos';
import * as cobrosService from '../../../services/cobros';

vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));
vi.mock('../../../services/prestamos', () => ({ list: vi.fn() }));
vi.mock('../../../services/cobros', () => ({ list: vi.fn() }));
vi.mock('../../../lib/hooks/useDataChange', () => ({ useDataChange: vi.fn() }));
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ currentOrg: { slug: 'test', nombre: 'Test' } }) }));

function setup(onNavigate) {
  vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
  vi.mocked(prestamosService.list).mockResolvedValue([
    { id: 'p1', cliente_id: 'c1', estado: 'vigente', saldo_capital: 1000, monto: 1000, cuotas: [] },
  ]);
  vi.mocked(cobrosService.list).mockResolvedValue([]);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ResumenPage onNavigate={onNavigate} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('ResumenPage navigation (mobile-first)', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['Ver clientes', 'clientes'],
    ['Ver préstamos activos', 'prestamos'],
    ['Ir a cobrar hoy', 'cobrar-hoy'],
    ['Ver atrasados', 'atrasados'],
    ['Ver cartera activa', 'prestamos'],
    ['Exportar cobrado del mes', 'exportar'],
    ['Ver préstamos cancelados', 'prestamos'],
    ['Ver atrasados por tasa de morosidad', 'atrasados'],
    ['Ver por cobrar hoy', 'cobrar-hoy'],
    ['Exportar cobros en rango', 'exportar'],
  ])('card %s navega a %s', async (label, id) => {
    const nav = vi.fn();
    const user = userEvent.setup();
    setup(nav);
    const btn = await screen.findByRole('button', { name: label });
    // touch target móvil ≥44px
    expect(btn.className).toMatch('min-h-[44px]');
    await user.click(btn);
    expect(nav).toHaveBeenCalledWith(id);
  });

  it('Top morosos tiene Ver todos hacia atrasados', async () => {
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    vi.mocked(prestamosService.list).mockResolvedValue([
      {
        id: 'p1', cliente_id: 'c1', estado: 'vigente', saldo_capital: 1000, monto: 1000,
        cuotas: [{ estado: 'pendiente', fecha: '2024-01-01', monto: 100 }],
      },
    ]);
    vi.mocked(cobrosService.list).mockResolvedValue([]);
    const nav = vi.fn();
    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <ResumenPage onNavigate={nav} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    const buttons = await screen.findAllByRole('button', { name: 'Ver todos' });
    await user.click(buttons[buttons.length - 1]);
    expect(nav).toHaveBeenCalledWith('atrasados');
  });

  it('Últimos cobros Ver más va a exportar (no a cobro)', async () => {
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    vi.mocked(prestamosService.list).mockResolvedValue([]);
    vi.mocked(cobrosService.list).mockResolvedValue([
      { id: 'cob1', fecha: new Date().toISOString(), monto: 100, cliente_id: 'c1', prestamo_id: 'p1', tipo: 'capital' },
    ]);
    const nav = vi.fn();
    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <ResumenPage onNavigate={nav} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ver más' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(nav).toHaveBeenCalledWith('exportar');
    expect(nav).not.toHaveBeenCalledWith('cobro');
  });
});
