import { describe, it, expect, vi } from 'vitest';
import {
  getCuotasAtrasadas,
  getCuotasQueImpidenCapital,
  validateMontoCobro,
  buildResumenCobro,
  getResumenPrestamo,
  getCuotasPendientes,
  getCuotaActual,
  getCobrosDelPrestamo,
} from '../selectors';
import { makePrestamo, makeCuota } from '../../../test/factories/prestamo';
import * as prestamosService from '../../../services/prestamos';
import * as cobrosService from '../../../services/cobros';

function withDates({ pastDays = 5, futureDays = 5 } = {}) {
  const past = new Date();
  past.setDate(past.getDate() - pastDays);
  const future = new Date();
  future.setDate(future.getDate() + futureDays);
  return { past: past.toISOString().slice(0, 10), future: future.toISOString().slice(0, 10) };
}

describe('getCuotasAtrasadas', () => {
  it('null -> []', () => expect(getCuotasAtrasadas(null)).toEqual([]));
  it('filtra solo pendientes con fecha < hoy', () => {
    const { past, future } = withDates();
    const p = makePrestamo({
      cuotas: [
        makeCuota({ numero: 1, fecha: past, estado: 'pendiente' }),
        makeCuota({ numero: 2, fecha: future, estado: 'pendiente' }),
        makeCuota({ numero: 3, fecha: past, estado: 'pagada' }),
      ],
    });
    const r = getCuotasAtrasadas(p);
    expect(r).toHaveLength(1);
    expect(r[0].numero).toBe(1);
  });
});

describe('getCuotasQueImpidenCapital', () => {
  it('si incluirInteres y cuotaNumero filtra esa cuota', () => {
    const { past } = withDates();
    const p = makePrestamo({
      cuotas: [
        makeCuota({ numero: 1, fecha: past, estado: 'pendiente' }),
        makeCuota({ numero: 2, fecha: past, estado: 'pendiente' }),
      ],
    });
    const r = getCuotasQueImpidenCapital(p, { cuotaNumero: 1, incluirInteres: true });
    expect(r).toHaveLength(1);
    expect(r[0].numero).toBe(2);
  });
  it('sin incluirInteres retorna todas atrasadas', () => {
    const { past } = withDates();
    const p = makePrestamo({
      cuotas: [makeCuota({ numero: 1, fecha: past, estado: 'pendiente' })],
    });
    expect(getCuotasQueImpidenCapital(p, { incluirInteres: false })).toHaveLength(1);
  });
});

describe('validateMontoCobro', () => {
  it('monto vacío -> error', () => expect(validateMontoCobro({ monto: '' })).toBe('Ingresa un monto'));
  it('capital sin atrasos y dentro de saldo ok', () => {
    const p = makePrestamo({ monto: 100000, saldo_capital: 100000, tasa: 10, cuotas: [makeCuota({ numero: 1, fecha: withDates().future, monto: 10000 })] });
    expect(validateMontoCobro({ monto: '5000', tipo: 'capital', prestamo: p, cuotaNumero: 1, incluirInteres: false })).toBeNull();
  });
  it('capital excede saldo -> error max', () => {
    const p = makePrestamo({ monto: 10000, saldo_capital: 5000, tasa: 10, cuotas: [makeCuota({ numero: 1, fecha: withDates().future, monto: 500 })] });
    const err = validateMontoCobro({ monto: '10000', tipo: 'capital', prestamo: p, cuotaNumero: 1, incluirInteres: false });
    expect(err).toContain('Máximo');
  });
  it('capital con atrasos bloquea', () => {
    const { past } = withDates();
    const p = makePrestamo({
      monto: 10000, saldo_capital: 10000, tasa: 10,
      cuotas: [makeCuota({ numero: 2, fecha: past, estado: 'pendiente' }), makeCuota({ numero: 1, fecha: past, estado: 'pendiente', monto: 1000 })],
    });
    const err = validateMontoCobro({ monto: '1000', tipo: 'capital', prestamo: p, cuotaNumero: 1, incluirInteres: false });
    expect(err).toContain('atrasado');
  });
  it('cuotas agotadas bloquea capital', () => {
    const past = withDates().past;
    const p = makePrestamo({
      monto: 50000, saldo_capital: 20000, tasa: 10,
      cuotas: [makeCuota({ numero: 1, fecha: past, estado: 'pagada' })],
    });
    // cuotasAgotadas = todos pagada/cancelada && saldo>0
    const err = validateMontoCobro({ monto: '1000', tipo: 'capital', prestamo: p, cuotaNumero: 1, incluirInteres: false });
    expect(err).toContain('Cuotas agotadas');
  });
  it('interes ok sin validar saldo', () => {
    const p = makePrestamo({ monto: 10000, saldo_capital: 10000, tasa: 10, cuotas: [] });
    expect(validateMontoCobro({ monto: '500', tipo: 'interes', prestamo: p })).toBeNull();
  });
});

describe('buildResumenCobro', () => {
  it('interes -> interesPagado', () => {
    const p = makePrestamo({ monto: 100000, saldo_capital: 100000, cuotas: [makeCuota({ numero: 1, monto: 10000 })] });
    const r = buildResumenCobro({ prestamo: p, cuotaNumero: 1, monto: 10000, tipo: 'interes', incluirInteres: false });
    expect(r.interesPagado).toBe(10000);
    expect(r.capitalPagado).toBe(0);
    expect(r.nuevoSaldo).toBe(100000);
  });
  it('capital sin interes', () => {
    const p = makePrestamo({ monto: 100000, saldo_capital: 100000, cuotas: [makeCuota({ numero: 1, monto: 10000 })] });
    const r = buildResumenCobro({ prestamo: p, cuotaNumero: 1, monto: 5000, tipo: 'capital', incluirInteres: false });
    expect(r.capitalPagado).toBe(5000);
    expect(r.nuevoSaldo).toBe(95000);
  });
  it('capital con interes reparte', () => {
    const p = makePrestamo({ monto: 100000, saldo_capital: 100000, cuotas: [makeCuota({ numero: 1, monto: 10000 })] });
    const r = buildResumenCobro({ prestamo: p, cuotaNumero: 1, monto: 15000, tipo: 'capital', incluirInteres: true });
    expect(r.interesPagado).toBe(10000);
    expect(r.capitalPagado).toBe(5000);
    expect(r.nuevoSaldo).toBe(95000);
  });
  it('willCancel si saldo 0', () => {
    const p = makePrestamo({ monto: 5000, saldo_capital: 5000, cuotas: [makeCuota({ numero: 1, monto: 500 })] });
    const r = buildResumenCobro({ prestamo: p, cuotaNumero: 1, monto: 5000, tipo: 'capital', incluirInteres: false });
    expect(r.willCancel).toBe(true);
  });
});

describe('getResumenPrestamo', () => {
  it('null -> null', () => expect(getResumenPrestamo(null)).toBeNull());
  it('cuenta pendientes/pagadas', () => {
    const p = makePrestamo({
      monto: 100000, nCuotas: 3, saldo_capital: 50000,
      cuotas: [
        makeCuota({ numero: 1, estado: 'pagada', monto: 10000 }),
        makeCuota({ numero: 2, estado: 'pendiente', monto: 10000 }),
        makeCuota({ numero: 3, estado: 'pendiente', monto: 10000 }),
      ],
    });
    const r = getResumenPrestamo(p);
    expect(r.pendientes).toBe(2);
    expect(r.pagadas).toBe(1);
    expect(r.saldo).toBe(50000);
  });
});

describe('getCuotasPendientes / getCuotaActual / getCobrosDelPrestamo', () => {
  it('getCuotasPendientes null prestamo', async () => {
    const spy = vi.spyOn(prestamosService, 'getById').mockResolvedValue(null);
    expect(await getCuotasPendientes('p1')).toEqual([]);
    spy.mockRestore();
  });
  it('getCuotasPendientes filtra pendientes', async () => {
    const p = makePrestamo({ cuotas: [makeCuota({ numero: 1, estado: 'pendiente' }), makeCuota({ numero: 2, estado: 'pagada' })] });
    const spy = vi.spyOn(prestamosService, 'getById').mockResolvedValue(p);
    const r = await getCuotasPendientes('p1');
    expect(r).toHaveLength(1);
    spy.mockRestore();
  });
  it('getCuotaActual primera pendiente', async () => {
    const p = makePrestamo({ cuotas: [makeCuota({ numero: 1, estado: 'pagada' }), makeCuota({ numero: 2, estado: 'pendiente' })] });
    const spy = vi.spyOn(prestamosService, 'getById').mockResolvedValue(p);
    const r = await getCuotaActual('p1');
    expect(r.numero).toBe(2);
    spy.mockRestore();
  });
  it('getCobrosDelPrestamo delega', async () => {
    const spy = vi.spyOn(cobrosService, 'delPrestamo').mockResolvedValue([{ id: 'c1' }]);
    expect(await getCobrosDelPrestamo('p1')).toEqual([{ id: 'c1' }]);
    spy.mockRestore();
  });
});
