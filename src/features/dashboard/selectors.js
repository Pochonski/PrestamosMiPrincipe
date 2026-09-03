import { supabase } from '../../lib/supabase';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import * as clientesService from '../../services/clientes';
import * as notificacionesService from '../../services/notificaciones';

export async function getKpis() {
  const [prestamos, cobros, totalClientes] = await Promise.all([
    prestamosService.resumen(),
    cobrosService.resumen(),
    clientesService.count(),
  ]);
  return {
    carteraTotal: prestamos.carteraTotal,
    totalAtrasado: prestamos.totalAtrasado,
    cantidadAtrasados: prestamos.cantidadAtrasados,
    cantidadActivos: prestamos.cantidadActivos,
    totalCobrarHoy: prestamos.totalCobrarHoy,
    cantidadCobrarHoy: prestamos.cantidadCobrarHoy,
    totalCobradoHoy: cobros.totalDelDia,
    cantidadCobradoHoy: cobros.cantidadDelDia,
    totalClientes,
  };
}

export async function getQuickBadges() {
  const [notifs, atrasadas, hoy] = await Promise.all([
    notificacionesService.countNoLeidas(),
    prestamosService.cuotasAtrasadas(),
    prestamosService.cobrarHoy(),
  ]);
  return {
    notificaciones: notifs,
    atrasados: atrasadas.length,
    cobrarHoy: hoy.length,
  };
}

export function buildRecentActivity({ cobros, clientes, profiles = [], limit = 6 }) {
  const clientesById = new Map(clientes.map((c) => [c.id, c]));
  const profilesById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return cobros.slice(0, limit).map((cobro) => {
    const clienteId = cobro.clienteId ?? cobro.cliente_id;
    const cuotaNumero = cobro.cuotaNumero ?? cobro.cuota_numero;
    const cobradorId = cobro.cobradorId ?? cobro.cobrador_id;
    const profile = profilesById.get(cobradorId);
    const cobradorStr = profile?.full_name ? ` · ${profile.full_name.split(' ')[0]}` : '';
    return {
      id: cobro.id,
      tipo: 'cobro',
      titulo: `Cobro a ${clientesById.get(clienteId)?.nombre || 'Cliente'}`,
      subtitulo: `Cuota #${cuotaNumero}${cobradorStr}${cobro.nota ? ` · ${cobro.nota}` : ''}`,
      monto: cobro.monto,
      fecha: cobro.fecha,
    };
  });
}

export async function getRecentActivity(limit = 6) {
  const cobros = await cobrosService.recientes(limit);
  const cobradorIds = [...new Set(cobros.map((c) => c.cobradorId ?? c.cobrador_id).filter(Boolean))];
  const [clientes, profilesRows] = await Promise.all([
    clientesService.list({ limit: 200, offset: 0 }),
    cobradorIds.length > 0
      ? supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', cobradorIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
  ]);
  return buildRecentActivity({ cobros, clientes, profiles: profilesRows, limit });
}

export async function getCobrarHoyDetalle() {
  const hoy = await prestamosService.cobrarHoy();
  return hoy.map((x) => ({
    prestamoId: x.prestamo.id,
    clienteId: x.prestamo.clienteId,
    cuota: x.cuota,
  }));
}