import { useEffect, useState } from 'react';
import * as prestamosService from '../../../services/prestamos';
import { onDataChanged } from '../../../lib/events';

export function usePrestamosCliente(clienteId) {
  const [tick, setTick] = useState(0);
  const [prestamos, setPrestamos] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clienteId) {
        if (!cancelled) setPrestamos([]);
        return;
      }
      try {
        const data = await prestamosService.delCliente(clienteId);
        if (!cancelled) setPrestamos(data);
      } catch {
        if (!cancelled) setPrestamos([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clienteId, tick]);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    return onDataChanged(handler);
  }, []);

  return prestamos;
}
