import * as cobrosService from '../../services/cobros';
import * as prestamosService from '../../services/prestamos';

export const COBRO_TIPOS = [
  {
    id: 'interes',
    label: 'Pago de interés',
    description: 'Cobra solo el interés del período',
    icon: 'Percent',
  },
  {
    id: 'capital',
    label: 'Abono a capital',
    description: 'Reduce el saldo pendiente',
    icon: 'Wallet',
  },
];

export async function getCuotasPendientes(prestamoId) {
  const prestamo = await prestamosService.getById(prestamoId);
  if (!prestamo) return [];
  return (prestamo.cuotas || []).filter((c) => c.estado === 'pendiente');
}

export async function getCuotaActual(prestamoId) {
  const pendientes = await getCuotasPendientes(prestamoId);
  return pendientes[0] || null;
}

export function getResumenPrestamo(prestamo) {
  if (!prestamo) return null;
  const saldo = prestamosService.getSaldoCapital(prestamo);
  const interes = prestamosService.cuotaDelPeriodo(prestamo);
  const pendientes = (prestamo.cuotas || []).filter((c) => c.estado === 'pendiente');
  const pagadas = (prestamo.cuotas || []).filter((c) => c.estado === 'pagada');
  const canceladas = (prestamo.cuotas || []).filter((c) => c.estado === 'cancelada');
  const totalPagado = pagadas.reduce((s, c) => s + c.monto, 0);
  const proximoCobro = pendientes[0] || null;

  return {
    saldo,
    interes,
    pendientes: pendientes.length,
    pagadas: pagadas.length,
    canceladas: canceladas.length,
    total: prestamo.nCuotas,
    totalPagado,
    proximoCobro,
  };
}

export async function getCobrosDelPrestamo(prestamoId) {
  return cobrosService.delPrestamo(prestamoId);
}

export function getCuotasAtrasadas(prestamo) {
  if (!prestamo) return [];
  // Comparación lexicográfica YYYY-MM-DD: `new Date('YYYY-MM-DD')` parsea
  // como UTC y en CR (UTC-6) marca "atrasada" un día antes. Misma regla que
  // prestamosService.getStatus / cuotasAtrasadas.
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return (prestamo.cuotas || []).filter(
    (c) => c.estado === 'pendiente' && String(c.fecha).slice(0, 10) < hoyStr,
  );
}

export function getCuotasQueImpidenCapital(prestamo, { cuotaNumero, incluirInteres } = {}) {
  const atrasadas = getCuotasAtrasadas(prestamo);
  if (incluirInteres && cuotaNumero != null) {
    return atrasadas.filter((c) => c.numero !== Number(cuotaNumero));
  }
  return atrasadas;
}

export function validateFechaPago(fechaPago) {
  if (!fechaPago) return 'Elegí la fecha de pago';
  if (typeof fechaPago === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
    const [y, m, d] = fechaPago.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return 'Fecha inválida';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dia = new Date(y, m - 1, d);
    dia.setHours(0, 0, 0, 0);
    if (dia > hoy) return 'La fecha de pago no puede ser futura';
    return null;
  }
  const dt = new Date(fechaPago);
  if (Number.isNaN(dt.getTime())) return 'Fecha inválida';
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  if (dt > hoy) return 'La fecha de pago no puede ser futura';
  return null;
}

export function validateMontoCobro({ monto, tipo, prestamo, cuotaNumero, incluirInteres, aceptaAtrasados, fechaPago }) {
  const errFecha = fechaPago !== undefined ? validateFechaPago(fechaPago) : null;
  if (errFecha) return errFecha;
  const n = Number(String(monto).replace(/\D/g, ''));
  if (!n) return 'Ingresa un monto';
  if (n <= 0) return 'El monto debe ser mayor a 0';
  if (!Number.isFinite(n)) return 'Monto inválido';

  if (tipo === 'interes') {
    // El backend exige monto >= interés del período ("monto menor...").
    // Validar temprano en vez de devolver null y fallar en el servidor.
    if (prestamo) {
      const interes = prestamosService.cuotaDelPeriodo(prestamo);
      if (Number.isFinite(interes) && interes > 0 && n < interes) {
        return `El monto no cubre el interés del período (${interes.toLocaleString('es-CR')})`;
      }
    }
    return null;
  }

  if (tipo === 'capital' && prestamo) {
    if (prestamosService.cuotasAgotadas(prestamo)) {
      const saldo = prestamosService.getSaldoCapital(prestamo);
      return `Cuotas agotadas y saldo pendiente (${saldo.toLocaleString('es-CR')}). Extendé las cuotas para poder hacer un abono.`;
    }

    // Abonar a capital con intereses atrasados está permitido, pero exige
    // confirmación explícita (checkbox en el formulario).
    const queImpiden = getCuotasQueImpidenCapital(prestamo, { cuotaNumero, incluirInteres });
    if (queImpiden.length > 0 && !aceptaAtrasados) {
      const total = queImpiden.reduce((s, c) => s + Number(c.monto || 0), 0);
      return `Tenés ${queImpiden.length} interés(es) atrasado(s) por ${total.toLocaleString('es-CR')}. Marcá que lo entendés para abonar a capital.`;
    }

    const saldo = prestamosService.getSaldoCapital(prestamo);
    const cuota = (prestamo.cuotas || []).find((c) => c.numero === Number(cuotaNumero));
    const interes = cuota?.monto || 0;
    const max = incluirInteres ? saldo + interes : saldo;
    if (n > max) {
      return incluirInteres
        ? `Máximo: ${max.toLocaleString('es-CR')} (saldo + interés)`
        : `Máximo: ${max.toLocaleString('es-CR')} (saldo pendiente)`;
    }
  }
  return null;
}

export { formatMontoLive } from '../../lib/format';

export function buildResumenCobro({ prestamo, cuotaNumero, monto, tipo, incluirInteres, cliente, cobrosPrevios = [] }) {
  const cuota = (prestamo.cuotas || []).find((c) => c.numero === Number(cuotaNumero));
  const interes = cuota?.monto || 0;
  const saldo = prestamosService.getSaldoCapital(prestamo);
  let capitalPagado = 0;
  let interesPagado = 0;
  let nuevoSaldo = saldo;

  if (tipo === 'interes') {
    interesPagado = monto;
  } else if (tipo === 'capital') {
    if (incluirInteres) {
      capitalPagado = Math.max(0, monto - interes);
      interesPagado = Math.min(interes, monto);
    } else {
      capitalPagado = monto;
    }
    nuevoSaldo = Math.max(0, saldo - capitalPagado);
  }

  const willCancel = nuevoSaldo === 0 && tipo === 'capital';

  // Sin split de comisión fuera de Mis comisiones: todo el interés es del
  // acreedor en esta vista.
  const comision = 0;
  const comisionAlCompletar = 0;

  return {
    cliente: cliente?.nombre,
    prestamoMonto: prestamo.monto,
    saldoActual: saldo,
    nuevoSaldo,
    interes,
    capitalPagado,
    interesPagado,
    interesAcreedor: interesPagado,
    comision,
    comisionAlCompletar,
    cuotaCompleta: true,
    tieneComision: false,
    willCancel,
    tipo,
    incluirInteres: Boolean(incluirInteres),
  };
}