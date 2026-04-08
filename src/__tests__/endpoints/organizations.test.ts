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
import { POST as removeMember } from '@/app/api/organizations/members/remove/route';
import { POST as restoreMember } from '@/app/api/organizations/members/restore/route';
import { POST as updateRole } from '@/app/api/organizations/members/update-role/route';
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

  it('should return empty list when user is authenticated but has no organizations', async () => {
    setupMocks({ id: 'user-1' }, { organizations: [] });

    const req = createMockRequest('http://api/organizations/list');
    const res = await listOrg(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.organizations).toEqual([]);
  });

  it('should return 401 when user is unauthenticated', async () => {
    setupMocks(null);

    const req = createMockRequest('http://api/organizations/list');
    const res = await listOrg(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe('API Route › /api/organizations/create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when user is not authenticated', async () => {
    setupMocks(null);

    const req = createMockRequest('http://api/organizations/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Org' }),
    });
    const res = await createOrg(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it('should create a new organization for an admin user', async () => {
    setupMocks(
      { id: 'user-1', email: 'test@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }], full_name: 'Test Admin' }],
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

describe('API Route › /api/organizations/members/remove (Soft Delete)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when user is not authenticated', async () => {
    setupMocks(null);

    const req = createMockRequest('http://api/organizations/members/remove', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2' }),
    });
    const res = await removeMember(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it('should return 403 when user has insufficient permissions', async () => {
    setupMocks(
      { id: 'user-1', email: 'user@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_user' }] }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/remove', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2' }),
    });
    const res = await removeMember(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(403);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should soft-delete member (mark as removed) instead of hard delete', async () => {
    const orgMembers = [
      { id: 'user-1', email: 'admin@example.com', role: 'account_admin' },
      { id: 'user-2', email: 'member@example.com', role: 'account_user' }
    ];
    
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] }],
        organizations: [{ id: 'org-1', name: 'Test Org', created_by: 'user-1', members: orgMembers }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/remove', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await removeMember(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.member.status).toBe('removed');
    expect(data.member.removed_at).toBeDefined();
    expect(data.member.removed_by).toBe('user-1');
  });

  it('should prevent removing the organization creator', async () => {
    const orgMembers = [
      { id: 'user-1', email: 'admin@example.com', role: 'account_admin' }
    ];
    
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] }],
        organizations: [{ id: 'org-1', name: 'Test Org', created_by: 'user-1', members: orgMembers }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/remove', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await removeMember(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(403);
    expect(data.error).toBe('Cannot remove the organization creator');
  });

  it('should apply IDOR protection - cannot remove members from other organizations', async () => {
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] }],
        organizations: [{ id: 'org-2', name: 'Other Org', created_by: 'user-3', members: [] }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/remove', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-2', member_id: 'user-2' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await removeMember(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(403);
    expect(data.error).toBe('Insufficient permissions');
  });
});

describe('API Route › /api/organizations/members/restore', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when user is not authenticated', async () => {
    setupMocks(null);

    const req = createMockRequest('http://api/organizations/members/restore', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2' }),
    });
    const res = await restoreMember(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it('should restore a removed member back to active status', async () => {
    const orgMembers = [
      { id: 'user-1', email: 'admin@example.com', role: 'account_admin' },
      { 
        id: 'user-2', 
        email: 'member@example.com', 
        role: 'account_user',
        status: 'removed',
        removed_at: '2026-01-01T00:00:00Z',
        removed_by: 'user-1'
      }
    ];
    
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [
          { id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] },
          { id: 'user-2', roles: [] }
        ],
        organizations: [{ id: 'org-1', name: 'Test Org', created_by: 'user-1', members: orgMembers }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/restore', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await restoreMember(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.member.status).toBe('active');
    expect(data.member.restored_at).toBeDefined();
    expect(data.member.removed_at).toBeUndefined();
  });

  it('should return 400 when trying to restore a member that is not removed', async () => {
    const orgMembers = [
      { id: 'user-1', email: 'admin@example.com', role: 'account_admin' },
      { id: 'user-2', email: 'member@example.com', role: 'account_user', status: 'active' }
    ];
    
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] }],
        organizations: [{ id: 'org-1', name: 'Test Org', created_by: 'user-1', members: orgMembers }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/restore', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await restoreMember(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(400);
    expect(data.error).toBe('Member is not in removed status');
  });
});

describe('API Route › /api/organizations/members/update-role', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update member role successfully', async () => {
    const orgMembers = [
      { id: 'user-1', email: 'admin@example.com', role: 'account_admin' },
      { id: 'user-2', email: 'member@example.com', role: 'account_user' }
    ];
    
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [
          { id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] },
          { id: 'user-2', roles: [{ organization_id: 'org-1', role: 'account_user' }] }
        ],
        organizations: [{ id: 'org-1', name: 'Test Org', created_by: 'user-1', members: orgMembers }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/update-role', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2', new_role: 'account_admin' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await updateRole(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Role updated successfully');
  });

  it('should return 400 for invalid role values', async () => {
    const orgMembers = [
      { id: 'user-1', email: 'admin@example.com', role: 'account_admin' },
      { id: 'user-2', email: 'member@example.com', role: 'account_user' }
    ];
    
    setupMocks(
      { id: 'user-1', email: 'admin@example.com' },
      {
        users: [{ id: 'user-1', roles: [{ organization_id: 'org-1', role: 'account_admin' }] }],
        organizations: [{ id: 'org-1', name: 'Test Org', created_by: 'user-1', members: orgMembers }],
      }
    );

    const req = createMockRequest('http://api/organizations/members/update-role', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org-1', member_id: 'user-2', new_role: 'invalid_role' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await updateRole(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(400);
    expect(data.error).toBe('Invalid role');
  });
});