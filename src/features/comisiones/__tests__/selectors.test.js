import { describe, it, expect } from 'vitest';
import {
  spreadRatio,
  tieneComision,
  comisionDeInteres,
  comisionCobro,
  resumenComisiones,
} from '../selectors';

describe('spreadRatio', () => {
  it('sin comisión -> 0', () => {
    expect(spreadRatio({ tasa: 20, tasa_comision: null })).toBe(0);
    expect(spreadRatio({ tasa: 20 })).toBe(0);
    expect(spreadRatio(null)).toBe(0);
  });
  it('20+2 -> 2/22', () => {
    expect(spreadRatio({ tasa: 20, tasa_comision: 2 })).toBeCloseTo(2 / 22);
  });
});

describe('tieneComision', () => {
  it('false sin comisión', () => expect(tieneComision({ tasa: 20 })).toBe(false));
  it('false con 0', () => expect(tieneComision({ tasa: 20, tasa_comision: 0 })).toBe(false));
  it('true con comisión', () => expect(tieneComision({ tasa: 20, tasa_comision: 2 })).toBe(true));
});

describe('comisionDeInteres / comisionCobro', () => {
  it('22000 al 20+2 -> 2000', () => {
    expect(comisionDeInteres(22000, { tasa: 20, tasa_comision: 2 })).toBe(2000);
  });
  it('sin comisión -> 0', () => {
    expect(comisionDeInteres(22000, { tasa: 20 })).toBe(0);
  });
  it('cobro usa interes_pagado', () => {
    const p = { tasa: 20, tasa_comision: 2 };
    expect(comisionCobro({ interes_pagado: 22000 }, p)).toBe(2000);
    expect(comisionCobro({ interes_pagado: 0, capital_pagado: 50000 }, p)).toBe(0);
  });
});

describe('resumenComisiones', () => {
  const p1 = {
    id: 'p1', clienteId: 'c1', ruta: 'A', monto: 100000, tasa: 20, tasa_comision: 2,
    cuotas: [
      { numero: 1, monto: 22000, estado: 'pagada' },
      { numero: 2, monto: 22000, estado: 'pendiente' },
    ],
  };
  const p2 = { id: 'p2', clienteId: 'c2', tasa: 20, cuotas: [{ numero: 1, monto: 20000, estado: 'pendiente' }] };

  it('cobrada desde cobros y porCobrar desde pendientes', () => {
    const r = resumenComisiones({
      prestamos: [p1, p2],
      cobros: [{ prestamo_id: 'p1', interes_pagado: 22000 }],
    });
    expect(r.cobrada).toBe(2000);
    expect(r.acreedorCobrada).toBe(20000);
    expect(r.porCobrar).toBe(2000);
    expect(r.total).toBe(4000);
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
