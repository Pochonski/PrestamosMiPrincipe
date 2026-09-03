import { describe, it, expect } from 'vitest';
import {
  formatCRC,
  formatCRCCompact,
  toDate,
  parseLocalDate,
  formatMontoLive,
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  formatPhoneCR,
  startOfDay,
  endOfDay,
  diffDays,
  greeting,
} from '../format';

describe('formatCRC', () => {
  it('null/undefined/NaN -> ₡0', () => {
    expect(formatCRC(null)).toBe('₡0');
    expect(formatCRC(undefined)).toBe('₡0');
    expect(formatCRC(NaN)).toBe('₡0');
    expect(formatCRC('not-a-number')).toBe('₡0');
  });
  it('formatea número', () => {
    const r = formatCRC(1000);
    expect(r).toContain('1');
    expect(r).toContain('₡');
  });
  it('acepta string numérico', () => {
    expect(formatCRC('5000')).toContain('5');
  });
});

describe('formatCRCCompact', () => {
  it('null -> ₡0', () => expect(formatCRCCompact(null)).toBe('₡0'));
  it('formatea compacto', () => {
    const r = formatCRCCompact(1000000);
    expect(r).toContain('₡');
  });
});

describe('toDate', () => {
  it('null -> null', () => expect(toDate(null)).toBeNull());
  it('Date -> mismo', () => {
    const d = new Date(2024, 0, 1);
    expect(toDate(d)).toBe(d);
  });
  it('string -> Date', () => expect(toDate('2024-01-15') instanceof Date).toBe(true));
});

describe('parseLocalDate', () => {
  it('null -> null', () => expect(parseLocalDate(null)).toBeNull());
  it('Date passthrough', () => {
    const d = new Date(2024, 0, 15);
    expect(parseLocalDate(d)).toBe(d);
  });
  it('YYYY-MM-DD sin timezone shift', () => {
    const d = parseLocalDate('2024-01-15');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
  it('corta por T', () => {
    const d = parseLocalDate('2024-01-15T12:00:00Z');
    expect(d.getDate()).toBe(15);
  });
  it('fallback a new Date para otros formatos', () => {
    const d = parseLocalDate('2024/01/15');
    expect(d instanceof Date).toBe(true);
  });
});

describe('formatMontoLive', () => {
  it('vacío -> ""', () => expect(formatMontoLive('')).toBe(''));
  it('formatea dígitos', () => expect(formatMontoLive('1000')).toContain('1'));
  it('quita no dígitos', () => expect(formatMontoLive('₡ 1.234')).toContain('1'));
});

describe('formatDate / formatDateShort / formatTime / formatDateTime', () => {
  it('null -> —', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateShort(null)).toBe('—');
    expect(formatTime(null)).toBe('—');
    expect(formatDateTime(null)).toBe('—');
  });
  it('fecha válida formatea', () => {
    const d = new Date(2024, 0, 15, 10, 30);
    expect(formatDate(d)).not.toBe('—');
    expect(formatDateShort(d)).not.toBe('—');
    expect(formatTime(d)).not.toBe('—');
    expect(formatDateTime(d)).not.toBe('—');
  });
});

describe('formatPhoneCR', () => {
  it('falsy -> —', () => expect(formatPhoneCR(null)).toBe('—'));
  it('8 dígitos con guión', () => expect(formatPhoneCR('88888888')).toBe('8888-8888'));
  it('longitud !=8 retorna raw', () => expect(formatPhoneCR('8888888')).toBe('8888888'));
  it('con formato previo', () => expect(formatPhoneCR('8888-8888')).toBe('8888-8888'));
});

describe('startOfDay / endOfDay', () => {
  it('startOfDay pone 00:00:00.000', () => {
    const d = startOfDay(new Date(2024, 0, 15, 14, 30));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
  it('endOfDay pone 23:59:59.999', () => {
    const d = endOfDay(new Date(2024, 0, 15, 10, 0));
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
  });
  it('no muta original', () => {
    const orig = new Date(2024, 0, 15, 12, 0);
    const h = orig.getHours();
    startOfDay(orig);
    expect(orig.getHours()).toBe(h);
  });
});

describe('diffDays', () => {
  it('mismo día -> 0', () => {
    const d = new Date(2024, 0, 15, 10, 0);
    expect(diffDays(d, d)).toBe(0);
  });
  it('positivo si a < b negativo? verifica signo', () => {
    const a = new Date(2024, 0, 10);
    const b = new Date(2024, 0, 15);
    expect(diffDays(a, b)).toBe(-5);
    expect(diffDays(b, a)).toBe(5);
  });
});

describe('greeting', () => {
  it('mañana <12', () => expect(greeting(new Date(2024, 0, 1, 8, 0))).toBe('Buenos días'));
  it('11:59 aún días', () => expect(greeting(new Date(2024, 0, 1, 11, 59))).toBe('Buenos días'));
  it('12:00 tardes', () => expect(greeting(new Date(2024, 0, 1, 12, 0))).toBe('Buenas tardes'));
  it('17:59 tardes', () => expect(greeting(new Date(2024, 0, 1, 17, 59))).toBe('Buenas tardes'));
  it('18:00 noches', () => expect(greeting(new Date(2024, 0, 1, 18, 0))).toBe('Buenas noches'));
  it('23h noches', () => expect(greeting(new Date(2024, 0, 1, 23, 0))).toBe('Buenas noches'));
});
