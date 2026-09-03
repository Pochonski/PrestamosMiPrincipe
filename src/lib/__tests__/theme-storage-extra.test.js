import { describe, it, expect, vi } from 'vitest';
import { getTheme, setTheme, applyTheme } from '../theme-storage';

describe('theme-storage edge', () => {
  it('getTheme fallback light si localStorage throw', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(getTheme()).toBe('light');
    spy.mockRestore();
  });
  it('setTheme no throw si localStorage throw', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => setTheme('dark')).not.toThrow();
    spy.mockRestore();
    localStorage.clear();
  });
  it('applyTheme early return si document undefined', () => {
    const orig = global.document;
    // @ts-ignore
    delete global.document;
    expect(() => applyTheme('dark')).not.toThrow();
    global.document = orig;
  });
});
