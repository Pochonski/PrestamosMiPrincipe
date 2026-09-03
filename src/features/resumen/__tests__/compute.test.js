import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { computeResumen, useResumenData } from '../selectors';
import * as clientesService from '../../../services/clientes';
import * as prestamosService from '../../../services/prestamos';
import * as cobrosService from '../../../services/cobros';

vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));
vi.mock('../../../services/prestamos', () => ({ list: vi.fn() }));
vi.mock('../../../services/cobros', () => ({ list: vi.fn() }));
vi.mock('../../../lib/hooks/useDataChange', () => ({ useDataChange: vi.fn() }));

const hoy = new Date('2024-06-15T12:00:00.000Z');

describe('computeResumen', () => {
  it('retorna ceros con datos vacíos', () => {
    const r = computeResumen({ clientes: [], prestamos: [], cobros: [], hoy });
    expect(r.kpis.totalClientes).toBe(0);
    expect(r.kpis.prestamosActivos).toBe(0);
    expect(r.kpis.totalCobradoHoy).toBe(0);
    expect(r.kpis.totalAtrasado).toBe(0);
    expect(r.kpis.carteraActiva).toBe(0);
    expect(r.topClientes).toEqual([]);
    expect(r.ultimosCobros).toEqual([]);
  });

  it('calcula KPIs activos y cartera', () => {
    const clientes = [{ id: 'c1' }, { id: 'c2' }];
    const prestamos = [
      { id: 'p1', cliente_id: 'c1', estado: 'vigente', saldo_capital: 50000, monto: 100000, cuotas: [] },
      { id: 'p2', cliente_id: 'c2', estado: 'atrasado', saldo_capital: 30000, monto: 80000, cuotas: [{ estado: 'pendiente', fecha: '2024-01-01', monto: 5000 }] },
      { id: 'p3', cliente_id: 'c1', estado: 'cancelado', saldo_capital: 0, monto: 50000, cuotas: [] },
    ];
    const cobros = [];
    const r = computeResumen({ clientes, prestamos, cobros, hoy });
    expect(r.kpis.totalClientes).toBe(2);
    expect(r.kpis.prestamosActivos).toBe(2);
    expect(r.kpis.carteraActiva).toBe(80000);
    expect(r.kpis.totalAtrasado).toBe(5000);
  });

  it('cobrado hoy y este mes', () => {
    const hoyStr = hoy.toISOString();
    const antes = new Date('2024-06-01T10:00:00.000Z').toISOString();
    const cobros = [
      { id: '1', fecha: hoyStr, monto: 1000, cliente_id: 'c1' },
      { id: '2', fecha: hoyStr, monto: 2000, cliente_id: 'c1' },
      { id: '3', fecha: antes, monto: 5000, cliente_id: 'c2' },
    ];
    const r = computeResumen({ clientes: [{ id: 'c1' }], prestamos: [], cobros, hoy });
    expect(r.kpis.totalCobradoHoy).toBe(3000);
    expect(r.kpis.cobrosHoyCount).toBe(2);
    expect(r.kpis.cobrosMes).toBe(8000);
  });

  it('topClientes ordenado por totalPrestado', () => {
    const clientes = [{ id: 'c1', nombre: 'Ana' }, { id: 'c2', nombre: 'Bob' }];
    const prestamos = [
      { id: 'p1', cliente_id: 'c1', monto: 100000, saldo_capital: 50000, estado: 'vigente', cuotas: [] },
      { id: 'p2', cliente_id: 'c2', monto: 200000, saldo_capital: 100000, estado: 'vigente', cuotas: [] },
      { id: 'p3', cliente_id: 'c1', monto: 50000, saldo_capital: 10000, estado: 'vigente', cuotas: [] },
    ];
    const r = computeResumen({ clientes, prestamos, cobros: [], hoy });
    expect(r.topClientes[0].id).toBe('c2');
    expect(r.topClientes[0].totalPrestado).toBe(200000);
    expect(r.topClientes[1].totalPrestado).toBe(150000);
  });

  it('ultimosCobros join cliente', () => {
    const clientes = [{ id: 'c1', nombre: 'Ana' }];
    const cobros = [
      { id: 'cob1', fecha: new Date('2024-06-14').toISOString(), monto: 100, cliente_id: 'c1' },
      { id: 'cob2', fecha: new Date('2024-06-15').toISOString(), monto: 200, cliente_id: 'c1' },
    ];
    const r = computeResumen({ clientes, prestamos: [], cobros, hoy });
    expect(r.ultimosCobros[0].id).toBe('cob2');
    expect(r.ultimosCobros[0].cliente.nombre).toBe('Ana');
  });

  it('cancelados30', () => {
    const recent = new Date(hoy.getTime() - 5 * 86400000).toISOString();
    const old = new Date(hoy.getTime() - 60 * 86400000).toISOString();
    const prestamos = [
      { id: 'p1', cuotas: [{ pagada_en: recent }], monto: 0, saldo_capital: 0, estado: 'cancelado' },
      { id: 'p2', cuotas: [{ pagada_en: old }], monto: 0, saldo_capital: 0, estado: 'cancelado' },
    ];
    const r = computeResumen({ clientes: [], prestamos, cobros: [], hoy });
    expect(r.kpis.cancelados30).toBe(1);
  });
});

describe('useResumenData', () => {
  it('carga y expone data', async () => {
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1' }]);
    vi.mocked(prestamosService.list).mockResolvedValue([{ id: 'p1', cliente_id: 'c1', monto: 1000, saldo_capital: 500, estado: 'vigente', cuotas: [] }]);
    vi.mocked(cobrosService.list).mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useResumenData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.kpis.totalClientes).toBe(1);
  });
});
