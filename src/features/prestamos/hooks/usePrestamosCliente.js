import { useState, useMemo } from 'react';
import * as prestamosService from '../../../services/prestamos';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function usePrestamosCliente(clienteId) {
  const [tick, setTick] = useState(0);
  useDataChange(() => setTick((t) => t + 1));

  const prestamos = useMemo(() => {
    void tick;
    if (!clienteId) return [];
    return prestamosService.delCliente(clienteId);
  }, [clienteId, tick]);

  return prestamos;
}