import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import * as clientesService from '../../services/clientes';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';

export function computeResumen({ clientes, prestamos, cobros, hoy = new Date() }) {
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const activos = prestamos.filter(
    (p) => p.estado === 'vigente' || p.estado === 'atrasado',
  );

  const totalCobradoHoy = cobros
    .filter((c) => {
      const d = new Date(c.fecha);
      return d.toDateString() === hoy.toDateString();
    })
    .reduce((s, c) => s + c.monto, 0);

  const totalAtrasado = prestamos.reduce((s, p) => {
    const atrasada = (p.cuotas || []).some(
      (c) => c.estado === 'pendiente' && new Date(c.fecha) < hoy,
    );
    if (!atrasada) return s;
    return s + (p.cuotas || [])
      .filter((c) => c.estado === 'pendiente')
      .reduce((ss, c) => ss + c.monto, 0);
  }, 0);

  const cobrosMes = cobros
    .filter((c) => new Date(c.fecha) >= inicioMes)
    .reduce((s, c) => s + c.monto, 0);

  const cancelados30 = prestamos.filter((p) =>
    (p.cuotas || []).some(
      (c) => c.pagada_en && new Date(c.pagada_en) >= new Date(hoy.getTime() - 30 * 86400000),
    ),
  ).length;

  const enriched = prestamos.map((p) => {
    const totalPrestado = Number(p.monto || 0);
    const saldoPendiente = Number(p.saldo_capital || 0);
    return {
      ...p,
      prestamosCount: 1,
      totalPrestado,
      saldoPendiente,
    };
  });

  const topClientes = clientes
    .map((c) => {
      const ps = enriched.filter((p) => p.cliente_id === c.id);
      const totalPrestado = ps.reduce((s, p) => s + p.totalPrestado, 0);
      const saldoPendiente = ps.reduce((s, p) => s + p.saldoPendiente, 0);
      return {
        ...c,
        prestamosCount: ps.length,
        totalPrestado,
        saldoPendiente,
      };
    })
    .sort((a, b) => b.totalPrestado - a.totalPrestado)
    .slice(0, 5);

  const ultimosCobros = [...cobros]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10)
    .map((cobro) => ({
      ...cobro,
      cliente: clientes.find((c) => c.id === cobro.cliente_id),
    }));

  return {
    kpis: {
      totalClientes: clientes.length,
      prestamosActivos: activos.length,
      totalCobradoHoy,
      cobrosHoyCount: cobros.filter((c) => new Date(c.fecha).toDateString() === hoy.toDateString()).length,
      totalAtrasado,
      carteraActiva: prestamos.reduce((s, p) => s + Number(p.saldo_capital || 0), 0),
      cobrosMes,
      cancelados30,
      cantidadCobrarHoy: cobros.filter((c) => {
        const d = new Date(c.fecha);
        return d.toDateString() === hoy.toDateString();
      }).length,
    },
    topClientes,
    ultimosCobros,
    cobros30Count: cobros.filter((c) => new Date(c.fecha) >= new Date(hoy.getTime() - 30 * 86400000)).length,
  };
}

export function useResumenData() {
  const results = useQueries({
    queries: [
      { queryKey: ['clientes', 'all'], queryFn: () => clientesService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
      { queryKey: ['prestamos', 'all'], queryFn: () => prestamosService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
      { queryKey: ['cobros', 'all'], queryFn: () => cobrosService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
    ],
  });
  const [clientesQ, prestamosQ, cobrosQ] = results;
  const clientes = clientesQ.data || [];
  const prestamos = prestamosQ.data || [];
  const cobros = cobrosQ.data || [];
  const loading = results.some((r) => r.isLoading) && !clientesQ.data;
  const data = useMemo(
    () => (clientesQ.data ? computeResumen({ clientes, prestamos, cobros }) : null),
    [clientes, prestamos, cobros, clientesQ.data],
  );
  return { data, loading };
}