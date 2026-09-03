import { useEffect, useState } from 'react';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';
import { useDataChange } from '../../lib/hooks/useDataChange';

export function getCobrarHoyDetalle() {
  return prestamosService.cobrarHoy().then((items) =>
    items.map((x) => ({
      prestamoId: x.prestamo.id,
      clienteId: x.prestamo.clienteId,
      cuota: x.cuota,
    })),
  );
}

export function getResumenCobrarHoy() {
  return prestamosService.cobrarHoy().then((items) => ({
    cantidad: items.length,
    total: items.reduce((s, x) => s + x.cuota.monto, 0),
  }));
}

export function useCobrarHoy() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ items: [], resumen: null, loading: true });

  useDataChange(() => setTick((t) => t + 1));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [items, resumen, clientes] = await Promise.all([
          getCobrarHoyDetalle(),
          getResumenCobrarHoy(),
          clientesService.list(),
        ]);
        const clienteById = new Map(clientes.map((c) => [c.id, c]));
        const filtered = items
          .map((x) => ({ ...x, cliente: clienteById.get(x.clienteId) || null }))
          .filter((x) => x.cliente);
        if (!cancelled) {
          setState({ items: filtered, resumen, loading: false });
        }
      } catch {
        if (!cancelled) setState({ items: [], resumen: null, loading: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tick]);

  return state;
}