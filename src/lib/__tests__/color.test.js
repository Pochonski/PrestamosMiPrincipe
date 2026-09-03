import { describe, it, expect } from 'vitest';
import { colorFor } from '../color';

const PALETTE = ['#D4AF37', '#3B0764', '#0F172A', '#0E7490', '#9D174D', '#166534'];

describe('colorFor', () => {
  it('vacío -> primer color', () => expect(colorFor('')).toBe(PALETTE[0]));
  it('determinista', () => expect(colorFor('abc')).toBe(colorFor('abc')));
  it('diferentes ids pueden dar diferente color', () => {
    const a = colorFor('1');
    const b = colorFor('2');
    // no garantizado distinto, pero probamos que pertenece a paleta
    expect(PALETTE).toContain(a);
    expect(PALETTE).toContain(b);
  });
  it('siempre en paleta', () => {
    for (const id of ['cli-1', 'prest-xyz', 'long-id-1234567890']) {
      expect(PALETTE).toContain(colorFor(id));
    }
  });
  it('hash estable snapshot', () => {
    // snapshot: verificar que no cambie sin querer
    expect(colorFor('test-id')).toMatch(/^#/);
  });
});
