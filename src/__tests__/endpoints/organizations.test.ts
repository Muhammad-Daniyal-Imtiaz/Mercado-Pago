/**
 * organizations.test.ts
 *
 * Integration tests for /api/organizations/* endpoints.
 */

// Mocks MUST be declared before any import that transitively loads the real modules
jest.mock('@/utils/supabase/server');
jest.mock('@/utils/supabase/admin');

import { GET as listOrg } from '@/app/api/organizations/list/route';
import { POST as createOrg } from '@/app/api/organizations/create/route';
import { createMockRequest, parseResponse } from '../helpers/api';
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

describe('API Route › /api/organizations/list', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty list if user is authenticated and has no orgs', async () => {
    setupMocks({ id: 'user-1' }, { organizations: [] });

    const req = createMockRequest('http://api/organizations/list');
    const res = await listOrg(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.organizations).toEqual([]);
  });

  it('returns 401 if user is unauthenticated', async () => {
    setupMocks(null);

    const req = createMockRequest('http://api/organizations/list');
    const res = await listOrg(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe('API Route › /api/organizations/create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 if user is not authenticated', async () => {
    setupMocks(null);

    const req = createMockRequest('http://api/organizations/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Org' }),
    });
    const res = await createOrg(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it('creates a new organization for an admin user', async () => {
    setupMocks(
      { id: 'user-1', email: 'test@example.com' },
      {
        users: [{ id: 'user-1', role: 'account_admin', full_name: 'Test Admin' }],
        organizations: [{ id: 'org-1', name: 'New Org' }],
      }
    );

    const req = createMockRequest('http://api/organizations/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Org' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createOrg(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.organization.name).toBe('New Org');
  });
});