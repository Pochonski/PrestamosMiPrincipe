import { describe, it, expect } from 'vitest';
import { parseMontoNumber, parseMontoLive } from '../number';

describe('parseMontoNumber', () => {
  it('vacío -> 0', () => {
    expect(parseMontoNumber('')).toBe(0);
    expect(parseMontoNumber(null)).toBe(0);
    expect(parseMontoNumber(undefined)).toBe(0);
  });
  it('quita no dígitos', () => {
    expect(parseMontoNumber('₡ 1.234')).toBe(1234);
    expect(parseMontoNumber('1,234.56')).toBe(123456);
  });
  it('numérico', () => expect(parseMontoNumber('5000')).toBe(5000));
  it('abc -> 0', () => expect(parseMontoNumber('abc')).toBe(0));
});

describe('parseMontoLive', () => {
  it('vacío -> ""', () => expect(parseMontoLive('')).toBe(''));
  it('formatea', () => expect(parseMontoLive('1000')).toContain('1'));
  it('null -> ""', () => expect(parseMontoLive(null)).toBe(''));
});
