import { useQueries } from '@tanstack/react-query';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';

export async function getAtrasadosDetallado() {
  const [items, clientes] = await Promise.all([
    prestamosService.cuotasAtrasadas(),
    clientesService.list({ limit: 500, offset: 0 }),
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
  const results = useQueries({
    queries: [
      { queryKey: ['atrasados', 'detallado'], queryFn: getAtrasadosDetallado, staleTime: 30_000 },
      { queryKey: ['atrasados', 'resumen'], queryFn: getResumenAtrasados, staleTime: 30_000 },
    ],
  });
  const [itemsQ, resumenQ] = results;
  const loading = results.some((r) => r.isLoading) && !itemsQ.data;
  return {
    items: itemsQ.data || [],
    resumen: resumenQ.data || null,
    loading,
  };
}