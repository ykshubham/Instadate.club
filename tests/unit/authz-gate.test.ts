import { describe, it, expect } from 'vitest';
import { requireAuthedActive } from '../../worker/authz';
import type { Principal } from '../../worker/auth';

function req(method = 'GET') {
  return new Request('https://x/api/y', { method });
}

function principal(over: Partial<Principal>): Principal {
  return {
    kind: 'user',
    userId: 'user-1',
    sessionId: 'sess-1',
    status: 'active',
    ...over
  };
}

describe('requireAuthedActive', () => {
  it('rejects a guest with 401', () => {
    const gate = requireAuthedActive(
      { kind: 'guest', userId: null, sessionId: null, status: null },
      req('GET')
    );
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(401);
  });

  it('rejects a "user" principal whose userId is null with 401', () => {
    const gate = requireAuthedActive(
      principal({ userId: null }),
      req('GET')
    );
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(401);
  });

  it('allows an active user on GET and echoes the userId', () => {
    const gate = requireAuthedActive(principal({ status: 'active' }), req('GET'));
    expect(gate.ok).toBe(true);
    if (gate.ok) expect(gate.userId).toBe('user-1');
  });

  it('allows an active user on POST', () => {
    const gate = requireAuthedActive(principal({ status: 'active' }), req('POST'));
    expect(gate.ok).toBe(true);
  });

  it('blocks a banned user on GET with 403', () => {
    const gate = requireAuthedActive(principal({ status: 'banned' }), req('GET'));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(403);
  });

  it('blocks a banned user on POST with 403', () => {
    const gate = requireAuthedActive(principal({ status: 'banned' }), req('POST'));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(403);
  });

  it('blocks a deactivated user with 403', () => {
    const gate = requireAuthedActive(principal({ status: 'deactivated' }), req('GET'));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(403);
  });

  it('allows a suspended user to read (GET)', () => {
    const gate = requireAuthedActive(principal({ status: 'suspended' }), req('GET'));
    expect(gate.ok).toBe(true);
    if (gate.ok) expect(gate.userId).toBe('user-1');
  });

  it('blocks a suspended user from writing (POST) with 403', () => {
    const gate = requireAuthedActive(principal({ status: 'suspended' }), req('POST'));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(403);
  });

  it('blocks a suspended user on DELETE with 403', () => {
    const gate = requireAuthedActive(principal({ status: 'suspended' }), req('DELETE'));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.response.status).toBe(403);
  });

  it('attaches a clearing Set-Cookie header on the 401 guest response', async () => {
    const gate = requireAuthedActive(
      { kind: 'guest', userId: null, sessionId: null, status: null },
      req('GET')
    );
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.response.headers.get('set-cookie')).toContain('Max-Age=0');
    }
  });
});
