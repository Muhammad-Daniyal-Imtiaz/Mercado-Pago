/**
 * auth.test.ts
 *
 * Integration tests for Auth API endpoints.
 */

// Mocks MUST be declared before any import that transitively loads the real modules
jest.mock('@/utils/supabase/server');
jest.mock('@/utils/supabase/admin');

import { GET as getSession } from '@/app/api/auth/session/route';
import { parseResponse } from '../helpers/api';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

function createQueryMock(data: unknown): Record<string, unknown> {
  let isSingle = false;
  const mock: Record<string, unknown> = {
    select: () => mock,
    eq: () => mock,
    in: () => mock,
    single: () => { isSingle = true; return mock; },
    insert: () => mock,
    update: () => mock,
    delete: () => mock,
    upsert: () => mock,
    then: (onFulfilled: (res: { data: unknown; error: null }) => void) => {
      const resolved = isSingle ? (Array.isArray(data) ? data[0] ?? null : data) : data;
      return onFulfilled({ data: resolved, error: null });
    },
    get data() { return isSingle ? (Array.isArray(data) ? data[0] ?? null : data) : data; },
    error: null,
  };
  return mock;
}

function setupMocks(user: Record<string, unknown> | null, dbResponses: Record<string, unknown[]> = {}) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue(
        user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: new Error('Auth session missing!') }
      ),
    },
  });
  (createAdminClient as jest.Mock).mockReturnValue({
    from: jest.fn((_table: string) => createQueryMock(dbResponses[_table] || [])),
  });
}

describe('API Route › /api/auth/session', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when no authenticated user', async () => {
    setupMocks(null);

    const res = await getSession();
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });

  it('should return user data with profile and memberships', async () => {
    setupMocks(
      { id: 'user-1', email: 'test@example.com', user_metadata: {} },
      {
        users: [{
          id: 'user-1',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'account_admin',
          is_verified: true,
          avatar_url: null,
          organization_id: 'org-1',
          roles: JSON.stringify([{ organization_id: 'org-1', role: 'account_admin' }]),
        }],
        organizations: [{ id: 'org-1', name: 'Test Org' }],
      }
    );

    const res = await getSession();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.fullName).toBe('Test User');
    expect(data.user.memberships).toBeDefined();
  });

  it('should return basic user data when profile is not found', async () => {
    setupMocks(
      { id: 'user-1', email: 'test@example.com', user_metadata: { full_name: 'Fallback Name', role: 'account_user' } },
      { users: [] } // No profile found → single() returns null
    );

    const res = await getSession();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.user.fullName).toBe('Fallback Name');
    expect(data.user.role).toBe('account_user');
  });
});