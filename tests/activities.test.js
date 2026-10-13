import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFakeDatabase,
  login,
  request,
  startTestServer,
  validActivity,
} from './helpers.js';

test('an authenticated member creates a free draft with the session member as host', async (t) => {
  const database = createFakeDatabase();
  const server = await startTestServer(database);
  t.after(server.close);
  const signedIn = await login(server.baseUrl);

  const response = await request(server.baseUrl, '/api/activities', {
    method: 'POST',
    cookie: signedIn.cookie,
    body: { ...validActivity(), hostId: '999' },
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.activity.id, '42');
  assert.equal(response.body.activity.hostId, '1');
  assert.equal(response.body.activity.status, 'draft');

  const insert = database.calls.find((call) => call.sql.includes('INSERT INTO activities'));
  assert.ok(insert);
  assert.equal(insert.params[0], '1');
  assert.equal(insert.params.includes('999'), false);
  assert.match(insert.sql, /VALUES \(\?, \?, NULL, \?, \?/);
});

test('activity creation requires a login', async (t) => {
  const server = await startTestServer(createFakeDatabase());
  t.after(server.close);

  const response = await request(server.baseUrl, '/api/activities', {
    method: 'POST',
    body: validActivity(),
  });
  assert.equal(response.status, 401);
});

test('activity creation rejects invalid fields before executing SQL', async (t) => {
  const database = createFakeDatabase();
  const server = await startTestServer(database);
  t.after(server.close);
  const signedIn = await login(server.baseUrl);
  const callsBefore = database.calls.length;

  const response = await request(server.baseUrl, '/api/activities', {
    method: 'POST',
    cookie: signedIn.cookie,
    body: validActivity({ title: '', description: '', minParticipants: 10, maxParticipants: 2 }),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_FAILED');
  assert.ok(response.body.error.fields.title);
  assert.ok(response.body.error.fields.description);
  assert.ok(response.body.error.fields.capacity);
  assert.equal(database.calls.length, callsBefore);
});

test('activity creation treats a missing JSON body as validation failure', async (t) => {
  const server = await startTestServer(createFakeDatabase());
  t.after(server.close);
  const signedIn = await login(server.baseUrl);

  const response = await request(server.baseUrl, '/api/activities', {
    method: 'POST',
    cookie: signedIn.cookie,
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_FAILED');
});

test('activity creation rejects an unknown category', async (t) => {
  const server = await startTestServer(createFakeDatabase({ categories: [] }));
  t.after(server.close);
  const signedIn = await login(server.baseUrl);

  const response = await request(server.baseUrl, '/api/activities', {
    method: 'POST',
    cookie: signedIn.cookie,
    body: validActivity({ category: 'Unknown' }),
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.error.fields.category);
});

test('paid activity input is rejected because it is outside Issue #4', async (t) => {
  const database = createFakeDatabase();
  const server = await startTestServer(database);
  t.after(server.close);
  const signedIn = await login(server.baseUrl);

  const response = await request(server.baseUrl, '/api/activities', {
    method: 'POST',
    cookie: signedIn.cookie,
    body: validActivity({ costItems: [{ label: 'Court', amount: 500 }] }),
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.error.fields.costItems);
});
