import { useEffect, useState } from 'react';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';
import { useDataChange } from '../../lib/hooks/useDataChange';

export async function getAtrasadosDetallado() {
  const [items, clientes] = await Promise.all([
    prestamosService.cuotasAtrasadas(),
    clientesService.list(),
  ]);
  const clienteById = new Map(clientes.map((c) => [c.id, c]));
  const rows = items
    .map(({ prestamo, cuota }) => {
      const cliente = clienteById.get(prestamo.clienteId) || null;
      const diffMs = Date.now() - new Date(cuota.fecha).getTime();
      const diffDay = Math.floor(diffMs / 86400000);
      return { prestamo, cuota, cliente, diasAtraso: diffDay };
    })
    .filter((x) => x.cliente)
    .sort((a, b) => b.diasAtraso - a.diasAtraso);
  return rows;
}

export function getResumenAtrasados() {
  return prestamosService.cuotasAtrasadas().then((items) => ({
    cantidad: items.length,
    total: items.reduce((s, x) => s + x.cuota.monto, 0),
  }));
}

export function useAtrasados() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ items: [], resumen: null, loading: true });

  useDataChange(() => setTick((t) => t + 1));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [items, resumen] = await Promise.all([
          getAtrasadosDetallado(),
          getResumenAtrasados(),
        ]);
        if (!cancelled) setState({ items, resumen, loading: false });
      } catch {
        if (!cancelled) setState({ items: [], resumen: null, loading: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tick]);

  return state;
}