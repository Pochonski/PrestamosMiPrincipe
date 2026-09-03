import { useQueries } from '@tanstack/react-query';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';

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
  const results = useQueries({
    queries: [
      { queryKey: ['cobrarHoy', 'detalle'], queryFn: getCobrarHoyDetalle, staleTime: 30_000 },
      { queryKey: ['cobrarHoy', 'resumen'], queryFn: getResumenCobrarHoy, staleTime: 30_000 },
      { queryKey: ['clientes', 'all'], queryFn: () => clientesService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
    ],
  });
  const [itemsQ, resumenQ, clientesQ] = results;
  const clientes = clientesQ.data || [];
  const items = itemsQ.data || [];
  const enriched = items
    .map((x) => ({ ...x, cliente: clientes.find((c) => c.id === x.clienteId) || null }))
    .filter((x) => x.cliente);
  const loading = results.some((r) => r.isLoading) && !itemsQ.data;
  return {
    items: enriched,
    resumen: resumenQ.data || null,
    loading,
  };
}