import { useEffect, useMemo, useState } from 'react';
import * as cobrosService from '../../services/cobros';
import * as prestamosService from '../../services/prestamos';
import { onDataChanged } from '../../lib/events';
import { useTickOnDataChange } from '../../lib/hooks/useAsyncResource';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function compute(cobros, prestamos, ahora = new Date()) {
  const cobrosPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const mes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mesSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
    let total = 0;
    for (const c of cobros) {
      const d = new Date(c.fecha);
      if (d >= mes && d < mesSiguiente) total += c.monto;
    }
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

function startOfMonthsAgo(ahora, n) {
  return new Date(ahora.getFullYear(), ahora.getMonth() - n, 1).toISOString();
}

export function useReportesData() {
  const [cobros, setCobros] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const dataTick = useTickOnDataChange();

  async function load() {
    setLoading(true);
    try {
      const desde = startOfMonthsAgo(new Date(), 6);
      const [cobs, pres] = await Promise.all([
        cobrosService.list({ limit: 1000, offset: 0 }),
        prestamosService.list({ limit: 500, offset: 0 }),
      ]);
      setCobros((cobs || []).filter((c) => c.fecha >= desde));
      setPrestamos(pres || []);
    } catch {
      setCobros([]);
      setPrestamos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [dataTick]);

  useEffect(() => {
    return onDataChanged(() => {
      setCobros([]);
      setPrestamos([]);
      load();
    });
  }, []);

  const data = useMemo(() => compute(cobros, prestamos), [cobros, prestamos]);

  return { data, loading };
}