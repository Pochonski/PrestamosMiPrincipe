import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/carteraHistory', () => ({
  snapshot: vi.fn(),
  history: vi.fn(),
}));
vi.mock('../../../services/cobros', () => ({
  list: vi.fn(),
  resumen: vi.fn(),
  recientes: vi.fn(),
}));
vi.mock('../../../services/prestamos', () => ({
  list: vi.fn(),
  resumen: vi.fn(),
  cuotasAtrasadas: vi.fn(),
  cobrarHoy: vi.fn(),
}));
vi.mock('../../../services/clientes', () => ({
  list: vi.fn(),
  count: vi.fn(),
}));
vi.mock('../../../services/notificaciones', () => ({
  countNoLeidas: vi.fn(),
}));
vi.mock('../../../services/totales', () => ({
  resumenTotales: vi.fn(),
  cobrosSerieDiaria: vi.fn(),
  cobrosSerieMensual: vi.fn(),
}));
vi.mock('../../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));
vi.mock('../../resumen/selectors', () => ({
  computeResumen: vi.fn(),
}));

import { deriveDeltas, getMetrics } from '../selectors';
import * as carteraHistoryService from '../../../services/carteraHistory';
import * as totalesService from '../../../services/totales';
import * as cobrosService from '../../../services/cobros';
import * as prestamosService from '../../../services/prestamos';
import * as clientesService from '../../../services/clientes';
import { computeResumen } from '../../resumen/selectors';

beforeEach(() => vi.clearAllMocks());

describe('deriveDeltas', () => {
  const kpis = {
    carteraTotal: 1200,
    totalAtrasado: 200,
    totalCobrarHoy: 300,
    totalCobradoHoy: 100,
  };

  it('cobra deltas reales cuando hay histórico', () => {
    const metrics = {
      cobradoAyer: 50,
      snapshotMesAnterior: { cartera_total: 1000 },
      snapshotAyer: { total_atrasado: 100, total_por_cobrar: 400 },
    };
    const d = deriveDeltas({ kpis, metrics });
    expect(d.cobradoHoy).toBe(100); // (100 - 50)/50*100
    expect(d.carteraTotal).toBe(20); // (1200 - 1000)/1000*100
    expect(d.totalAtrasado).toBe(100); // (200 - 100)/100*100
    expect(d.totalCobrarHoy).toBe(-25); // (300 - 400)/400*100
  });

  it('retorna null si no hay datos anteriores', () => {
    const d = deriveDeltas({
      kpis,
      metrics: { cobradoAyer: 0, snapshotMesAnterior: null, snapshotAyer: null },
    });
    expect(d.cobradoHoy).toBeNull();
    expect(d.carteraTotal).toBeNull();
    expect(d.totalAtrasado).toBeNull();
    expect(d.totalCobrarHoy).toBeNull();
  });

  it('retorna null si metrics ausente', () => {
    const d = deriveDeltas({ kpis, metrics: null });
    expect(d.cobradoHoy).toBeNull();
  });
});

describe('getMetrics', () => {
  it('agrega métricas y snapshot', async () => {
    vi.mocked(carteraHistoryService.snapshot).mockResolvedValue({ cartera_total: 100 });
    vi.mocked(carteraHistoryService.history).mockResolvedValue([]);
    vi.mocked(totalesService.cobrosSerieDiaria).mockResolvedValue([
      { fecha: '2020-01-01', total: 1 },
      { fecha: '2020-01-02', total: 2 },
      { fecha: '2020-01-03', total: 3 },
    ]);
    vi.mocked(totalesService.cobrosSerieMensual).mockResolvedValue([
      { mes: '2020-01', total: 10 },
    ]);

    const m = await getMetrics();
    expect(m.cobros6m).toHaveLength(1);
    expect(m.cobros6m[0].value).toBe(10);
    expect(m.spark7).toHaveLength(3);
    expect(m.cobradoAyer).toBe(0);
    expect(m.snapshotHoy).toBeNull();
  });

  it('si falla snapshot no rompe, usa history', async () => {
    vi.mocked(carteraHistoryService.snapshot).mockRejectedValue(new Error('x'));
    vi.mocked(carteraHistoryService.history).mockResolvedValue([]);
    vi.mocked(totalesService.cobrosSerieDiaria).mockResolvedValue([]);
    vi.mocked(totalesService.cobrosSerieMensual).mockResolvedValue([]);

    await expect(getMetrics()).resolves.toHaveProperty('cobros6m');
  });
});