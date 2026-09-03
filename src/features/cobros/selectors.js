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
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return (prestamo.cuotas || []).filter(
    (c) => c.estado === 'pendiente' && new Date(c.fecha) < hoy,
  );
}

export function getCuotasQueImpidenCapital(prestamo, { cuotaNumero, incluirInteres } = {}) {
  const atrasadas = getCuotasAtrasadas(prestamo);
  if (incluirInteres && cuotaNumero != null) {
    return atrasadas.filter((c) => c.numero !== Number(cuotaNumero));
  }
  return atrasadas;
}

export function validateMontoCobro({ monto, tipo, prestamo, cuotaNumero, incluirInteres }) {
  if (tipo === 'interes') return null;

  const n = Number(String(monto).replace(/\D/g, ''));
  if (!n) return 'Ingresa un monto';
  if (n <= 0) return 'El monto debe ser mayor a 0';

  if (tipo === 'capital' && prestamo) {
    if (prestamosService.cuotasAgotadas(prestamo)) {
      const saldo = prestamosService.getSaldoCapital(prestamo);
      return `Cuotas agotadas y saldo pendiente (${saldo.toLocaleString('es-CR')}). Extendé las cuotas para poder hacer un abono.`;
    }

    const queImpiden = getCuotasQueImpidenCapital(prestamo, { cuotaNumero, incluirInteres });
    if (queImpiden.length > 0) {
      return `Tenés ${queImpiden.length} interés(es) atrasado(s). Pagalos antes de abonar a capital.`;
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

export function buildResumenCobro({ prestamo, cuotaNumero, monto, tipo, incluirInteres, cliente }) {
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

  return {
    cliente: cliente?.nombre,
    prestamoMonto: prestamo.monto,
    saldoActual: saldo,
    nuevoSaldo,
    interes,
    capitalPagado,
    interesPagado,
    willCancel,
    tipo,
    incluirInteres: Boolean(incluirInteres),
  };
}