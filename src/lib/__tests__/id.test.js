import { describe, it, expect, vi } from 'vitest';
import { uid } from '../id';

describe('uid', () => {
  it('formato prefix-xxxxx', () => {
    const id = uid('cli');
    expect(id).toMatch(/^cli-[a-z0-9]+$/);
  });
  it('prefix por defecto id', () => {
    expect(uid()).toMatch(/^id-/);
  });
  it('mockeable determinista', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const a = uid('test');
    const b = uid('test');
    expect(a).toBe(b); // mismo tiempo+random
    vi.restoreAllMocks();
  });
  it('diferentes prefijos', () => {
    expect(uid('a')).toMatch(/^a-/);
    expect(uid('b')).toMatch(/^b-/);
  });
});
