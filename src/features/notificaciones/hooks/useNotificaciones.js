import { useMemo, useState } from 'react';
import * as notifService from '../../../services/notificaciones';
import { getNotificacionesAgrupadas } from '../selectors';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function useNotificaciones() {
  const [tick, setTick] = useState(0);
  useDataChange(() => setTick((t) => t + 1));

  const todas = useMemo(() => {
    void tick;
    return [...notifService.list()].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );
  }, [tick]);

  const noLeidas = useMemo(() => todas.filter((n) => !n.leida), [todas]);
  const total = todas.length;
  const countNoLeidas = noLeidas.length;

  function marcarLeida(id) {
    return notifService.marcarLeida(id);
  }

  function marcarTodas() {
    return notifService.marcarTodasLeidas();
  }

  function getAgrupadas(filter) {
    const source = filter === 'no-leidas' ? noLeidas : todas;
    return getNotificacionesAgrupadas(source);
  }

  return {
    todas,
    noLeidas,
    total,
    countNoLeidas,
    marcarLeida,
    marcarTodas,
    getAgrupadas,
  };
}