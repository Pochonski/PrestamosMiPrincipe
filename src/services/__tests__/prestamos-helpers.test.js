import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStatus, getSaldoCapital, cuotaDelPeriodo, totalIntereses, totalAPagar, liquidarTotal, proximoCobro, cuotasAgotadas } from '../prestamos';
import { makePrestamo, makeCuota } from '../../test/factories/prestamo';

describe('getStatus', () => {
  it('null -> cancelado', () => expect(getStatus(null)).toBe('cancelado'));
  it('estado cancelado prioriza', () => expect(getStatus(makePrestamo({ estado: 'cancelado' }))).toBe('cancelado'));
  it('sin cuotas -> vigente', () => expect(getStatus(makePrestamo({ cuotas: [] }))).toBe('vigente'));
  it('todas pagadas -> cancelado', () => {
    const p = makePrestamo({ cuotas: [makeCuota({ estado: 'pagada' }), makeCuota({ numero: 2, estado: 'pagada' })] });
    expect(getStatus(p)).toBe('cancelado');
  });
  it('atrasado si alguna pendiente fecha < hoy', () => {
    const past = new Date(); past.setDate(past.getDate() - 5);
    const p = makePrestamo({ cuotas: [makeCuota({ fecha: past.toISOString().slice(0, 10), estado: 'pendiente' })] });
    expect(getStatus(p)).toBe('atrasado');
  });
  it('vigente si pendiente futuro', () => {
    const future = new Date(); future.setDate(future.getDate() + 5);
    const p = makePrestamo({ cuotas: [makeCuota({ fecha: future.toISOString().slice(0, 10), estado: 'pendiente' })] });
    expect(getStatus(p)).toBe('vigente');
  });
  it('cancelada no cuenta como atrasada', () => {
    const past = new Date(); past.setDate(past.getDate() - 5);
    const p = makePrestamo({ cuotas: [makeCuota({ fecha: past.toISOString().slice(0, 10), estado: 'cancelada' })] });
    expect(getStatus(p)).toBe('cancelado');
  });
});

describe('getSaldoCapital', () => {
  it('null -> 0', () => expect(getSaldoCapital(null)).toBe(0));
  it('usa saldo_capital', () => expect(getSaldoCapital(makePrestamo({ saldo_capital: 50000 }))).toBe(50000));
  it('fallback a monto', () => expect(getSaldoCapital({ monto: 70000 })).toBe(70000));
});

describe('cuotaDelPeriodo', () => {
  it('null -> 0', () => expect(cuotaDelPeriodo(null)).toBe(0));
  it('saldo 100000 tasa 10 -> 10000', () => expect(cuotaDelPeriodo(makePrestamo({ saldo_capital: 100000, tasa: 10 }))).toBe(10000));
  it('redondea', () => expect(cuotaDelPeriodo(makePrestamo({ saldo_capital: 33333, tasa: 10 }))).toBe(3333));
});

describe('totalIntereses / totalAPagar / liquidarTotal', () => {
  it('totalIntereses = cuota * n', () => {
    const p = makePrestamo({ saldo_capital: 100000, tasa: 10, n_cuotas: 5, nCuotas: 5 });
    expect(totalIntereses(p)).toBe(50000);
  });
  it('totalAPagar = monto + intereses', () => {
    const p = makePrestamo({ monto: 100000, saldo_capital: 100000, tasa: 10, n_cuotas: 5, nCuotas: 5 });
    expect(totalAPagar(p)).toBe(150000);
  });
  it('liquidarTotal = saldo + cuota', () => {
    const p = makePrestamo({ saldo_capital: 50000, tasa: 10 });
    expect(liquidarTotal(p)).toBe(55000);
  });
  it('liquidarTotal null ->0', () => expect(liquidarTotal(null)).toBe(0));
});

describe('proximoCobro', () => {
  it('null -> null', () => expect(proximoCobro(null)).toBeNull());
  it('primera no pagada/cancelada', () => {
    const p = makePrestamo({ cuotas: [makeCuota({ numero: 1, estado: 'pagada' }), makeCuota({ numero: 2, estado: 'pendiente' }), makeCuota({ numero: 3, estado: 'pendiente' })] });
    expect(proximoCobro(p).numero).toBe(2);
  });
  it('ninguna -> null', () => {
    const p = makePrestamo({ cuotas: [makeCuota({ estado: 'pagada' })] });
    expect(proximoCobro(p)).toBeNull();
  });
});

describe('cuotasAgotadas', () => {
  it('null/false', () => expect(cuotasAgotadas(null)).toBe(false));
  it('vacías -> false', () => expect(cuotasAgotadas(makePrestamo({ cuotas: [] }))).toBe(false));
  it('todas cerradas y saldo>0 -> true', () => expect(cuotasAgotadas(makePrestamo({ saldo_capital: 10000, cuotas: [makeCuota({ estado: 'pagada' })] }))).toBe(true));
  it('todas cerradas saldo 0 -> false', () => expect(cuotasAgotadas(makePrestamo({ saldo_capital: 0, cuotas: [makeCuota({ estado: 'pagada' })] }))).toBe(false));
  it('alguna pendiente -> false', () => expect(cuotasAgotadas(makePrestamo({ saldo_capital: 10000, cuotas: [makeCuota({ estado: 'pendiente' })] }))).toBe(false));
});
