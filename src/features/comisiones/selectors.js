/**
 * Selectores puros de comisiones.
 * El cliente paga tasa_cliente; la diferencia con tasa_acreedor es la comisión
 * del cobrador, solo sobre intereses. tasa_acreedor null = sin comisión.
 */

export function spreadRatio(prestamo) {
  if (!prestamo) return 0;
  const tasaCliente = Number(prestamo.tasa ?? 0);
  const tasaAcreedor =
    prestamo.tasa_acreedor == null || prestamo.tasa_acreedor === ''
      ? null
      : Number(prestamo.tasa_acreedor);
  if (tasaAcreedor == null) return 0;
  if (!(tasaCliente > 0)) return 0;
  if (tasaAcreedor >= tasaCliente) return 0;
  if (tasaAcreedor <= 0) return 1;
  return (tasaCliente - tasaAcreedor) / tasaCliente;
}

export function tieneComision(prestamo) {
  return prestamo?.tasa_acreedor != null && prestamo?.tasa_acreedor !== '';
}

export function comisionDeInteres(interesPagado, prestamo) {
  const interes = Number(interesPagado || 0);
  if (interes <= 0) return 0;
  return Math.round(interes * spreadRatio(prestamo));
}

function interesDeCobro(c) {
  if (!c || typeof c !== 'object') return 0;
  return Number(c.interes_pagado ?? c.interesPagado ?? 0);
}

export function comisionCobro(cobro, prestamo) {
  return comisionDeInteres(interesDeCobro(cobro), prestamo);
}

export function comisionCuotaPendiente(cuota, prestamo) {
  if (!cuota || cuota.estado !== 'pendiente') return 0;
  return Math.round(Number(cuota.monto || 0) * spreadRatio(prestamo));
}

export function resumenComisiones({ prestamos = [], cobros = [] } = {}) {
  const porPrestamoId = new Map((prestamos || []).map((p) => [p.id, p]));
  const perLoan = new Map();

  function rowFor(prestamo) {
    if (!perLoan.has(prestamo.id)) {
      perLoan.set(prestamo.id, {
        prestamoId: prestamo.id,
        clienteId: prestamo.clienteId ?? prestamo.cliente_id,
        ruta: prestamo.ruta,
        monto: Number(prestamo.monto || 0),
        tasaCliente: Number(prestamo.tasa ?? 0),
        tasaAcreedor: Number(prestamo.tasa_acreedor ?? 0),
        cobrada: 0,
        acreedorCobrada: 0,
        porCobrar: 0,
        pendientes: 0,
      });
    }
    return perLoan.get(prestamo.id);
  }

  let cobrada = 0;
  let acreedorCobrada = 0;
  for (const c of cobros || []) {
    const p = porPrestamoId.get(c.prestamo_id ?? c.prestamoId);
    if (!p || !tieneComision(p)) continue;
    const interes = interesDeCobro(c);
    if (interes <= 0) continue;
    const com = comisionDeInteres(interes, p);
    cobrada += com;
    acreedorCobrada += interes - com;
    rowFor(p).cobrada += com;
    rowFor(p).acreedorCobrada += interes - com;
  }

  let porCobrar = 0;
  for (const p of prestamos || []) {
    if (!tieneComision(p)) continue;
    const row = rowFor(p);
    for (const q of p.cuotas || []) {
      if (q.estado !== 'pendiente') continue;
      const com = comisionCuotaPendiente(q, p);
      porCobrar += com;
      row.porCobrar += com;
      row.pendientes += 1;
    }
  }

  const porPrestamo = [...perLoan.values()].sort((a, b) => b.porCobrar + b.cobrada - (a.porCobrar + a.cobrada));
  const sinComision = (prestamos || []).filter((p) => !tieneComision(p)).length;

  return {
    cobrada,
    acreedorCobrada,
    porCobrar,
    total: cobrada + porCobrar,
    porPrestamo,
    conComision: perLoan.size,
    sinComision,
  };
}
