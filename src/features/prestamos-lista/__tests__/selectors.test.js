import { describe, it, expect } from 'vitest';
import {
  countByTab,
  enrichPrestamo,
  extractRutas,
  filterPrestamos,
  getResumenPrestamos,
  sortPrestamos,
} from '../selectors';
import { makeCliente, makeCuota, makePrestamo } from '../../../test/factories/prestamo';

const PAST = '2000-01-01';
const FUTURE = '2099-01-01';

function rowVigente() {
  const p = makePrestamo({
    id: 'p-vig',
    ruta: 'Ruta A',
    monto: 100000,
    saldo_capital: 80000,
    tasa: 10,
    periodo: { tipo: 'semanal' },
    cuotas: [
      makeCuota({ prestamo_id: 'p-vig', numero: 1, fecha: FUTURE, monto: 8000, estado: 'pagada' }),
      makeCuota({ prestamo_id: 'p-vig', numero: 2, fecha: FUTURE, monto: 8000, estado: 'pendiente' }),
    ],
  });
  return enrichPrestamo(p, makeCliente({ id: 'cli-1', nombre: 'Ana Gómez' }));
}

function rowAtrasado() {
  const p = makePrestamo({
    id: 'p-atr',
    ruta: 'Ruta B',
    monto: 200000,
    saldo_capital: 200000,
    tasa: 10,
    periodo: { tipo: 'mensual' },
    cuotas: [makeCuota({ prestamo_id: 'p-atr', numero: 1, fecha: PAST, monto: 20000, estado: 'pendiente' })],
  });
  return enrichPrestamo(p, makeCliente({ id: 'cli-2', nombre: 'Luis Pérez', cedula: '2-0002-0002' }));
}

function rowCancelado() {
  const p = makePrestamo({
    id: 'p-can',
    ruta: 'Ruta A',
    estado: 'cancelado',
    monto: 50000,
    saldo_capital: 0,
    cuotas: [makeCuota({ prestamo_id: 'p-can', numero: 1, fecha: PAST, monto: 5000, estado: 'pagada' })],
  });
  return enrichPrestamo(p, makeCliente({ id: 'cli-3', nombre: 'María Ruiz' }));
}

describe('prestamos-lista selectors', () => {
  it('enrich clasifica vigente/atrasado/cancelado con cuota y próxima fecha', () => {
    const vig = rowVigente();
    expect(vig.status).toBe('vigente');
    expect(vig.cuotaMonto).toBe(8000);
    expect(vig.proxima?.numero).toBe(2);
    expect(vig.pagadas).toBe(1);
    expect(vig.totalCuotas).toBe(2);

    const atr = rowAtrasado();
    expect(atr.status).toBe('atrasado');
    expect(atr.vencidas).toBe(1);
    expect(atr.totalVencido).toBe(20000);
    expect(atr.diasAtraso).toBeGreaterThan(0);

    expect(rowCancelado().status).toBe('cancelado');
  });

  it('countByTab cuenta activos = vigente + atrasado', () => {
    const counts = countByTab([rowVigente(), rowAtrasado(), rowCancelado()]);
    expect(counts).toMatchObject({ todos: 3, activos: 2, vigente: 1, atrasado: 1, cancelado: 1 });
  });

  it('filter por tab, ruta, periodo y búsqueda', () => {
    const rows = [rowVigente(), rowAtrasado(), rowCancelado()];
    expect(filterPrestamos(rows, { tab: 'activos' })).toHaveLength(2);
    expect(filterPrestamos(rows, { tab: 'vigente' })).toHaveLength(1);
    expect(filterPrestamos(rows, { tab: 'todos', ruta: 'Ruta A' })).toHaveLength(2);
    expect(filterPrestamos(rows, { tab: 'todos', periodo: 'mensual' })).toHaveLength(1);
    expect(filterPrestamos(rows, { tab: 'todos', q: 'luis' })).toHaveLength(1);
    expect(filterPrestamos(rows, { tab: 'todos', q: '2-0002' })).toHaveLength(1);
  });

  it('sort por atraso pone primero al más atrasado', () => {
    const sorted = sortPrestamos([rowVigente(), rowAtrasado()], 'atraso');
    expect(sorted[0].prestamoId).toBe('p-atr');
  });

  it('extractRutas ordena rutas únicas', () => {
    expect(extractRutas([rowVigente(), rowAtrasado(), rowCancelado()])).toEqual(['Ruta A', 'Ruta B']);
  });

  it('resumen agrega cartera, vencido y próxima cobranza', () => {
    const resumen = getResumenPrestamos([rowVigente(), rowAtrasado(), rowCancelado()]);
    expect(resumen.carteraActiva).toBe(280000);
    expect(resumen.totalVencido).toBe(20000);
    expect(resumen.proximaCobranza).toBe(28000);
  });
});
