import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/prestamos', () => ({
  resumen: vi.fn(),
  cuotasAtrasadas: vi.fn(),
  cobrarHoy: vi.fn(),
}));
vi.mock('../../../services/cobros', () => ({
  resumen: vi.fn(),
  recientes: vi.fn(),
}));
vi.mock('../../../services/clientes', () => ({
  count: vi.fn(),
  list: vi.fn(),
}));
vi.mock('../../../services/notificaciones', () => ({
  countNoLeidas: vi.fn(),
}));
vi.mock('../../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { getKpis, getQuickBadges, buildRecentActivity, getRecentActivity, getCobrarHoyDetalle } from '../selectors';
import * as prestamosService from '../../../services/prestamos';
import * as cobrosService from '../../../services/cobros';
import * as clientesService from '../../../services/clientes';
import * as notifService from '../../../services/notificaciones';
import { supabase } from '../../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('getKpis', () => {
  it('agrega kpis', async () => {
    vi.mocked(prestamosService.resumen).mockResolvedValue({ carteraTotal: 100, totalAtrasado: 10, cantidadAtrasados: 1, cantidadActivos: 2, totalCobrarHoy: 50, cantidadCobrarHoy: 1 });
    vi.mocked(cobrosService.resumen).mockResolvedValue({ totalDelDia: 20, cantidadDelDia: 2 });
    vi.mocked(clientesService.count).mockResolvedValue(5);
    const r = await getKpis();
    expect(r.carteraTotal).toBe(100);
    expect(r.totalClientes).toBe(5);
    expect(r.totalCobradoHoy).toBe(20);
  });
});

describe('getQuickBadges', () => {
  it('suma notifs y listas', async () => {
    vi.mocked(notifService.countNoLeidas).mockResolvedValue(3);
    vi.mocked(prestamosService.cuotasAtrasadas).mockResolvedValue([{}, {}]);
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([{}]);
    const r = await getQuickBadges();
    expect(r.notificaciones).toBe(3);
    expect(r.atrasados).toBe(2);
    expect(r.cobrarHoy).toBe(1);
  });
});

describe('buildRecentActivity', () => {
  it('mapea cobros con cliente y perfil', () => {
    const cobros = [{ id: '1', clienteId: 'c1', cuotaNumero: 2, monto: 1000, fecha: '2024-01-01', cobradorId: 'u1', nota: 'nota' }];
    const clientes = [{ id: 'c1', nombre: 'Ana' }];
    const profiles = [{ user_id: 'u1', full_name: 'Carlos Ruiz' }];
    const r = buildRecentActivity({ cobros, clientes, profiles });
    expect(r[0].titulo).toBe('Cobro a Ana');
    expect(r[0].subtitulo).toContain('Cuota #2');
    expect(r[0].subtitulo).toContain('Carlos');
    expect(r[0].subtitulo).toContain('nota');
  });
  it('fallback cliente', () => {
    const r = buildRecentActivity({ cobros: [{ id: '1', clienteId: 'x', cuotaNumero: 1, monto: 100, fecha: '2024-01-01' }], clientes: [], profiles: [] });
    expect(r[0].titulo).toBe('Cobro a Cliente');
  });
});

describe('getRecentActivity integración', () => {
  it('llama supabase si hay cobradorIds', async () => {
    vi.mocked(cobrosService.recientes).mockResolvedValue([{ id: '1', clienteId: 'c1', cobradorId: 'u1', cuotaNumero: 1, monto: 100, fecha: '2024-01-01' }]);
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'c1', nombre: 'Ana' }]);
    const fromMock = { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [{ user_id: 'u1', full_name: 'X' }] }) };
    fromMock.select.mockReturnValue(fromMock);
    vi.mocked(supabase.from).mockReturnValue(fromMock);
    const r = await getRecentActivity(1);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(r[0].titulo).toContain('Ana');
  });
});

describe('getCobrarHoyDetalle', () => {
  it('mapea', async () => {
    vi.mocked(prestamosService.cobrarHoy).mockResolvedValue([{ prestamo: { id: 'p1', clienteId: 'c1' }, cuota: { numero: 1 } }]);
    const r = await getCobrarHoyDetalle();
    expect(r[0]).toEqual({ prestamoId: 'p1', clienteId: 'c1', cuota: { numero: 1 } });
  });
});
