import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('supabase env warn', () => {
  it('supabase definido', async () => {
    const mod = await import('../supabase.js');
    expect(mod.supabase).toBeDefined();
    expect(typeof mod.getOrgId).toBe('function');
  });
});
