import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/prestamos', () => ({ listAll: vi.fn() }));
vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));
vi.mock('../../../services/cobros', () => ({ listAll: vi.fn() }));

import { sortGrupos, getCobrosMesDetallado } from '../selectors';
import * as prestamosService from '../../../services/prestamos';
import * as clientesService from '../../../services/clientes';
import * as cobrosService from '../../../services/cobros';

beforeEach(() => vi.clearAllMocks());

function grupo(id, nombre, total, count, ultimo) {
  return { clienteId: id, cliente: { nombre }, total, count, ultimo, cobros: [] };
}

describe('sortGrupos', () => {
  const rows = [
    grupo('b', 'Beto', 100, 3, '2026-09-10'),
    grupo('a', 'Ana', 300, 1, '2026-09-20'),
    grupo('c', 'Carlos', 200, 2, '2026-09-01'),
  ];
  it('total desc por defecto y con sort desconocido', () => {
    expect(sortGrupos(rows).map((g) => g.clienteId)).toEqual(['a', 'c', 'b']);
    expect(sortGrupos(rows, 'raro').map((g) => g.clienteId)).toEqual(['a', 'c', 'b']);
  });
  it('cobros: por count y desempate total', () => {
    expect(sortGrupos(rows, 'cobros').map((g) => g.clienteId)).toEqual(['b', 'c', 'a']);
  });
  it('nombre insensible a tildes', () => {
    const r = [grupo('b', 'Beto'), grupo('a', 'Ána')];
    expect(sortGrupos(r, 'nombre').map((g) => g.clienteId)).toEqual(['a', 'b']);
  });
  it('reciente: último primero', () => {
    expect(sortGrupos(rows, 'reciente').map((g) => g.clienteId)).toEqual(['a', 'b', 'c']);
  });
  it('null -> []', () => expect(sortGrupos(null)).toEqual([]));
});

describe('getCobrosMesDetallado', () => {
  it('agrega cobros, clientes y préstamos', async () => {
    vi.mocked(cobrosService.listAll).mockResolvedValue([{ id: 'c1' }]);
    vi.mocked(clientesService.list).mockResolvedValue([{ id: 'cli' }]);
    vi.mocked(prestamosService.listAll).mockResolvedValue([{ id: 'p1' }]);
    const r = await getCobrosMesDetallado();
    expect(r).toEqual({ cobros: [{ id: 'c1' }], clientes: [{ id: 'cli' }], prestamos: [{ id: 'p1' }] });
    expect(clientesService.list).toHaveBeenCalledWith({ limit: 500, offset: 0 });
  });
});
