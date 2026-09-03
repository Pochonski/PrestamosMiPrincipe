import { useEffect, useState } from 'react';
import { onDataChanged } from '../events';

/**
 * Suscripción al bus `pmp:data-changed` con tick interno.
 * El tick se incrementa cada vez que `emitDataChanged()` se dispara
 * desde un service tras una mutación.
 *
 * @returns {number} tick counter
 */
export function useTickOnDataChange() {
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChanged(() => setTick((t) => t + 1)), []);
  return tick;
}

/**
 * Patrón DRY: suscripción + fetch cancelable + state { data, loading }.
 *
 * @param {() => Promise<T>} fetcher - función async que retorna data
 * @param {Array} extraDeps - deps adicionales (ej: clienteId)
 * @returns {{ data: T|null, loading: boolean, reload: () => void }}
 */
export function useAsyncResource(fetcher, extraDeps = []) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ data: null, loading: true });
  const dataTick = useTickOnDataChange();

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataTick, tick, ...extraDeps]);

  return {
    ...state,
    reload: () => setTick((t) => t + 1),
  };
}
