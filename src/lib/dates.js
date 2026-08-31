export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d, n) {
  const original = new Date(d);
  const r = new Date(original);
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(original.getDate(), lastDay));
  return r;
}

export function nextCuotaDate(prev, periodo) {
  switch (periodo.tipo) {
    case 'diario':
      return addDays(prev, 1);
    case 'semanal':
      return addDays(prev, 7);
    case 'quincenal':
      return addDays(prev, 14);
    case 'mensual':
    case 'dia_mes':
      return addMonths(prev, 1);
    default:
      return addMonths(prev, 1);
  }
}

export function firstCuotaDate(fechaInicio, periodo) {
  const base = new Date(fechaInicio);
  switch (periodo.tipo) {
    case 'diario':
      return addDays(base, 1);
    case 'semanal':
      return addDays(base, 7);
    case 'quincenal':
      return addDays(base, 14);
    case 'mensual':
      return addMonths(base, 1);
    case 'dia_mes': {
      const target = Number(periodo.diaDelMes);
      if (Number.isNaN(target)) return addMonths(base, 1);
      const baseDay = base.getDate();
      if (baseDay < target) {
        const r = new Date(base);
        r.setDate(target);
        return r;
      }
      if (baseDay > target) {
        const r = addMonths(base, 1);
        const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
        r.setDate(Math.min(target, lastDay));
        return r;
      }
      return base;
    }
    default:
      return addMonths(base, 1);
  }
}

export function buildCuotas(fechaInicio, periodo, nCuotas, montoPorCuota) {
  const out = [];
  let cursor = firstCuotaDate(fechaInicio, periodo);
  for (let i = 0; i < Number(nCuotas); i++) {
    out.push({
      numero: i + 1,
      fecha: new Date(cursor),
      monto: montoPorCuota,
    });
    cursor = nextCuotaDate(cursor, periodo);
  }
  return out;
}