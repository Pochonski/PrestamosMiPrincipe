import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/prestamos', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, cobrarHoy: vi.fn() };
});
vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));

import { getCobrarHoyDetalle, getResumenCobrarHoy, useCobrarHoy } from '../selectors';
import * as prestamosService from '../../../services/prestamos';
import * as clientesService from '../../../services/clientes';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

beforeEach(() => vi.clearAllMocks());

describe('getCobrarHoyDetalle', () => {
  it('mapea prestamoId/clienteId/cuota', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([
      { prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1 } },
    ]);
    const r = await getCobrarHoyDetalle();
    expect(r[0]).toEqual({ prestamoId: 'p1', clienteId: 'c1', cuota: { numero: 1 } });
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
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCobrarHoy(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].cliente.nombre).toBe('Ana');
  });
});
