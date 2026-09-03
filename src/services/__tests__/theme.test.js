import { describe, it, expect } from 'vitest';
import * as theme from '../theme';

describe('theme re-export', () => {
  it('expone funciones', () => {
    expect(typeof theme.getTheme).toBe('function');
    expect(typeof theme.setTheme).toBe('function');
  });
});
