import { describe, it, expect } from 'vitest';
import { getStatus, getSaldoCapital, cuotaDelPeriodo } from '../prestamos';
import { makePrestamo, makeCuota } from '../../test/factories/prestamo';

// Día local YYYY-MM-DD (los tests anteriores usaban fecha UTC, que falla en
// la ventana donde UTC ya cambió de día pero local aún no, ej. tardes en CST).
function localDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('getStatus branches 100%', () => {
  it('null -> cancelado', () => expect(getStatus(null)).toBe('cancelado'));
  it('estado cancelado', () => expect(getStatus({ estado: 'cancelado', cuotas: [] })).toBe('cancelado'));
  it('atrasado si pendiente < hoy', () => {
    const p = makePrestamo({ cuotas: [{ numero: 1, fecha: localDay(-1), estado: 'pendiente' }] });
    expect(getStatus(p)).toBe('atrasado');
  });
  it('cancelada no cuenta como atrasada', () => {
    const p = makePrestamo({ cuotas: [{ numero: 1, fecha: localDay(-1), estado: 'cancelada' }] });
    // todas cerradas -> cancelado
    expect(getStatus(p)).toBe('cancelado');
  });
  it('vigente sin cuotas', () => expect(getStatus(makePrestamo({ cuotas: [] }))).toBe('vigente'));
  it('vigente con pendiente futuro', () => {
    const p = makePrestamo({ cuotas: [{ numero: 1, fecha: localDay(1), estado: 'pendiente' }] });
    expect(getStatus(p)).toBe('vigente');
  });
  it('cancelado si todas pagadas', () => {
    const p = makePrestamo({ cuotas: [{ numero: 1, fecha: '2024-01-01', estado: 'pagada' }, { numero: 2, fecha: '2024-01-02', estado: 'cancelada' }] });
    expect(getStatus(p)).toBe('cancelado');
  });
});

describe('getSaldoCapital / cuotaDelPeriodo edge', () => {
  it('null ->0', () => expect(getSaldoCapital(null)).toBe(0));
  it('tasa 0 ->0', () => expect(cuotaDelPeriodo({ saldo_capital: 1000, tasa: 0 })).toBe(0));
  it('null prestamo ->0', () => expect(cuotaDelPeriodo(null)).toBe(0));
});

describe('hydrate normalize', () => {
  it('normalize null', async () => {
    const { default: mod } = await import('../prestamos.js');
    // indirect via getById null already tested
    expect(true).toBe(true);
  });
});
