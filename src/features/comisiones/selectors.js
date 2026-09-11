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

function numeroCuotaCobro(c) {
  if (!c || typeof c !== 'object') return null;
  const n = c.cuota_numero ?? c.cuotaNumero;
  if (n == null || n === '') return null;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

/**
 * Suma interes_pagado por número de cuota para un préstamo.
 * Devuelve Map<numeroCuota, totalPagado>.
 */
export function interesPagadoPorCuota(cobros = [], prestamoId) {
  const map = new Map();
  for (const c of cobros || []) {
    if ((c.prestamo_id ?? c.prestamoId) !== prestamoId) continue;
    const n = numeroCuotaCobro(c);
    if (n == null) continue;
    const interes = interesDeCobro(c);
    if (interes <= 0) continue;
    map.set(n, (map.get(n) ?? 0) + interes);
  }
  return map;
}

/**
 * Estado de la comisión de una cuota (regla: solo se acredita al completar
 * el interés de la cuota; los abonos parciales no liberan nada).
 * Devuelve { completa, cobrada, porCobrar }.
 */
export function estadoComisionCuota(prestamo, cuota, interesPagado = 0) {
  const esperado = Number(cuota?.monto || 0);
  const pagado = Number(interesPagado || 0);
  if (!tieneComision(prestamo) || esperado <= 0) {
    return { completa: true, cobrada: 0, porCobrar: 0 };
  }
  if (pagado >= esperado) {
    return { completa: true, cobrada: comisionDeInteres(pagado, prestamo), porCobrar: 0 };
  }
  return { completa: false, cobrada: 0, porCobrar: comisionDeInteres(esperado, prestamo) };
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

export function validateTasaComision(v, tasaBase) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 'La tasa no puede ser negativa';
  if (n > 100) return 'La tasa parece muy alta';
  const base = Number(tasaBase);
  if (Number.isFinite(base) && base >= 0 && base + n > 100) {
    return 'La suma de tasas no puede superar 100%';
  }
  return null;
}

/**
 * Derivación % <-> monto contra la cuota de referencia (solo UI).
 * tuyo = cuota * pct / (base + pct); pct = base * tuyo / (cuota - tuyo).
 */
export function tuyoDesdePct(cuotaMonto, tasaBase, pct) {
  const c = Number(cuotaMonto || 0);
  const b = Number(tasaBase || 0);
  const p = Number(pct || 0);
  if (c <= 0 || p <= 0) return 0;
  const total = b + p;
  if (total <= 0) return 0;
  return Math.round((c * p) / total);
}

export function pctDesdeTuyo(cuotaMonto, tasaBase, tuyo) {
  const c = Number(cuotaMonto || 0);
  const b = Number(tasaBase || 0);
  const t = Number(tuyo || 0);
  if (!t) return 0;
  if (c <= 0 || b <= 0 || t >= c) return null;
  return Math.round(((b * t) / (c - t)) * 100) / 100;
}

export function resumenComisiones({ prestamos = [], cobros = [] } = {}) {
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
  const cobrosPorPrestamo = new Map();
  for (const c of cobros || []) {
    const pid = c.prestamo_id ?? c.prestamoId;
    if (!cobrosPorPrestamo.has(pid)) cobrosPorPrestamo.set(pid, []);
    cobrosPorPrestamo.get(pid).push(c);
  }

  for (const p of prestamos || []) {
    if (!tieneComision(p)) continue;
    const row = rowFor(p);
    const deEste = cobrosPorPrestamo.get(p.id) || [];
    const numeros = new Set((p.cuotas || []).map((q) => Number(q.numero)));

    // Interés pagado por cuota + bolsa de legados (cobros sin cuota o con
    // cuota inexistente) que se asigna a las cuotas más antiguas primero.
    const pagadoPorCuota = interesPagadoPorCuota(deEste, p.id);
    let bolsa = 0;
    for (const c of deEste) {
      const n = numeroCuotaCobro(c);
      if (n == null || !numeros.has(n)) bolsa += interesDeCobro(c);
    }

    // Regla por cuota: la comisión se acredita solo al completar el interés.
    const ordenadas = [...(p.cuotas || [])].sort((a, b) => Number(a.numero) - Number(b.numero));
    for (const q of ordenadas) {
      const esperado = Number(q.monto || 0);
      let pagado = pagadoPorCuota.get(Number(q.numero)) ?? 0;
      if (bolsa > 0 && pagado < esperado) {
        const toma = Math.min(bolsa, esperado - pagado);
        pagado += toma;
        bolsa -= toma;
      }
      if (pagado > 0) {
        // El interés pagado siempre suma al acreedor (split por diferencia).
        const comPagado = comisionDeInteres(pagado, p);
        acreedorCobrada += pagado - comPagado;
        row.acreedorCobrada += pagado - comPagado;
      }
      const est = estadoComisionCuota(p, q, pagado);
      cobrada += est.cobrada;
      row.cobrada += est.cobrada;
      if (!est.completa) {
        row.porCobrar += est.porCobrar;
        row.pendientes += 1;
      }
    }

    // Sobrante de legados más allá de todas las cuotas: proporcional anterior.
    if (bolsa > 0) {
      const com = comisionDeInteres(bolsa, p);
      cobrada += com;
      acreedorCobrada += bolsa - com;
      row.cobrada += com;
      row.acreedorCobrada += bolsa - com;
    }
  }

  let porCobrar = 0;
  for (const row of perLoan.values()) porCobrar += row.porCobrar;

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

/**
 * Cuotas vencidas (pendientes con fecha < hoy) con tu parte incluida.
 * Devuelve [{ prestamo, cuota, diasAtraso, base, tuyo, total }] ordenado
 * por días de atraso descendente. Sin comisión -> tuyo 0 (igual se lista).
 */
export function cuotasVencidas(prestamos = [], hoy = new Date()) {
  const ref = new Date(hoy);
  ref.setHours(0, 0, 0, 0);
  const out = [];
  for (const p of prestamos || []) {
    for (const q of p.cuotas || []) {
      if (q.estado !== 'pendiente') continue;
      if (!(new Date(q.fecha) < ref)) continue;
      const diffMs = ref.getTime() - new Date(q.fecha).getTime();
      const diasAtraso = Math.floor(diffMs / 86400000);
      const base = Number(q.monto || 0);
      const tuyo = tieneComision(p) ? comisionDeInteres(base, p) : 0;
      out.push({ prestamo: p, cuota: q, diasAtraso, base, tuyo, total: base + tuyo });
    }
  }
  out.sort((a, b) => b.diasAtraso - a.diasAtraso);
  return out;
}

export function resumenAtrasadosComision(prestamos = [], hoy = new Date()) {
  const items = cuotasVencidas(prestamos, hoy);
  return {
    cantidad: items.length,
    base: items.reduce((s, x) => s + x.base, 0),
    tuyo: items.reduce((s, x) => s + x.tuyo, 0),
    total: items.reduce((s, x) => s + x.total, 0),
    items,
  };
}
