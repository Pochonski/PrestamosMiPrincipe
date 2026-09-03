import { describe, it, expect, vi } from 'vitest';
import { chunkedQuery } from '../selectors';

describe('chunkedQuery', () => {
  it('itera chunks', async () => {
    const builder = () => ({ range: (a,b) => Promise.resolve({ data: a===0 ? [{id:1},{id:2}] : [], error: null }) });
    const gen = chunkedQuery('t', builder, 2)();
    const rows = [];
    for await (const r of gen) rows.push(r);
    expect(rows).toHaveLength(2);
  });
  it('lanza error', async () => {
    const builder = () => ({ range: () => Promise.resolve({ data: null, error: new Error('fail') }) });
    const gen = chunkedQuery('t', builder, 2)();
    await expect(gen.next()).rejects.toThrow('fail');
  });
  it('vacio retorna', async () => {
    const builder = () => ({ range: () => Promise.resolve({ data: [], error: null }) });
    const gen = chunkedQuery('t', builder, 2)();
    const rows = [];
    for await (const r of gen) rows.push(r);
    expect(rows).toHaveLength(0);
  });
  it('multi paginas', async () => {
    const builder = () => ({
      range: (a,b) => Promise.resolve({ data: a===0 ? [{id:1},{id:2}] : a===2 ? [{id:3}] : [], error: null })
    });
    const gen = chunkedQuery('t', builder, 2)();
    const rows = [];
    for await (const r of gen) rows.push(r);
    expect(rows).toHaveLength(3);
  });
});
