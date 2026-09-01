import { useEffect, useMemo, useState } from 'react';
import * as notifService from '../../../services/notificaciones';
import { getNotificacionesAgrupadas } from '../selectors';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function useNotificaciones() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ todas: [], loading: true });

  useDataChange(() => setTick((t) => t + 1));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await notifService.list();
        if (!cancelled) {
          setState({
            todas: list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState({ todas: [], loading: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tick]);

  const noLeidas = useMemo(() => state.todas.filter((n) => !n.leida), [state.todas]);
  const total = state.todas.length;
  const countNoLeidas = noLeidas.length;

  function getAgrupadas(filter) {
    const source = filter === 'no-leidas' ? noLeidas : state.todas;
    return getNotificacionesAgrupadas(source);
  }

  async function marcarLeida(id) {
    await notifService.marcarLeida(id);
    setTick((t) => t + 1);
  }

  async function marcarTodas() {
    await notifService.marcarTodasLeidas();
    setTick((t) => t + 1);
  }

  return {
    todas: state.todas,
    noLeidas,
    total,
    countNoLeidas,
    loading: state.loading,
    marcarLeida,
    marcarTodas,
    getAgrupadas,
  };
}