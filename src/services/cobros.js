import { get, set, STORAGE_KEYS } from './storage';
import { startOfDay, endOfDay } from '../lib/format';
import { uid } from '../lib/id';
import { emitDataChanged } from '../lib/events';

function emitChange() {
  emitDataChanged();
}

export function list() {
  return get(STORAGE_KEYS.cobros, []);
}

export function getById(id) {
  return list().find((c) => c.id === id) || null;
}

export function delDia() {
  const inicio = startOfDay(new Date()).getTime();
  const fin = endOfDay(new Date()).getTime();
  return list().filter((c) => {
    const t = new Date(c.fecha).getTime();
    return t >= inicio && t <= fin;
  });
}

export function totalDelDia() {
  return delDia().reduce((s, c) => s + c.monto, 0);
}

export function recientes(limit = 8) {
  return [...list()]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, limit);
}

export function resumen() {
  const cobros = list();
  const totalCobrado = cobros.reduce((s, c) => s + c.monto, 0);
  return {
    cantidad: cobros.length,
    totalCobrado,
    totalDelDia: totalDelDia(),
    cantidadDelDia: delDia().length,
  };
}

export function delPrestamo(prestamoId) {
  return list().filter((c) => c.prestamoId === prestamoId);
}

export class PrestamoNoEncontradoError extends Error {
  constructor(prestamoId) {
    super(`Préstamo ${prestamoId} no encontrado`);
    this.name = 'PrestamoNoEncontradoError';
    this.prestamoId = prestamoId;
  }
}

export class CuotaInvalidaError extends Error {
  constructor(cuotaNumero, motivo) {
    super(`Cuota #${cuotaNumero}: ${motivo}`);
    this.name = 'CuotaInvalidaError';
    this.cuotaNumero = cuotaNumero;
  }
}

export class MontoInvalidoError extends Error {
  constructor(motivo) {
    super(motivo);
    this.name = 'MontoInvalidoError';
  }
}

export class InteresesAtrasadosError extends Error {
  constructor(cuotasAtrasadas) {
    super(
      `Tenés ${cuotasAtrasadas.length} interés(es) atrasado(s). Pagalos antes de abonar a capital.`,
    );
    this.name = 'InteresesAtrasadosError';
    this.cuotasAtrasadas = cuotasAtrasadas;
  }
}

export class CuotasAgotadasError extends Error {
  constructor(saldoPendiente) {
    super(
      'Las cuotas del préstamo están agotadas pero queda saldo pendiente. Extendé las cuotas antes de hacer un abono a capital.',
    );
    this.name = 'CuotasAgotadasError';
    this.saldoPendiente = saldoPendiente;
  }
}

import * as prestamosService from './prestamos';

export function create({ prestamoId, cuotaNumero, monto, tipo, incluirInteres = false, cobradorId, nota }) {
  const prestamos = prestamosService.list();
  const idx = prestamos.findIndex((p) => p.id === prestamoId);
  if (idx === -1) throw new PrestamoNoEncontradoError(prestamoId);
  const prestamo = prestamos[idx];

  if (prestamo.saldoCapital == null) {
    prestamo.saldoCapital = prestamo.monto;
  }

  const cuotaActual = prestamo.cuotas.find((c) => c.numero === Number(cuotaNumero));
  if (!cuotaActual) throw new CuotaInvalidaError(cuotaNumero, 'no existe');

  const cobroMonto = Number(monto);
  if (!Number.isFinite(cobroMonto) || cobroMonto <= 0) {
    throw new MontoInvalidoError('El monto debe ser mayor a 0');
  }

  const interesActual = cuotaActual.monto;
  const saldoActual = prestamo.saldoCapital ?? prestamo.monto;
  const ahora = new Date().toISOString();

  let capitalPagado = 0;
  let interesPagado = 0;
  let afectaCuota = false;
  let afectaSaldo = false;

  if (tipo === 'interes') {
    if (cuotaActual.estado !== 'pendiente') {
      throw new CuotaInvalidaError(cuotaNumero, `estado ${cuotaActual.estado}`);
    }
    interesPagado = cobroMonto;
    afectaCuota = true;
  } else if (tipo === 'capital') {
    if (saldoActual <= 0) {
      throw new MontoInvalidoError('El préstamo ya no tiene saldo');
    }

    if (prestamosService.cuotasAgotadas(prestamo)) {
      throw new CuotasAgotadasError(saldoActual);
    }

    const hoy = startOfDay(new Date());
    const todasAtrasadas = prestamo.cuotas.filter(
      (c) => c.estado === 'pendiente' && new Date(c.fecha) < hoy,
    );
    const otrasAtrasadas = incluirInteres
      ? todasAtrasadas.filter((c) => c.numero !== Number(cuotaNumero))
      : todasAtrasadas;
    if (otrasAtrasadas.length > 0) {
      throw new InteresesAtrasadosError(otrasAtrasadas);
    }
    let capitalDelCobro;
    if (incluirInteres) {
      capitalDelCobro = cobroMonto - interesActual;
      if (capitalDelCobro < 0) {
        capitalDelCobro = 0;
        interesPagado = cobroMonto;
      } else {
        interesPagado = interesActual;
        capitalPagado = capitalDelCobro;
      }
    } else {
      capitalDelCobro = cobroMonto;
      capitalPagado = capitalDelCobro;
    }

    const maxCapital = saldoActual + (incluirInteres ? interesActual : 0);
    if (cobroMonto > maxCapital) {
      throw new MontoInvalidoError(
        `El máximo a cobrar es ${maxCapital.toLocaleString('es-CR')} (saldo ${saldoActual.toLocaleString('es-CR')}${incluirInteres ? ' + interés ' + interesActual.toLocaleString('es-CR') : ''})`,
      );
    }

    if (capitalPagado > 0) afectaSaldo = true;
    if (interesPagado > 0 && cuotaActual.estado === 'pendiente') afectaCuota = true;
  } else {
    throw new MontoInvalidoError('Tipo de cobro inválido');
  }

  const nuevoSaldo = afectaSaldo ? Math.max(0, saldoActual - capitalPagado) : saldoActual;

  const cobro = {
    id: uid('cob'),
    prestamoId,
    clienteId: prestamo.clienteId,
    cuotaNumero: Number(cuotaNumero),
    monto: cobroMonto,
    tipo,
    incluirInteres: Boolean(incluirInteres),
    capitalPagado,
    interesPagado,
    fecha: ahora,
    cobradorId: cobradorId || null,
    nota: nota ? String(nota).slice(0, 200) : null,
  };

  const cobrosAll = list();
  cobrosAll.push(cobro);
  set(STORAGE_KEYS.cobros, cobrosAll);

  if (afectaCuota) {
    cuotaActual.estado = 'pagada';
    cuotaActual.pagadaEn = ahora;
    cuotaActual.cobroId = cobro.id;
  }

  if (afectaSaldo) {
    prestamo.saldoCapital = nuevoSaldo;
    const nuevoMonto = Math.round((nuevoSaldo * Number(prestamo.tasa)) / 100);
    for (const c of prestamo.cuotas) {
      if (c.numero >= cuotaActual.numero && c.estado === 'pendiente') {
        c.monto = nuevoMonto;
      }
    }
    if (nuevoSaldo === 0) {
      prestamo.estado = 'cancelado';
      for (const c of prestamo.cuotas) {
        if (c.estado === 'pendiente') c.estado = 'cancelada';
      }
    }
  }

  prestamos[idx] = prestamo;
  set(STORAGE_KEYS.prestamos, prestamos);
  emitChange();
  return cobro;
}