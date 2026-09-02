import { useEffect, useRef } from 'react';
import * as notifService from '../../../services/notificaciones';
import * as prestamosService from '../../../services/prestamos';
import { useAuth } from '../../auth/useAuth';

async function checkAndNotify() {
  try {
    const [atrasadas, hoy] = await Promise.all([
      prestamosService.cuotasAtrasadas(),
      prestamosService.cobrarHoy(),
    ]);
    if (atrasadas.length > 0 && !(await notifService.existeNoLeidaPorTipo('mora'))) {
      await notifService.create({
        tipo: 'mora',
        titulo: 'Préstamos atrasados',
        mensaje: `Tenés ${atrasadas.length} ${atrasadas.length === 1 ? 'cuota atrasada' : 'cuotas atrasadas'}.`,
      });
    }
    if (hoy.length > 0 && !(await notifService.existeNoLeidaPorTipo('cobro'))) {
      await notifService.create({
        tipo: 'cobro',
        titulo: 'Cobros para hoy',
        mensaje: `Tenés ${hoy.length} ${hoy.length === 1 ? 'cuota para cobrar' : 'cuotas para cobrar'} hoy.`,
      });
    }
  } catch {
    // ignore
  }
}

export function useNotificacionesAuto() {
  const { orgId, user } = useAuth();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!orgId || !user) return;
    const safe = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        await checkAndNotify();
      } finally {
        inFlight.current = false;
      }
    };
    safe();
    let unsub;
    if (typeof window !== 'undefined') {
      const handler = () => safe();
      window.addEventListener('pmp:data-changed', handler);
      unsub = () => window.removeEventListener('pmp:data-changed', handler);
    }
    return unsub;
  }, [orgId, user]);
}