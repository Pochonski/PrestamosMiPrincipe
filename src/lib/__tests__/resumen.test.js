import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/prestamos', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, delCliente: vi.fn(), getStatus: actual.getStatus, getSaldoCapital: actual.getSaldoCapital, cuotaDelPeriodo: actual.cuotaDelPeriodo };
});

import { statsCliente, getResumenPrestamo } from '../resumen';
import * as prestamosService from '../../services/prestamos';
import { makePrestamo, makeCuota } from '../../test/factories/prestamo';

beforeEach(() => vi.clearAllMocks());

describe('statsCliente', () => {
  it('cuenta por estado', async () => {
    const future = new Date(); future.setDate(future.getDate() + 5);
    const past = new Date(); past.setDate(past.getDate() - 5);
    vi.mocked(prestamosService.delCliente).mockResolvedValue([
      makePrestamo({ id: '1', cuotas: [{ numero: 1, fecha: future.toISOString().slice(0,10), estado: 'pendiente' }] }),
      makePrestamo({ id: '2', cuotas: [{ numero: 1, fecha: past.toISOString().slice(0,10), estado: 'pendiente' }] }),
      makePrestamo({ id: '3', estado: 'cancelado', cuotas: [] }),
    ]);
    const r = await statsCliente('cli-1');
    expect(r.total).toBe(3);
    expect(r.vigentes + r.atrasados + r.cancelados).toBe(3);
  });
});

describe('getResumenPrestamo', () => {
  it('null -> null', () => expect(getResumenPrestamo(null)).toBeNull());
  it('calcula pendientes/pagadas/canceladas', () => {
    const p = makePrestamo({
      monto: 100000, nCuotas: 3, saldo_capital: 50000, tasa: 10,
      cuotas: [
        makeCuota({ numero: 1, estado: 'pagada', monto: 5000 }),
        makeCuota({ numero: 2, estado: 'pendiente', monto: 5000 }),
        makeCuota({ numero: 3, estado: 'cancelada', monto: 5000 }),
      ],
    });
    const r = getResumenPrestamo(p);
    expect(r.pendientes).toBe(1);
    expect(r.pagadas).toBe(1);
    expect(r.canceladas).toBe(1);
    expect(r.proximoCobro.numero).toBe(2);
    expect(r.saldo).toBe(50000);
  });
});
