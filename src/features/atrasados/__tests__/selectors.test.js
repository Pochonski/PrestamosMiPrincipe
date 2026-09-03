import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/prestamos', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, cuotasAtrasadas: vi.fn() };
});
vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));
vi.mock('../../../lib/hooks/useAsyncResource', () => ({ useTickOnDataChange: vi.fn().mockReturnValue(0) }));

import { getAtrasadosDetallado, getResumenAtrasados, useAtrasados } from '../selectors';
import * as prestamosService from '../../../services/prestamos';
import * as clientesService from '../../../services/clientes';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

beforeEach(() => vi.clearAllMocks());

describe('getAtrasadosDetallado', () => {
  it('filtra sin cliente y ordena por diasAtraso desc', async () => {
    const now = Date.now();
    const cuotaVieja = { fecha: new Date(now - 10 * 86400000).toISOString(), monto: 1000 };
    const cuotaReciente = { fecha: new Date(now - 2 * 86400000).toISOString(), monto: 500 };
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([
      { prestamo: { clienteId: 'c1' }, cuota: cuotaVieja },
      { prestamo: { clienteId: 'c2' }, cuota: cuotaReciente },
      { prestamo: { clienteId: 'c3' }, cuota: cuotaVieja }, // sin cliente -> filtrado
    ]);
    vi.mocked(clientesService.list).mockResolvedValue([
      { id: 'c1', nombre: 'Ana' },
      { id: 'c2', nombre: 'Bob' },
    ]);
    const rows = await getAtrasadosDetallado();
    expect(rows).toHaveLength(2);
    expect(rows[0].diasAtraso).toBeGreaterThanOrEqual(rows[1].diasAtraso);
    expect(rows[0].cliente).toBeDefined();
    expect(rows.find(r => r.prestamo.clienteId === 'c3')).toBeUndefined();
  });
});

describe('getResumenAtrasados', () => {
  it('suma cantidad y total', async () => {
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([
      { cuota: { monto: 1000 } },
      { cuota: { monto: 2000 } },
    ]);
    const r = await getResumenAtrasados();
    expect(r.cantidad).toBe(2);
    expect(r.total).toBe(3000);
  });
  it('vacío', async () => {
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([]);
    const r = await getResumenAtrasados();
    expect(r.cantidad).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe('useAtrasados', () => {
  it('carga items y resumen', async () => {
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([{ prestamo: { clienteId: 'c1' }, cuota: { fecha: new Date().toISOString(), monto: 100 } }]);
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useAtrasados(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.length).toBe(1);
    expect(result.current.resumen.cantidad).toBe(1);
  });
});
