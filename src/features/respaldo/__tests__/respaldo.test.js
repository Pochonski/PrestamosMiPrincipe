import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: vi.fn(), auth: { getSession: vi.fn() } },
}));
vi.mock('../../../lib/events', () => ({ emitDataChanged: vi.fn() }));

import { buildBackup, parseBackupFile, applyBackup, downloadBackup } from '../selectors';
import { supabase } from '../../../lib/supabase';
import { emitDataChanged } from '../../../lib/events';

beforeEach(() => vi.clearAllMocks());

describe('parseBackupFile', () => {
  it('lanza si no es JSON', async () => {
    const fakeReader = { onload: null, onerror: null, result: 'not json', readAsText(f) { this.onload(); } };
    vi.spyOn(global, 'FileReader').mockImplementation(() => fakeReader);
    const file = new Blob(['not json']);
    await expect(parseBackupFile(file)).rejects.toThrow('no es un JSON');
    vi.restoreAllMocks();
  });
  it('lanza si validateBackup falla', async () => {
    const fakeReader = { onload: null, onerror: null, result: JSON.stringify({ app: 'other' }), readAsText(f) { this.onload(); } };
    vi.spyOn(global, 'FileReader').mockImplementation(() => fakeReader);
    const file = new Blob([JSON.stringify({ app: 'other' })]);
    await expect(parseBackupFile(file)).rejects.toThrow();
    vi.restoreAllMocks();
  });
  it('ok', async () => {
    const backup = { app: 'pmp', data: { clientes: [] } };
    const fakeReader = { onload: null, onerror: null, result: JSON.stringify(backup), readAsText(f) { this.onload(); } };
    vi.spyOn(global, 'FileReader').mockImplementation(() => fakeReader);
    const file = new Blob([JSON.stringify(backup)]);
    const r = await parseBackupFile(file);
    expect(r.app).toBe('pmp');
    vi.restoreAllMocks();
  });
});

describe('applyBackup', () => {
  function mockSessionOrg() {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const single = vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null });
    const orgChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single };
    orgChain.select.mockReturnValue(orgChain); orgChain.eq.mockReturnValue(orgChain);
    return orgChain;
  }
  it('upsert tablas y cuotas', async () => {
    const orgChain = mockSessionOrg();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : { upsert });
    const parsed = { app: 'pmp', data: { clientes: [{ id: '1', nombre: 'Ana' }], prestamos: [], cobros: [], notificaciones: [], cuotas: [{ id: 'c1', prestamo_id: 'p1' }] } };
    await applyBackup(parsed);
    expect(supabase.from).toHaveBeenCalledWith('clientes');
    expect(supabase.from).toHaveBeenCalledWith('cuotas');
    expect(emitDataChanged).toHaveBeenCalled();
  });
  it('ignora tablas null/vacías', async () => {
    const orgChain = mockSessionOrg();
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : { upsert: vi.fn().mockResolvedValue({ error: null }) });
    await applyBackup({ app: 'pmp', data: { clientes: null, prestamos: [], cobros: [], notificaciones: [], cuotas: [] } });
    expect(emitDataChanged).toHaveBeenCalled();
  });
  it('lanza si error upsert', async () => {
    const orgChain = mockSessionOrg();
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : { upsert: vi.fn().mockResolvedValue({ error: new Error('fail') }) });
    await expect(applyBackup({ app: 'pmp', data: { clientes: [{ id: '1', nombre: 'Ana' }], cuotas: [] } })).rejects.toThrow('fail');
  });
  it('fuerza org_id actual y rechaza cuotas huérfanas', async () => {
    const orgChain = mockSessionOrg();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : { upsert });
    await expect(applyBackup({ app: 'pmp', data: { prestamos: [{ id: 'p1' }], cuotas: [{ id: 'c1', prestamo_id: 'otro' }] } })).rejects.toThrow('sin préstamo');
    // org_id del archivo se ignora: se fuerza el actual
    const parsed = { app: 'pmp', data: { clientes: [{ id: '1', nombre: 'Ana', org_id: 'org-ajeno' }] } };
    await applyBackup(parsed);
    expect(upsert).toHaveBeenCalledWith([{ id: '1', nombre: 'Ana', org_id: 'org-1' }], expect.anything());
  });
  it('filtra filas sin id y columnas no permitidas', async () => {
    const orgChain = mockSessionOrg();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : { upsert });
    const parsed = { app: 'pmp', data: { clientes: [{ nombre: 'Sin id' }, { id: '2', nombre: 'Ok', hacker: 1 }] } };
    await applyBackup(parsed);
    expect(upsert).toHaveBeenCalledWith([{ id: '2', nombre: 'Ok', org_id: 'org-1' }], expect.anything());
  });
  it('restaura en chunks de 200', async () => {
    const orgChain = mockSessionOrg();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : { upsert });
    const rows = Array.from({ length: 250 }, (_, i) => ({ id: `c${i}`, nombre: `N${i}` }));
    await applyBackup({ app: 'pmp', data: { clientes: rows } });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0][0]).toHaveLength(200);
    expect(upsert.mock.calls[1][0]).toHaveLength(50);
  });
});

describe('buildBackup', () => {
  it('lanza si no user', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } });
    await expect(buildBackup()).rejects.toThrow('No authenticated user');
  });
  it('construye backup con cuotas', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const single = vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null });
    // org_members
    const orgChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single };
    orgChain.select.mockReturnValue(orgChain); orgChain.eq.mockReturnValue(orgChain);
    const rowsChain = (rows) => {
      const c = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
      c.then = (res) => Promise.resolve({ data: rows, error: null }).then(res);
      c.select.mockReturnValue(c); c.eq.mockReturnValue(c); c.in.mockReturnValue(c); c.range.mockReturnValue(c);
      return c;
    };
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      call++;
      if (t === 'org_members') return orgChain;
      if (t === 'cuotas') return rowsChain([{ id: 'cu1' }]);
      return rowsChain([{ id: '1' }]);
    });
    const r = await buildBackup();
    expect(r.app).toBe('pmp');
    expect(r.data.cuotas).toHaveLength(1);
  });
  it('lanza si falla la query de cuotas', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const single = vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null });
    const orgChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single };
    orgChain.select.mockReturnValue(orgChain); orgChain.eq.mockReturnValue(orgChain);
    const errChain = {
      select() { return this; }, eq() { return this; }, in() { return this; }, range() { return this; },
      then(res) { return Promise.resolve({ data: null, error: new Error('db') }).then(res); },
    };
    const okChain = (rows) => {
      const c = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
      c.then = (res) => Promise.resolve({ data: rows, error: null }).then(res);
      c.select.mockReturnValue(c); c.eq.mockReturnValue(c); c.in.mockReturnValue(c); c.range.mockReturnValue(c);
      return c;
    };
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'org_members') return orgChain;
      if (t === 'cuotas') return errChain;
      return okChain([{ id: 'p1' }]);
    });
    await expect(buildBackup()).rejects.toThrow('db');
  });
  it('downloadBackup crea blob', async () => {
    vi.useFakeTimers();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const single = vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null });
    const orgChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single };
    orgChain.select.mockReturnValue(orgChain); orgChain.eq.mockReturnValue(orgChain);
    const rowsChain = (rows) => {
      const c = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
      c.then = (res) => Promise.resolve({ data: rows, error: null }).then(res);
      c.select.mockReturnValue(c); c.eq.mockReturnValue(c); c.in.mockReturnValue(c); c.range.mockReturnValue(c);
      return c;
    };
    vi.mocked(supabase.from).mockImplementation((t) => t === 'org_members' ? orgChain : rowsChain([]));
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    const click = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { el.click = click; return el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    const p = downloadBackup();
    await vi.advanceTimersByTimeAsync(10);
    await p;
    expect(click).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
