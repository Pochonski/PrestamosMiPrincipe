import { describe, it, expect } from 'vitest';
import {
  spreadRatio,
  tieneComision,
  comisionDeInteres,
  comisionCobro,
  resumenComisiones,
} from '../selectors';

describe('spreadRatio', () => {
  it('null sin tasa_acreedor -> 0', () => {
    expect(spreadRatio({ tasa: 25, tasa_acreedor: null })).toBe(0);
    expect(spreadRatio({ tasa: 25 })).toBe(0);
    expect(spreadRatio(null)).toBe(0);
  });
  it('25/20 -> 0.2', () => {
    expect(spreadRatio({ tasa: 25, tasa_acreedor: 20 })).toBeCloseTo(0.2);
  });
  it('acreedor 0 -> 1 (todo comisión)', () => {
    expect(spreadRatio({ tasa: 25, tasa_acreedor: 0 })).toBe(1);
  });
  it('acreedor >= cliente -> 0', () => {
    expect(spreadRatio({ tasa: 20, tasa_acreedor: 20 })).toBe(0);
    expect(spreadRatio({ tasa: 20, tasa_acreedor: 25 })).toBe(0);
  });
});

describe('tieneComision', () => {
  it('false sin tasa', () => expect(tieneComision({ tasa: 25 })).toBe(false));
  it('true con tasa incl. 0', () => {
    expect(tieneComision({ tasa: 25, tasa_acreedor: 20 })).toBe(true);
    expect(tieneComision({ tasa: 25, tasa_acreedor: 0 })).toBe(true);
  });
});

describe('comisionDeInteres / comisionCobro', () => {
  it('25k al 25/20 -> 5k', () => {
    expect(comisionDeInteres(25000, { tasa: 25, tasa_acreedor: 20 })).toBe(5000);
  });
  it('sin comisión -> 0', () => {
    expect(comisionDeInteres(25000, { tasa: 25 })).toBe(0);
  });
  it('cobro usa interes_pagado', () => {
    const p = { tasa: 25, tasa_acreedor: 20 };
    expect(comisionCobro({ interes_pagado: 25000 }, p)).toBe(5000);
    expect(comisionCobro({ interes_pagado: 0, capital_pagado: 50000 }, p)).toBe(0);
  });
});

describe('resumenComisiones', () => {
  const p1 = {
    id: 'p1', clienteId: 'c1', ruta: 'A', monto: 100000, tasa: 25, tasa_acreedor: 20,
    cuotas: [
      { numero: 1, monto: 25000, estado: 'pagada' },
      { numero: 2, monto: 25000, estado: 'pendiente' },
    ],
  };
  const p2 = { id: 'p2', clienteId: 'c2', tasa: 20, cuotas: [{ numero: 1, monto: 20000, estado: 'pendiente' }] };

  it('cobrada desde cobros y porCobrar desde pendientes', () => {
    const r = resumenComisiones({
      prestamos: [p1, p2],
      cobros: [{ prestamo_id: 'p1', interes_pagado: 25000 }],
    });
    expect(r.cobrada).toBe(5000);
    expect(r.acreedorCobrada).toBe(20000);
    expect(r.porCobrar).toBe(5000);
    expect(r.total).toBe(10000);
    expect(r.conComision).toBe(1);
    expect(r.sinComision).toBe(1);
    expect(r.porPrestamo).toHaveLength(1);
    expect(r.porPrestamo[0].prestamoId).toBe('p1');
  });
  it('ignora cobros solo-capital', () => {
    const r = resumenComisiones({
      prestamos: [p1],
      cobros: [{ prestamo_id: 'p1', interes_pagado: 0, capital_pagado: 50000 }],
    });
    expect(r.cobrada).toBe(0);
  });
  it('vacío -> ceros', () => {
    expect(resumenComisiones({})).toMatchObject({ cobrada: 0, porCobrar: 0, total: 0 });
  });
});
