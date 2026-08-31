import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import * as clientesService from '../../services/clientes';
import * as usuariosService from '../../services/usuarios';
import * as notificacionesService from '../../services/notificaciones';

export function getKpis() {
  const prestamos = prestamosService.resumen();
  const cobros = cobrosService.resumen();
  return {
    carteraTotal: prestamos.carteraTotal,
    totalAtrasado: prestamos.totalAtrasado,
    cantidadAtrasados: prestamos.cantidadAtrasados,
    cantidadActivos: prestamos.cantidadActivos,
    totalCobrarHoy: prestamos.totalCobrarHoy,
    cantidadCobrarHoy: prestamos.cantidadCobrarHoy,
    totalCobradoHoy: cobros.totalDelDia,
    cantidadCobradoHoy: cobros.cantidadDelDia,
    totalClientes: clientesService.count(),
  };
}

export function getQuickBadges() {
  return {
    notificaciones: notificacionesService.countNoLeidas(),
    atrasados: prestamosService.cuotasAtrasadas().length,
    cobrarHoy: prestamosService.cobrarHoy().length,
  };
}

export function getRecentActivity(limit = 6) {
  const cobros = cobrosService.recientes(limit);
  const clientesById = new Map(clientesService.list().map((c) => [c.id, c]));
  const usuariosById = new Map(usuariosService.list().map((u) => [u.id, u.nombre]));
  return cobros.slice(0, limit).map((cobro) => {
    const cobrador = cobro.cobradorId ? usuariosById.get(cobro.cobradorId) : null;
    const cobradorStr = cobrador ? ` · ${cobrador.split(' ')[0]}` : '';
    return {
      id: cobro.id,
      tipo: 'cobro',
      titulo: `Cobro a ${clientesById.get(cobro.clienteId)?.nombre || 'Cliente'}`,
      subtitulo: `Cuota #${cobro.cuotaNumero}${cobradorStr}${cobro.nota ? ` · ${cobro.nota}` : ''}`,
      monto: cobro.monto,
      fecha: cobro.fecha,
    };
  });
}

export function getCobrarHoyDetalle() {
  return prestamosService.cobrarHoy().map((x) => ({
    prestamoId: x.prestamo.id,
    clienteId: x.prestamo.clienteId,
    cuota: x.cuota,
  }));
}