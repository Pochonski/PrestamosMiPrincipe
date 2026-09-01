import { useEffect } from 'react';
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
  useEffect(() => {
    if (!orgId || !user) return;
    checkAndNotify();
    if (typeof window !== 'undefined') {
      window.addEventListener('pmp:data-changed', checkAndNotify);
      return () => window.removeEventListener('pmp:data-changed', checkAndNotify);
    }
  }, [orgId, user]);
}