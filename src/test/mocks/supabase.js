import { vi } from 'vitest';

function createChain(data = null, error = null, opts = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] ?? null : data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] ?? null : data, error }),
    then: undefined,
  };
  // Make chain thenable for await
  chain.then = (resolve) => Promise.resolve({ data, error, count: opts.count ?? null }).then(resolve);
  // For head:true queries
  if (opts.count !== undefined) {
    chain.then = (resolve) => Promise.resolve({ data: null, error, count: opts.count }).then(resolve);
  }
  return chain;
}

export function mockSupabase() {
  const fromMock = vi.fn((table) => {
    const base = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    // allow chaining: from().select().eq().order() etc -> thenable
    const thenable = (data = [], error = null) => {
      const obj = { ...base };
      obj.then = (resolve) => Promise.resolve({ data, error }).then(resolve);
      return obj;
    };
    // default resolves to empty
    base.then = (resolve) => Promise.resolve({ data: [], error: null }).then(resolve);
    return base;
  });

  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null }),
  };

  return { from: fromMock, rpc, auth };
}

export function createSupabaseMockWithData(overrides = {}) {
  return {
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null }),
    },
    ...overrides,
  };
}
