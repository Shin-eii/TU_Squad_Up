import assert from 'node:assert/strict';
import test from 'node:test';
import { createFakeDatabase, request, startTestServer } from './helpers.js';

test('mock login creates a session, /me returns the member, and logout clears it', async (t) => {
  const server = await startTestServer(createFakeDatabase());
  t.after(server.close);

  const login = await request(server.baseUrl, '/api/auth/mock-login', {
    method: 'POST',
    body: { memberId: 1 },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.member.displayName, 'Nont P.');
  assert.ok(login.cookie?.startsWith('tu.sid='));

  const me = await request(server.baseUrl, '/api/auth/me', { cookie: login.cookie });
  assert.equal(me.status, 200);
  assert.equal(me.body.member.memberId, '1');

  const logout = await request(server.baseUrl, '/api/auth/logout', {
    method: 'POST',
    cookie: login.cookie,
  });
  assert.equal(logout.status, 204);

  const afterLogout = await request(server.baseUrl, '/api/auth/me', { cookie: login.cookie });
  assert.equal(afterLogout.status, 401);
});

test('mock login rejects an unknown member', async (t) => {
  const server = await startTestServer(createFakeDatabase());
  t.after(server.close);

  const response = await request(server.baseUrl, '/api/auth/mock-login', {
    method: 'POST',
    body: { memberId: 999 },
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'MEMBER_NOT_FOUND');
});

test('/me rejects an unauthenticated request', async (t) => {
  const server = await startTestServer(createFakeDatabase());
  t.after(server.close);

  const response = await request(server.baseUrl, '/api/auth/me');
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTH_REQUIRED');
});
