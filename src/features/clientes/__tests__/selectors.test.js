import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/clientes', () => ({ buscar: vi.fn().mockResolvedValue([{ id: '1' }]) }));

import { search, validateNombre } from '../selectors';
import * as clientesService from '../../../services/clientes';

beforeEach(() => vi.clearAllMocks());

describe('clientes selectors', () => {
  it('search delega', async () => {
    const r = await search('ana');
    expect(clientesService.buscar).toHaveBeenCalledWith('ana');
    expect(r).toEqual([{ id: '1' }]);
  });
  it('re-export validateNombre', () => {
    expect(validateNombre('ab')).toBeTruthy();
  });
});
