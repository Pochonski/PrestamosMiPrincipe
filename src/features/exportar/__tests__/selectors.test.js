import { describe, it, expect, vi } from 'vitest';
import { escapeCSV, generateCSV, getColumns, downloadCSV, downloadCSVChunked, exportCSV, getCounts, getDataFor } from '../selectors';
import * as clientesService from '../../../services/clientes';
import * as prestamosService from '../../../services/prestamos';
import * as cobrosService from '../../../services/cobros';

vi.mock('../../../services/clientes', () => ({ list: vi.fn() }));
vi.mock('../../../services/prestamos', () => ({ list: vi.fn() }));
vi.mock('../../../services/cobros', () => ({ list: vi.fn() }));

describe('escapeCSV', () => {
  it('null -> ""', () => expect(escapeCSV(null)).toBe(''));
  it('sin especiales -> raw', () => expect(escapeCSV('hola')).toBe('hola'));
  it('coma -> quoted', () => expect(escapeCSV('a,b')).toBe('"a,b"'));
  it('comilla duplica', () => expect(escapeCSV('a"b')).toBe('"a""b"'));
  it('salto línea -> quoted', () => expect(escapeCSV('a\nb')).toBe('"a\nb"'));
  it('número', () => expect(escapeCSV(123)).toBe('123'));
});

describe('generateCSV', () => {
  it('header + rows', () => {
    const cols = [{ key: 'nombre', label: 'Nombre' }, { key: 'ced', label: 'Cédula' }];
    const items = [{ nombre: 'Ana', ced: '1-1' }, { nombre: 'Bob, Jr.', ced: '2-2' }];
    const csv = generateCSV(items, cols);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Nombre,Cédula');
    expect(lines[1]).toBe('Ana,1-1');
    expect(lines[2]).toBe('"Bob, Jr.",2-2');
  });
  it('vacío solo header', () => {
    const cols = [{ key: 'id', label: 'ID' }];
    expect(generateCSV([], cols)).toBe('ID');
  });
});

describe('getColumns', () => {
  it('clientes', () => expect(getColumns('clientes').length).toBeGreaterThan(0));
  it('desconocido -> []', () => expect(getColumns('xxx')).toEqual([]));
});

describe('downloadCSV', () => {
  it('crea blob y anchor', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { el.click = click; return el; });
    const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    downloadCSV('test.csv', 'a,b\n1,2');
    await vi.advanceTimersByTimeAsync(10);
    expect(createObjectURL).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    appendChild.mockRestore(); removeChild.mockRestore();
    vi.useRealTimers();
  });
});

describe('getDataFor / exportCSV / getCounts', () => {
  it('getDataFor clientes', async () => {
    vi.mocked(clientesService.list).mockResolvedValue([{ id: '1' }]);
    expect(await getDataFor('clientes')).toEqual([{ id: '1' }]);
  });
  it('exportCSV retorna count', async () => {
    vi.useFakeTimers();
    vi.mocked(prestamosService.list).mockResolvedValue([{ id: '1', nombre: 'A' }]);
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { el.click = vi.fn(); return el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    const p = exportCSV('prestamos');
    await vi.advanceTimersByTimeAsync(10);
    const n = await p;
    expect(n).toBe(1);
    vi.useRealTimers();
  });
  it('exportCSV >500 usa chunked', async () => {
    vi.useFakeTimers();
    const many = Array.from({ length: 600 }, (_, i) => ({ id: String(i), prestamo_id: 'p1', cliente_id: 'c1', cuota_numero: 1, monto: 100, tipo: 'cuota', fecha: new Date().toISOString() }));
    vi.mocked(cobrosService.list).mockResolvedValue(many);
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { el.click = vi.fn(); return el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    const p = exportCSV('cobros');
    await vi.advanceTimersByTimeAsync(50);
    // flush remaining chunks
    await vi.advanceTimersByTimeAsync(100);
    const n = await p;
    expect(n).toBe(600);
    vi.useRealTimers();
  });
  it('downloadCSVChunked batch', async () => {
    vi.useFakeTimers();
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { el.click = vi.fn(); return el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    const cols = [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }];
    const items = [{ id: '1', nombre: 'Ana' }, { id: '2', nombre: 'Bob' }];
    const p = downloadCSVChunked('test.csv', items, cols);
    await vi.advanceTimersByTimeAsync(20);
    const n = await p;
    expect(n).toBe(2);
    vi.useRealTimers();
  });
  it('getCounts', async () => {
    vi.mocked(clientesService.list).mockResolvedValue([{}, {}]);
    vi.mocked(prestamosService.list).mockResolvedValue([{}]);
    vi.mocked(cobrosService.list).mockResolvedValue([{}, {}, {}]);
    const r = await getCounts();
    expect(r.clientes).toBe(2);
    expect(r.cobros).toBe(3);
  });
});
