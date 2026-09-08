/**
 * Selectores puros de comisiones (modelo aditivo).
 * El cliente paga tasa base (acreedor) + comisión; la comisión es solo
 * sobre intereses. tasa_comision ausente o 0 = sin comisión.
 */

export function tasaBase(prestamo) {
  return Number(prestamo?.tasa ?? 0);
}

export function tasaComision(prestamo) {
  const v = prestamo?.tasa_comision;
  if (v == null || v === '') return 0;
  return Number(v);
}

export function tasaTotal(prestamo) {
  return tasaBase(prestamo) + tasaComision(prestamo);
}

export function tieneComision(prestamo) {
  return tasaComision(prestamo) > 0;
}

export function comisionDeInteres(interesPagado, prestamo) {
  const interes = Number(interesPagado || 0);
  if (interes <= 0) return 0;
  const total = tasaTotal(prestamo);
  const com = tasaComision(prestamo);
  if (com <= 0 || total <= 0) return 0;
  return Math.round((interes * com) / total);
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
  return comisionDeInteres(cuota.monto, prestamo);
}

// Mantenido por compatibilidad: fracción de la cuota que es comisión.
export function spreadRatio(prestamo) {
  const total = tasaTotal(prestamo);
  if (total <= 0) return 0;
  return tasaComision(prestamo) / total;
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
        tasaBase: tasaBase(prestamo),
        tasaComision: tasaComision(prestamo),
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
