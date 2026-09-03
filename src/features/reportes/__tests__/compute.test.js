import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { compute, useReportesData } from '../selectors';
import { makePrestamo, makeCobro } from '../../../test/factories/prestamo';
import * as cobrosService from '../../../services/cobros';
import * as prestamosService from '../../../services/prestamos';

vi.mock('../../../services/cobros', () => ({ list: vi.fn() }));
vi.mock('../../../services/prestamos', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, list: vi.fn() };
});
vi.mock('../../../lib/events', () => ({ onDataChanged: vi.fn(() => () => {}) }));

describe('reportes compute', () => {
  it('retorna estructura', () => {
    const r = compute([], []);
    expect(r.cobrosPorMes).toHaveLength(6);
    expect(r.prestamosPorEstado).toEqual([]);
    expect(r.distribucionRuta).toEqual([]);
    expect(r.totalPrestamos).toBe(0);
  });
  it('agrupa cobros por mes (actual)', () => {
    const cobro = makeCobro({ monto: 5000, fecha: new Date().toISOString() });
    const r = compute([cobro], []);
    const last = r.cobrosPorMes[r.cobrosPorMes.length - 1];
    expect(last.value).toBe(5000);
  });
  it('prestamosPorEstado vigente vs atrasado', () => {
    const future = new Date(); future.setDate(future.getDate() + 5);
    const past = new Date(); past.setDate(past.getDate() - 5);
    const vig = makePrestamo({ id: '1', cuotas: [{ numero: 1, fecha: future.toISOString().slice(0,10), estado: 'pendiente' }] });
    const atr = makePrestamo({ id: '2', cuotas: [{ numero: 1, fecha: past.toISOString().slice(0,10), estado: 'pendiente' }] });
    const r = compute([], [vig, atr]);
    expect(r.prestamosPorEstado.find(x => x.label === 'Vigentes')?.value).toBe(1);
    expect(r.prestamosPorEstado.find(x => x.label === 'Atrasados')?.value).toBe(1);
  });
  it('distribucionRuta top5 ordenada', () => {
    const prestamos = [
      makePrestamo({ id: '1', ruta: 'A' }),
      makePrestamo({ id: '2', ruta: 'A' }),
      makePrestamo({ id: '3', ruta: 'B' }),
    ];
    const r = compute([], prestamos);
    expect(r.distribucionRuta[0].label).toBe('A');
    expect(r.distribucionRuta[0].value).toBe(2);
  });
  it('sin ruta -> Sin ruta', () => {
    const r = compute([], [makePrestamo({ id: '1', ruta: '' })]);
    expect(r.distribucionRuta[0].label).toBe('Sin ruta');
  });
});

describe('useReportesData', () => {
  it('carga data', async () => {
    vi.mocked(cobrosService.list).mockResolvedValue([makeCobro({ monto: 100 })]);
    vi.mocked(prestamosService.list).mockResolvedValue([makePrestamo({ ruta: 'A' })]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useReportesData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.totalPrestamos).toBe(1);
  });
});
