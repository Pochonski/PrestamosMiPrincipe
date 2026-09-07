import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/prestamos', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, cobrarHoy: vi.fn(), cuotasAtrasadas: vi.fn() };
});
vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));

import { getAtrasadasDetalle, getCobrarHoyDetalle, getResumenCobrarHoy, useCobrarHoy } from '../selectors';
import * as prestamosService from '../../../services/prestamos';
import * as clientesService from '../../../services/clientes';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

beforeEach(() => vi.clearAllMocks());

describe('getCobrarHoyDetalle', () => {
  it('mapea y preserva prestamo/prestamoId/clienteId/cuota', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1 } },
    ]);
    const r = await getCobrarHoyDetalle();
    expect(r[0]).toEqual({
      prestamo: { id: 'p1', clienteId: 'c1' },
      prestamoId: 'p1',
      clienteId: 'c1',
      cuota: { numero: 1 },
    });
  });
});

describe('getResumenCobrarHoy', () => {
  it('suma', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([
      { cuota: { monto: 100 } }, { cuota: { monto: 200 } },
    ]);
    const r = await getResumenCobrarHoy();
    expect(r.cantidad).toBe(2);
    expect(r.total).toBe(300);
  });
});

describe('useCobrarHoy', () => {
  it('filtra por cliente existente', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1 } },
      { prestamo: { id: 'p2', clienteId: 'cX' }, cuota: { numero: 2 } },
    ]);
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([]);
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCobrarHoy(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].prestamo).toEqual({ id: 'p1', clienteId: 'c1' });
    expect(result.current.items[0].clienteId).toBe('c1');
    expect(result.current.items[0].cliente.nombre).toBe('Ana');
  });

  it('combina hoy + atrasadas con resumen del día', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 2, monto: 100, fecha: '2099-01-01' } },
    ]);
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([
      { prestamo: { id: 'p2', clienteId: 'c1' }, cuota: { numero: 1, monto: 200, fecha: '2000-01-01' } },
      { prestamo: { id: 'p3', clienteId: 'cX' }, cuota: { numero: 1, monto: 300, fecha: '2000-01-01' } },
    ]);
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCobrarHoy(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    // la de cliente inexistente se filtra
    expect(result.current.atrasadas).toHaveLength(1);
    expect(result.current.atrasadas[0].diasAtraso).toBeGreaterThan(0);
    expect(result.current.resumenDia).toMatchObject({
      hoyCant: 1,
      hoyTotal: 100,
      atrCant: 1,
      atrTotal: 200,
      cantidad: 2,
      total: 300,
    });
    // compat: resumen sigue siendo solo hoy
    expect(result.current.resumen).toEqual({ cantidad: 1, total: 100 });
  });

  it('ordena atrasadas por días y no duplica la misma cuota', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1, monto: 100, fecha: '2099-01-01' } },
    ]);
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1, monto: 100, fecha: '2000-01-01' } },
      { prestamo: { id: 'p2', clienteId: 'c1' }, cuota: { numero: 1, monto: 50, fecha: '2000-01-02' } },
      { prestamo: { id: 'p3', clienteId: 'c1' }, cuota: { numero: 1, monto: 50, fecha: '2000-01-01' } },
    ]);
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCobrarHoy(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // p1-numero1 ya está en hoy -> no se duplica
    expect(result.current.atrasadas.map((a) => a.prestamoId).sort()).toEqual(['p2', 'p3']);
    // más días primero (2000-01-01 antes que 2000-01-02)
    expect(result.current.atrasadas[0].prestamoId).toBe('p3');
  });
});

describe('getAtrasadasDetalle', () => {
  it('mapea con diasAtraso y filtra nulos', async () => {
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1, fecha: '2000-01-01' } },
      { prestamo: null, cuota: null },
    ]);
    const r = await getAtrasadasDetalle();
    expect(r).toHaveLength(1);
    expect(r[0].prestamoId).toBe('p1');
    expect(r[0].diasAtraso).toBeGreaterThan(0);
  });
});
