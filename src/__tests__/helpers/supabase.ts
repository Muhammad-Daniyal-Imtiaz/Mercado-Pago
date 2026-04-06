import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Global declaration (pure isolation)
jest.mock('@/utils/supabase/server');
jest.mock('@/utils/supabase/admin');

/**
 * Creates a fluent mock builder for Supabase queries.
 * Supports chaining: select, eq, in, single, insert, update, delete, upsert.
 * When `.single()` is called, the data is unwrapped from an array to a single item.
 */
function createQueryMock(data: unknown): Record<string, unknown> {
  let isSingle = false;

  const mock: Record<string, unknown> = {
    select: () => mock,
    eq: () => mock,
    in: () => mock,
    insert: () => mock,
    update: () => mock,
    delete: () => mock,
    upsert: () => mock,
    single: () => {
      isSingle = true;
      return mock;
    },
    then: (onFulfilled: (res: { data: unknown; error: null }) => void) => {
      const resolved = isSingle
        ? (Array.isArray(data) ? data[0] ?? null : data)
        : data;
      return onFulfilled({ data: resolved, error: null });
    },
    get data() { return isSingle ? (Array.isArray(data) ? data[0] ?? null : data) : data; },
    error: null,
  };

  return mock;
}

export function mockSupabaseAuth(user: Record<string, unknown> | null) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue(
        user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: new Error('Auth session missing!') }
      ),
      exchangeCodeForSession: jest.fn().mockResolvedValue(
        user
          ? { data: { session: { user } }, error: null }
          : { data: null, error: new Error('Invalid code') }
      ),
    },
    // Bind DB in case the endpoint does NOT use adminClient
    from: jest.fn((_table: string) => createQueryMock([]))
  });
}

export function mockSupabaseDB(responses: Record<string, unknown[]>): void {
  const from = jest.fn((_table: string) => createQueryMock(responses[_table] || []));
  (createAdminClient as jest.Mock).mockReturnValue({ from });
}