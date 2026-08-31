import { useMemo, useState } from 'react';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';
import { diffDays } from '../../lib/format';
import { useDataChange } from '../../lib/hooks/useDataChange';

export function getAtrasadosDetallado() {
  const items = prestamosService.cuotasAtrasadas();
  return items
    .map(({ prestamo, cuota }) => ({
      prestamo,
      cuota,
      cliente: clientesService.getById(prestamo.clienteId),
      diasAtraso: Math.abs(diffDays(cuota.fecha, new Date())),
    }))
    .filter((x) => x.cliente)
    .sort((a, b) => b.diasAtraso - a.diasAtraso);
}

export function getResumenAtrasados() {
  const items = prestamosService.cuotasAtrasadas();
  return {
    cantidad: items.length,
    total: items.reduce((s, x) => s + x.cuota.monto, 0),
  };
}

export function useAtrasados() {
  const [tick, setTick] = useState(0);
  useDataChange(() => setTick((t) => t + 1));

  const items = useMemo(() => {
    void tick;
    return getAtrasadosDetallado();
  }, [tick]);

  const resumen = useMemo(() => {
    void tick;
    return getResumenAtrasados();
  }, [tick]);

  return { items, resumen };
}