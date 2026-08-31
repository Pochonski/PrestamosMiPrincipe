import { useMemo, useState } from 'react';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';
import { useDataChange } from '../../lib/hooks/useDataChange';

function getCobrarHoyDetallado() {
  const items = prestamosService.cobrarHoy();
  return items
    .map(({ prestamo, cuota }) => ({
      prestamo,
      cuota,
      cliente: clientesService.getById(prestamo.clienteId),
    }))
    .filter((x) => x.cliente);
}

export function getResumenCobrarHoy() {
  const items = prestamosService.cobrarHoy();
  return {
    cantidad: items.length,
    total: items.reduce((s, x) => s + x.cuota.monto, 0),
  };
}

export function useCobrarHoy() {
  const [tick, setTick] = useState(0);
  useDataChange(() => setTick((t) => t + 1));

  const items = useMemo(() => {
    void tick;
    return getCobrarHoyDetallado();
  }, [tick]);

  const resumen = useMemo(() => {
    void tick;
    return getResumenCobrarHoy();
  }, [tick]);

  return { items, resumen };
}

