import { describe, it, expect, beforeEach } from 'vitest';
import { getTheme, setTheme, toggleTheme, applyTheme } from '../theme-storage';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('theme-storage', () => {
  it('getTheme default light', () => expect(getTheme()).toBe('light'));
  it('setTheme guarda y aplica', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  it('setTheme light quita dark', () => {
    setTheme('dark');
    setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
  it('toggleTheme flip', () => {
    expect(toggleTheme()).toBe('dark');
    expect(toggleTheme()).toBe('light');
  });
  it('applyTheme dark/light', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
