import { describe, it, expect } from 'vitest';
import { enrichPrestamos, sortPrestamos } from '../selectors';
import { makeCliente, makeCuota, makePrestamo } from '../../../test/factories/prestamo';

const PAST = '2000-01-05';
const FUTURE = '2099-06-01';

function prestamo(id, cuotas) {
  return makePrestamo({
    id,
    ruta: 'Ruta A',
    monto: 100000,
    saldo_capital: 80000,
    tasa: 10,
    periodo: { tipo: 'semanal' },
    cuotas,
  });
}

describe('enrichPrestamos', () => {
  it('une cliente por clienteId y null si no existe', () => {
    const p1 = prestamo('p1', [makeCuota({ numero: 1, fecha: FUTURE, estado: 'pendiente' })]);
    const p2 = prestamo('p2', [makeCuota({ numero: 1, fecha: FUTURE, estado: 'pendiente' })]);
    p1.clienteId = 'c1';
    p2.clienteId = 'perdido';
    const rows = enrichPrestamos([p1, p2], [makeCliente({ id: 'c1', nombre: 'Ana' })]);
    expect(rows).toHaveLength(2);
    expect(rows[0].cliente?.nombre).toBe('Ana');
    expect(rows[1].cliente).toBeNull();
  });
  it('nulls -> []', () => {
    expect(enrichPrestamos(null, null)).toEqual([]);
    expect(enrichPrestamos([], [])).toEqual([]);
  });
});

describe('sortPrestamos', () => {
  function row(id, { diasAtraso = 0, saldo = 0, cuotaMonto = 0, monto = 0, proxima = null } = {}) {
    return { prestamoId: id, diasAtraso, saldo, cuotaMonto, prestamo: { monto }, proxima: proxima ? { fecha: proxima } : null };
  }
  const rows = [
    row('a', { diasAtraso: 1, saldo: 500, cuotaMonto: 50, monto: 1000, proxima: FUTURE }),
    row('b', { diasAtraso: 5, saldo: 100, cuotaMonto: 300, monto: 5000 }),
    row('c', { diasAtraso: 5, saldo: 900, cuotaMonto: 10, monto: 2000, proxima: PAST }),
  ];
  it('atraso con desempate por próxima (sin fecha al final)', () => {
    expect(sortPrestamos(rows, 'atraso').map((r) => r.prestamoId)).toEqual(['c', 'b', 'a']);
  });
  it('saldo desc', () => {
    expect(sortPrestamos(rows, 'saldo').map((r) => r.prestamoId)).toEqual(['c', 'a', 'b']);
  });
  it('cuota desc', () => {
    expect(sortPrestamos(rows, 'cuota').map((r) => r.prestamoId)).toEqual(['b', 'a', 'c']);
  });
  it('monto desc', () => {
    expect(sortPrestamos(rows, 'monto').map((r) => r.prestamoId)).toEqual(['b', 'c', 'a']);
  });
  it('proximo por defecto y con sort desconocido', () => {
    expect(sortPrestamos(rows).map((r) => r.prestamoId)).toEqual(['c', 'a', 'b']);
    expect(sortPrestamos(rows, 'raro').map((r) => r.prestamoId)).toEqual(['c', 'a', 'b']);
  });
  it('null -> []', () => expect(sortPrestamos(null)).toEqual([]));
});
