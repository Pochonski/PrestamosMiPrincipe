import { useEffect, useState } from 'react';
import * as prestamosService from '../../../services/prestamos';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function usePrestamosCliente(clienteId) {
  const [tick, setTick] = useState(0);
  const [prestamos, setPrestamos] = useState([]);

  useDataChange(() => setTick((t) => t + 1));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clienteId) {
        if (!cancelled) setPrestamos([]);
        return;
      }
      try {
        const result = await prestamosService.delCliente(clienteId);
        if (!cancelled) setPrestamos(result);
      } catch {
        if (!cancelled) setPrestamos([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clienteId, tick]);

  return prestamos;
}