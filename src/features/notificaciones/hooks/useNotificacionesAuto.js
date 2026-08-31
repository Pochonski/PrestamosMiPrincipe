import { useEffect } from 'react';
import * as notifService from '../../../services/notificaciones';
import * as prestamosService from '../../../services/prestamos';
import { onDataChanged } from '../../../lib/events';

function check() {
  const atrasadas = prestamosService.cuotasAtrasadas();
  if (atrasadas.length > 0 && !notifService.existeNoLeidaPorTipo('mora')) {
    notifService.create({
      tipo: 'mora',
      titulo: 'Préstamos atrasados',
      mensaje: `Tenés ${atrasadas.length} ${atrasadas.length === 1 ? 'cuota atrasada' : 'cuotas atrasadas'}.`,
      leida: false,
    });
  }

  const cobrarHoy = prestamosService.cobrarHoy();
  if (cobrarHoy.length > 0 && !notifService.existeNoLeidaPorTipo('cobro')) {
    notifService.create({
      tipo: 'cobro',
      titulo: 'Cobros para hoy',
      mensaje: `Tenés ${cobrarHoy.length} ${cobrarHoy.length === 1 ? 'cuota para cobrar' : 'cuotas para cobrar'} hoy.`,
      leida: false,
    });
  }
}

export function useNotificacionesAuto() {
  useEffect(() => {
    check();
    return onDataChanged(check);
  }, []);
}