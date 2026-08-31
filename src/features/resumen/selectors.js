import { useState, useMemo } from 'react';
import * as clientesService from '../../services/clientes';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import { useDataChange } from '../../lib/hooks/useDataChange';

export function useResumenData() {
  const [tick, setTick] = useState(0);
  useDataChange(() => setTick((t) => t + 1));

  const data = useMemo(() => {
    void tick;

    const clientes = clientesService.list();
    const prestamos = prestamosService.list();
    const cobros = cobrosService.list();

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const inicio30 = new Date();
    inicio30.setDate(inicio30.getDate() - 30);
    inicio30.setHours(0, 0, 0, 0);

    const totalClientes = clientes.length;
    const prestamosActivos = prestamos.filter(
      (p) => p.estado === 'vigente' || p.estado === 'atrasado',
    ).length;
    const cobrosHoy = cobrosService.delDia();
    const totalCobradoHoy = cobrosHoy.reduce((s, c) => s + c.monto, 0);

    const totalAtrasado = prestamosService.totalAtrasado();
    const carteraActiva = prestamosService.carteraTotal();

    const cobrosMes = cobros
      .filter((c) => new Date(c.fecha) >= inicioMes)
      .reduce((s, c) => s + c.monto, 0);
    const cobros30 = cobros.filter((c) => new Date(c.fecha) >= inicio30);

    const cancelados30 = prestamos.filter(
      (p) =>
        p.estado === 'cancelado' &&
        p.cuotas.some((c) => c.pagadaEn && new Date(c.pagadaEn) >= inicio30),
    ).length;

    const topClientes = clientes
      .map((c) => {
        const ps = prestamos.filter((p) => p.clienteId === c.id);
        const totalPrestado = ps.reduce((s, p) => s + Number(p.monto), 0);
        const saldoPendiente = ps.reduce(
          (s, p) => s + prestamosService.getSaldoCapital(p),
          0,
        );
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
        cliente: clientesService.getById(cobro.clienteId),
      }));

    return {
      kpis: {
        totalClientes,
        prestamosActivos,
        totalCobradoHoy,
        cobrosHoyCount: cobrosHoy.length,
        totalAtrasado,
        carteraActiva,
        cobrosMes,
        cancelados30,
      },
      topClientes,
      ultimosCobros,
      cobros30Count: cobros30.length,
    };
  }, [tick]);

  return data;
}