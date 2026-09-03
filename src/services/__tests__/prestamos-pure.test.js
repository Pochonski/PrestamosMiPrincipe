import { describe, it, expect } from 'vitest';
import {
  getSaldoCapital,
  cuotaDelPeriodo,
  totalIntereses,
  totalAPagar,
  liquidarTotal,
  calcCarteraTotal,
  calcTotalAtrasado,
  calcTotalCobrarHoy,
} from '../prestamos';

describe('prestamos helpers pure branches extra', () => {
  it('getSaldoCapital fallback monto y 0', () => {
    expect(getSaldoCapital(null)).toBe(0);
    expect(getSaldoCapital({ monto: 500 })).toBe(500);
    expect(getSaldoCapital({ saldo_capital: undefined, monto: undefined })).toBe(0);
  });

  it('cuotaDelPeriodo tasa undefined -> 0', () => {
    expect(cuotaDelPeriodo({ saldo_capital: 1000 })).toBe(0);
    expect(cuotaDelPeriodo({ saldo_capital: 1000, tasa: 0 })).toBe(0);
  });

  it('totalIntereses usa nCuotas fallback', () => {
    expect(totalIntereses({ saldo_capital: 1000, tasa: 10, nCuotas: 3 })).toBe(300);
    expect(totalIntereses({ saldo_capital: 1000, tasa: 10, n_cuotas: 2 })).toBe(200);
  });

  it('totalAPagar y liquidarTotal', () => {
    expect(totalAPagar({ monto: 0, saldo_capital: 0, tasa: 0, n_cuotas: 1 })).toBe(0);
    expect(liquidarTotal({ saldo_capital: 1000, tasa: 10 })).toBe(1100);
  });

  it('calcCarteraTotal saldo_capital ausente -> 0', () => {
    expect(calcCarteraTotal([{ estado: 'vigente' }, { estado: 'vigente', saldo_capital: 100 }])).toBe(100);
  });

  it('calcTotalAtrasado fallback x.monto', () => {
    expect(calcTotalAtrasado([{ cuota: { monto: 10 } }, { monto: 5 }])).toBe(15);
    expect(calcTotalAtrasado([{ cuota: { monto: 7 } }])).toBe(7);
  });

  it('calcTotalCobrarHoy vacio y con datos', () => {
    expect(calcTotalCobrarHoy([])).toBe(0);
    expect(calcTotalCobrarHoy([{ cuota: { monto: 20 } }])).toBe(20);
  });
});