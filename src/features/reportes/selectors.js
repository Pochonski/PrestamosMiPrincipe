import { useEffect, useState } from 'react';
import * as cobrosService from '../../services/cobros';
import * as prestamosService from '../../services/prestamos';
import { onDataChanged } from '../../lib/events';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function compute(cobros, prestamos) {
  const ahora = new Date();
  const cobrosPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const mes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mesSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
    const total = cobros
      .filter((c) => {
        const d = new Date(c.fecha);
        return d >= mes && d < mesSiguiente;
      })
      .reduce((s, c) => s + c.monto, 0);
    cobrosPorMes.push({
      label: MESES_CORTO[mes.getMonth()],
      value: total,
      fullLabel: mes.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' }),
    });
  }

  const estados = { vigente: 0, atrasado: 0, cancelado: 0 };
  for (const p of prestamos) {
    const s = prestamosService.getStatus(p);
    estados[s] = (estados[s] || 0) + 1;
  }
  const prestamosPorEstado = [
    { label: 'Vigentes', value: estados.vigente, color: '#10b981' },
    { label: 'Atrasados', value: estados.atrasado, color: '#f43f5e' },
    { label: 'Cancelados', value: estados.cancelado, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const porRuta = {};
  for (const p of prestamos) {
    const r = p.ruta || 'Sin ruta';
    porRuta[r] = (porRuta[r] || 0) + 1;
  }
  const distribucionRuta = Object.entries(porRuta)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    cobrosPorMes,
    prestamosPorEstado,
    distribucionRuta,
    totalPrestamos: prestamos.length,
  };
}

export function useReportesData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [cobros, prestamos] = await Promise.all([
        cobrosService.list(),
        prestamosService.list(),
      ]);
      setData(compute(cobros, prestamos));
    } catch {
      setData(compute([], []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    return onDataChanged(load);
  }, []);

  return { data, loading };
}