import { describe, it, expect, vi } from 'vitest';
import { getTipoMeta, getNotificacionesAgrupadas, formatFechaRelativa } from '../selectors';

describe('getTipoMeta', () => {
  it('conocido', () => expect(getTipoMeta('mora').tone).toBe('danger'));
  it('desconocido fallback', () => expect(getTipoMeta('xxx').tone).toBe('neutral'));
});

describe('getNotificacionesAgrupadas', () => {
  it('agrupa Hoy/Ayer', () => {
    const ahora = new Date();
    const ayer = new Date(ahora); ayer.setDate(ayer.getDate() - 1); ayer.setHours(10, 0, 0, 0);
    const hoy = new Date(ahora); hoy.setHours(10, 0, 0, 0);
    const items = [{ id: 1, fecha: hoy.toISOString() }, { id: 2, fecha: ayer.toISOString() }];
    const grupos = getNotificacionesAgrupadas(items);
    expect(grupos.find(g => g.label === 'Hoy')).toBeTruthy();
    expect(grupos.find(g => g.label === 'Ayer')).toBeTruthy();
  });
  it('vacío -> []', () => expect(getNotificacionesAgrupadas([])).toEqual([]));
  it('más antiguas', () => {
    const vieja = new Date(); vieja.setDate(vieja.getDate() - 20);
    const grupos = getNotificacionesAgrupadas([{ id: 1, fecha: vieja.toISOString() }]);
    expect(grupos[0].label).toBe('Más antiguas');
  });
});

describe('formatFechaRelativa', () => {
  it('ahora <1min', () => expect(formatFechaRelativa(new Date())).toBe('ahora'));
  it('hace min', () => {
    const d = new Date(Date.now() - 5 * 60000);
    expect(formatFechaRelativa(d)).toBe('hace 5 min');
  });
  it('hace horas', () => {
    const d = new Date(Date.now() - 3 * 3600000);
    expect(formatFechaRelativa(d)).toBe('hace 3 h');
  });
  it('hace días', () => {
    const d = new Date(Date.now() - 3 * 86400000);
    expect(formatFechaRelativa(d)).toBe('hace 3 d');
  });
  it('>7d -> fecha locale', () => {
    const d = new Date(Date.now() - 10 * 86400000);
    const r = formatFechaRelativa(d);
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });
});
