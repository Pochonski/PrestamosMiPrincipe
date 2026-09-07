import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../services/prestamos', () => ({ listAll: vi.fn() }));
vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));
vi.mock('../../../services/cobros', () => ({ listAll: vi.fn() }));

import {
  agruparPorCliente,
  cobrosDelMes,
  filterGrupos,
  getMonthBounds,
  monthKeyOf,
  shiftMonth,
  sortGrupos,
  splitCapitalInteres,
  totalesMes,
  validarConciliacion,
} from '../selectors';

function cobro(overrides = {}) {
  return {
    id: overrides.id || `cob-${overrides.cuota_numero ?? 1}-${overrides.cliente_id ?? 'c1'}`,
    prestamo_id: 'p1',
    cliente_id: 'c1',
    cuota_numero: 1,
    monto: 10000,
    tipo: 'interes',
    capital_pagado: 0,
    interes_pagado: 10000,
    fecha: '2026-09-05T10:00:00.000Z',
    nota: null,
    ...overrides,
  };
}

const clientes = [
  { id: 'c1', nombre: 'Ana Gómez', cedula: '1-0001-0001', telefono: '8888-0001' },
  { id: 'c2', nombre: 'Luis Pérez', cedula: '2-0002-0002', telefono: '8888-0002' },
];
const prestamos = [
  { id: 'p1', ruta: 'Ruta A' },
  { id: 'p2', ruta: 'Ruta B' },
];

describe('month helpers', () => {
  it('monthKeyOf y bounds', () => {
    expect(monthKeyOf(new Date(2026, 8, 15))).toBe('2026-09');
    const b = getMonthBounds('2026-09');
    expect(b.start.getDate()).toBe(1);
    expect(b.end.getDate()).toBe(30);
    expect(b.label).toMatch(/setiembre|septiembre/i);
  });

  it('shiftMonth cruza años', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('cobrosDelMes filtra por mes calendario (fecha local)', () => {
    const list = [
      cobro({ fecha: '2026-08-31T16:00:00.000Z' }),
      cobro({ fecha: '2026-09-01T16:00:00.000Z' }),
      cobro({ fecha: '2026-09-30T16:00:00.000Z' }),
    ];
    expect(cobrosDelMes(list, '2026-09')).toHaveLength(2);
  });
});

describe('splitCapitalInteres', () => {
  it('usa campos explícitos', () => {
    expect(splitCapitalInteres(cobro({ capital_pagado: 4000, interes_pagado: 6000 }))).toEqual({
      capital: 4000,
      interes: 6000,
    });
  });

  it('fallback por tipo cuando no hay detalle', () => {
    expect(splitCapitalInteres({ monto: 5000, tipo: 'capital' })).toEqual({ capital: 5000, interes: 0 });
    expect(splitCapitalInteres({ monto: 5000, tipo: 'interes' })).toEqual({ capital: 0, interes: 5000 });
  });
});

describe('agruparPorCliente', () => {
  it('agrega totales, ruta y ordena cobros desc', () => {
    const list = [
      cobro({ id: 'a', fecha: '2026-09-01T10:00:00.000Z', monto: 10000 }),
      cobro({ id: 'b', fecha: '2026-09-10T10:00:00.000Z', monto: 5000, capital_pagado: 5000, interes_pagado: 0, tipo: 'capital', prestamo_id: 'p2' }),
      cobro({ id: 'c', cliente_id: 'c2', fecha: '2026-09-03T10:00:00.000Z', monto: 8000 }),
    ];
    const grupos = agruparPorCliente(list, clientes, prestamos);
    expect(grupos).toHaveLength(2);
    const ana = grupos.find((g) => g.clienteId === 'c1');
    expect(ana.total).toBe(15000);
    expect(ana.capital).toBe(5000);
    expect(ana.interes).toBe(10000);
    expect(ana.count).toBe(2);
    expect(ana.cobros[0].id).toBe('b');
    expect(ana.cobros[0].ruta).toBe('Ruta B');
    expect(ana.cliente.nombre).toBe('Ana Gómez');
  });
});

describe('filterGrupos y sortGrupos', () => {
  const grupos = agruparPorCliente(
    [
      cobro({ cliente_id: 'c1', monto: 10000, prestamo_id: 'p1' }),
      cobro({ cliente_id: 'c1', monto: 5000, tipo: 'capital', capital_pagado: 5000, interes_pagado: 0, prestamo_id: 'p1' }),
      cobro({ cliente_id: 'c2', monto: 8000, prestamo_id: 'p2' }),
    ],
    clientes,
    prestamos,
  );

  it('filtra por búsqueda', () => {
    expect(filterGrupos(grupos, { q: 'luis' })).toHaveLength(1);
  });

  it('filtra por ruta y retotaliza', () => {
    const r = filterGrupos(grupos, { ruta: 'Ruta B' });
    expect(r).toHaveLength(1);
    expect(r[0].total).toBe(8000);
  });

  it('filtra por tipo y retotaliza', () => {
    const r = filterGrupos(grupos, { tipo: 'capital' });
    expect(r).toHaveLength(1);
    expect(r[0].total).toBe(5000);
    expect(r[0].capital).toBe(5000);
  });

  it('ordena por total y por nombre', () => {
    expect(sortGrupos(grupos, 'total')[0].clienteId).toBe('c1');
    expect(sortGrupos(grupos, 'nombre')[0].cliente.nombre).toBe('Ana Gómez');
  });
});

describe('totalesMes y validarConciliacion', () => {
  it('totales suman capital e interés', () => {
    const t = totalesMes([
      cobro({ monto: 10000 }),
      cobro({ monto: 5000, tipo: 'capital', capital_pagado: 5000, interes_pagado: 0 }),
    ]);
    expect(t).toMatchObject({ total: 15000, capital: 5000, interes: 10000, count: 2 });
  });

  it('conciliación ok cuando todo cuadra', () => {
    const list = [cobro({ fecha: '2026-09-05T10:00:00.000Z' })];
    const grupos = agruparPorCliente(list, clientes, prestamos);
    const v = validarConciliacion({ cobros: list, grupos, monthKey: '2026-09' });
    expect(v.ok).toBe(true);
    expect(v.checks).toHaveLength(3);
  });

  it('detecta descuadre en suma por cliente', () => {
    const list = [cobro({ fecha: '2026-09-05T10:00:00.000Z', monto: 10000 })];
    const grupos = [{ total: 5000 }];
    const v = validarConciliacion({ cobros: list, grupos, monthKey: '2026-09' });
    expect(v.ok).toBe(false);
    expect(v.checks.find((c) => c.id === 'suma-clientes').ok).toBe(false);
  });

  it('detecta cobros fuera del mes', () => {
    const list = [cobro({ fecha: '2026-08-15T10:00:00.000Z' })];
    const grupos = agruparPorCliente(list, clientes, prestamos);
    const v = validarConciliacion({ cobros: list, grupos, monthKey: '2026-09' });
    expect(v.checks.find((c) => c.id === 'rango-mes').ok).toBe(false);
  });
});
