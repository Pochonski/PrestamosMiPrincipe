import { describe, it, expect } from 'vitest';
import {
  spreadRatio,
  tieneComision,
  comisionDeInteres,
  comisionCobro,
  estadoComisionCuota,
  interesPagadoPorCuota,
  resumenComisiones,
  validateTasaComision,
  tuyoDesdePct,
  pctDesdeTuyo,
  cuotasVencidas,
  resumenAtrasadosComision,
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

describe('estadoComisionCuota', () => {
  const p = { tasa: 20, tasa_comision: 2 };
  const q = { numero: 1, monto: 22000 };
  it('incompleta -> 0 cobrada, total por cobrar', () => {
    expect(estadoComisionCuota(p, q, 11000)).toEqual({ completa: false, cobrada: 0, porCobrar: 2000 });
  });
  it('completa -> proporcional sobre lo pagado', () => {
    expect(estadoComisionCuota(p, q, 22000)).toEqual({ completa: true, cobrada: 2000, porCobrar: 0 });
  });
  it('sobrepago -> proporcional sobre el total pagado', () => {
    expect(estadoComisionCuota(p, q, 23000).cobrada).toBe(Math.round((23000 * 2) / 22));
  });
  it('sin comisión -> completa en 0', () => {
    expect(estadoComisionCuota({ tasa: 20 }, q, 0)).toEqual({ completa: true, cobrada: 0, porCobrar: 0 });
  });
});

describe('estadoComisionCuota', () => {
  const p = { tasa: 20, tasa_comision: 2 };
  const q = { numero: 1, monto: 22000 };
  it('incompleta -> 0 cobrada, total por cobrar', () => {
    expect(estadoComisionCuota(p, q, 11000)).toEqual({ completa: false, cobrada: 0, porCobrar: 2000 });
  });
  it('completa -> proporcional sobre lo pagado', () => {
    expect(estadoComisionCuota(p, q, 22000)).toEqual({ completa: true, cobrada: 2000, porCobrar: 0 });
  });
  it('sobrepago -> proporcional sobre el total pagado', () => {
    expect(estadoComisionCuota(p, q, 23000).cobrada).toBe(Math.round((23000 * 2) / 22));
  });
  it('sin comisión -> completa en 0', () => {
    expect(estadoComisionCuota({ tasa: 20 }, q, 0)).toEqual({ completa: true, cobrada: 0, porCobrar: 0 });
  });
});

describe('interesPagadoPorCuota', () => {
  it('suma por cuota y filtra otro préstamo', () => {
    const m = interesPagadoPorCuota([
      { prestamo_id: 'p1', cuota_numero: 1, interes_pagado: 11000 },
      { prestamo_id: 'p1', cuota_numero: 1, interes_pagado: 11000 },
      { prestamo_id: 'p1', cuota_numero: 2, interes_pagado: 5000 },
      { prestamo_id: 'p9', cuota_numero: 1, interes_pagado: 99999 },
      { prestamo_id: 'p1', interes_pagado: 777 },
    ], 'p1');
    expect(m.get(1)).toBe(22000);
    expect(m.get(2)).toBe(5000);
  });
});

describe('validateTasaComision', () => {
  it('vacía ok (sin comisión)', () => {
    expect(validateTasaComision('', 20)).toBeNull();
    expect(validateTasaComision(null, 20)).toBeNull();
  });
  it('suma <= 100 ok', () => {
    expect(validateTasaComision(2, 20)).toBeNull();
    expect(validateTasaComision(0, 20)).toBeNull();
  });
  it('suma > 100 falla', () => expect(validateTasaComision(5, 98)).toContain('100'));
  it('negativa falla', () => expect(validateTasaComision(-1, 20)).toBe('La tasa no puede ser negativa'));
});

describe('tuyoDesdePct / pctDesdeTuyo', () => {
  it('ejemplo: cuota 6000, base 20, 10% -> 2000', () => {
    expect(tuyoDesdePct(6000, 20, 10)).toBe(2000);
  });
  it('inverso: 2000 -> 10', () => {
    expect(pctDesdeTuyo(6000, 20, 2000)).toBe(10);
  });
  it('ida y vuelta con decimales', () => {
    const pct = pctDesdeTuyo(22000, 20, 1500);
    expect(pct).toBeCloseTo(1.46, 2);
    expect(tuyoDesdePct(22000, 20, pct)).toBeLessThanOrEqual(1501);
  });
  it('bordes', () => {
    expect(tuyoDesdePct(0, 20, 10)).toBe(0);
    expect(tuyoDesdePct(6000, 20, 0)).toBe(0);
    expect(pctDesdeTuyo(6000, 20, 0)).toBe(0);
    expect(pctDesdeTuyo(6000, 20, 6000)).toBeNull();
    expect(pctDesdeTuyo(6000, 20, 7000)).toBeNull();
    expect(pctDesdeTuyo(0, 20, 100)).toBeNull();
    expect(pctDesdeTuyo(6000, 0, 100)).toBeNull();
  });
});

describe('cuotasVencidas / resumenAtrasadosComision', () => {
  const hoy = new Date('2026-09-11T12:00:00');
  const p = {
    id: 'p1', clienteId: 'c1', ruta: 'A', tasa: 20, tasa_comision: 2,
    cuotas: [
      { numero: 1, monto: 22000, estado: 'pendiente', fecha: '2026-09-01' },
      { numero: 2, monto: 22000, estado: 'pendiente', fecha: '2026-09-11' },
      { numero: 3, monto: 22000, estado: 'pendiente', fecha: '2026-09-20' },
      { numero: 4, monto: 22000, estado: 'pagada', fecha: '2026-08-01' },
    ],
  };
  it('pendientes con fecha <= hoy (igual que Atrasados)', () => {
    const items = cuotasVencidas([p], hoy);
    expect(items).toHaveLength(2);
    expect(items[0].cuota.numero).toBe(1);
    expect(items[0].diasAtraso).toBe(10);
    expect(items[0].base).toBe(22000);
    expect(items[0].tuyo).toBe(2000);
    expect(items[0].total).toBe(24000);
    expect(items[1].cuota.numero).toBe(2);
  });
  it('sin comisión -> tuyo 0 pero se lista', () => {
    const items = cuotasVencidas([{ ...p, tasa_comision: null }], hoy);
    expect(items).toHaveLength(2);
    expect(items[0].tuyo).toBe(0);
    expect(items[0].total).toBe(22000);
  });
  it('ordena por días desc y suma totales', () => {
    const p2 = {
      id: 'p2', tasa: 10, tasa_comision: null,
      cuotas: [{ numero: 1, monto: 10000, estado: 'pendiente', fecha: '2026-09-05' }],
    };
    const r = resumenAtrasadosComision([p, p2], hoy);
    expect(r.cantidad).toBe(3);
    expect(r.items[0].diasAtraso).toBe(10);
    expect(r.base).toBe(54000);
    expect(r.tuyo).toBe(4000);
    expect(r.total).toBe(58000);
  });
  it('vacío -> ceros', () => {
    expect(resumenAtrasadosComision([], hoy)).toMatchObject({ cantidad: 0, base: 0, tuyo: 0, total: 0 });
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
  it('abono parcial no acredita comisión', () => {
    const r = resumenComisiones({
      prestamos: [p1],
      cobros: [{ prestamo_id: 'p1', cuota_numero: 1, interes_pagado: 11000 }],
    });
    expect(r.cobrada).toBe(0);
    expect(r.acreedorCobrada).toBe(10000);
    // Cuota 1 incompleta (total pendiente) + cuota 2 pendiente.
    expect(r.porCobrar).toBe(4000);
    expect(r.porPrestamo[0].pendientes).toBe(2);
  });
  it('dos abonos que completan acreditan todo', () => {
    const r = resumenComisiones({
      prestamos: [p1],
      cobros: [
        { prestamo_id: 'p1', cuota_numero: 1, interes_pagado: 11000 },
        { prestamo_id: 'p1', cuota_numero: 1, interes_pagado: 11000 },
      ],
    });
    expect(r.cobrada).toBe(2000);
    expect(r.acreedorCobrada).toBe(20000);
    expect(r.porCobrar).toBe(2000);
  });
  it('vacío -> ceros', () => {
    expect(resumenComisiones({})).toMatchObject({ cobrada: 0, porCobrar: 0, total: 0 });
  });
});
