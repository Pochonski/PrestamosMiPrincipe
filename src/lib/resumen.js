import * as prestamosService from '../services/prestamos';

export async function statsCliente(clienteId) {
  const all = await prestamosService.delCliente(clienteId);
  let vigentes = 0;
  let atrasados = 0;
  let cancelados = 0;
  for (const p of all) {
    const s = prestamosService.getStatus(p);
    if (s === 'vigente') vigentes++;
    else if (s === 'atrasado') atrasados++;
    else if (s === 'cancelado') cancelados++;
  }
  return { total: all.length, vigentes, atrasados, cancelados };
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
    total: prestamo.n_cuotas || prestamo.nCuotas || 0,
    totalPagado,
    proximoCobro,
  };
}