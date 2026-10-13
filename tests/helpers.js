import { once } from 'node:events';
import { createApp } from '../app.js';

export const MEMBERS = [
  {
    member_id: 1,
    university_email: 'nont.p@dome.tu.ac.th',
    display_name: 'Nont P.',
    member_type: 'STUDENT',
    is_administrator: 0,
  },
];

export function createFakeDatabase({ members = MEMBERS, categories = [{ category_id: 1 }] } = {}) {
  const calls = [];
  return {
    calls,
    async execute(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('FROM members')) {
        return [members.filter((member) => String(member.member_id) === String(params[0]))];
      }
      if (sql.includes('FROM activity_categories')) return [categories];
      if (sql.includes('INSERT INTO activities')) return [{ insertId: 42, affectedRows: 1 }];
      throw new Error(`Unexpected SQL in test: ${sql}`);
    },
  };
}

export async function startTestServer(database) {
  const server = createApp({ database, sessionSecret: 'test-session-secret' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

export async function request(baseUrl, path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}

export async function login(baseUrl, memberId = 1) {
  return request(baseUrl, '/api/auth/mock-login', { method: 'POST', body: { memberId } });
}

export function validActivity(overrides = {}) {
  const now = Date.now();
  return {
    title: 'Football pickup match',
    description: 'Friendly football game for TU members.',
    category: 'Sports',
    startAt: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    minParticipants: 4,
    maxParticipants: 12,
    joinMode: 'approval',
    costItems: [],
    ...overrides,
  };
}
