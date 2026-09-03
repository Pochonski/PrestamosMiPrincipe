import { describe, it, expect } from 'vitest';
import { validateBackup, isArrayOfObjects, previewBackup } from '../selectors';

describe('isArrayOfObjects', () => {
  it('true', () => expect(isArrayOfObjects([{ a: 1 }])).toBe(true));
  it('false si no array', () => expect(isArrayOfObjects({})).toBe(false));
  it('false si contiene no objeto', () => expect(isArrayOfObjects([1, 2])).toBe(false));
  it('false si array dentro', () => expect(isArrayOfObjects([[]])).toBe(false));
  it('[] -> true (every vacío)', () => expect(isArrayOfObjects([])).toBe(true));
});

describe('validateBackup', () => {
  it('null -> error', () => expect(validateBackup(null)).toBeTruthy());
  it('app != pmp', () => expect(validateBackup({ app: 'other', data: {} })).toContain('no es un respaldo'));
  it('sin data', () => expect(validateBackup({ app: 'pmp' })).toContain('no contiene datos'));
  it('campo corrupto', () => expect(validateBackup({ app: 'pmp', data: { clientes: [1] } })).toContain('corrupto'));
  it('ok mínimo', () => expect(validateBackup({ app: 'pmp', data: { clientes: [], prestamos: [], cuotas: [], cobros: [], notificaciones: [] } })).toBeNull());
  it('ok con datos', () => expect(validateBackup({ app: 'pmp', data: { clientes: [{ id: 1 }] } })).toBeNull());
});

describe('previewBackup', () => {
  it('cuenta', () => {
    const p = previewBackup({ exportedAt: '2024-01-01', version: 1, data: { clientes: [{}, {}], prestamos: [{}], cuotas: [], cobros: [], notificaciones: [] } });
    expect(p.counts.clientes).toBe(2);
    expect(p.counts.prestamos).toBe(1);
    expect(p.exportedAt).toBe('2024-01-01');
  });
  it('defaults si falta', () => {
    const p = previewBackup({ data: {} });
    expect(p.version).toBe(1);
    expect(p.exportedAt).toBeNull();
  });
});
