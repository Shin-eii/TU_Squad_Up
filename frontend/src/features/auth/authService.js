import { DEMO_ACCOUNTS } from './mockAccounts.js';

// Auth service used by the UI. Every call goes through `request()`, which returns
// the same envelope the planned API will: `{ data }` on success or
// `{ error: { code, message } }` on failure.
//
// To switch to the real backend, replace `request()` with a fetch to the Express
// API (POST /api/auth/mock-login, GET /api/me, POST /api/auth/logout) and let the
// server keep the session in a cookie. Nothing else, including the UI, needs to change.

const SESSION_KEY = 'tu-squad-up.session.v1';
const MOCK_DELAY_MS = 400;

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// ---------- Mock "server" (browser only) ----------

function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null; // Storage blocked: behave as logged out.
  }
}

function writeSession(memberId) {
  try {
    if (memberId) localStorage.setItem(SESSION_KEY, memberId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: the login still works until the page is refreshed.
  }
}

const ok = (data) => ({ data });
const fail = (code, message) => ({ error: { code, message } });

function publicMember({ demo_role, ...member }) {
  return member;
}

function mockServer(method, path, body) {
  if (method === 'POST' && path === '/api/auth/mock-login') {
    const account = DEMO_ACCOUNTS.find((a) => a.member_id === body?.member_id);
    if (!account) return fail('MEMBER_NOT_FOUND', 'That demo account does not exist.');
    if (account.account_status !== 'ACTIVE') {
      return fail('ACCOUNT_SUSPENDED', 'This account is suspended. Contact a TU Squad Up administrator.');
    }
    writeSession(account.member_id);
    return ok({ member: publicMember(account) });
  }
  if (method === 'GET' && path === '/api/me') {
    const account = DEMO_ACCOUNTS.find((a) => a.member_id === readSession());
    if (!account || account.account_status !== 'ACTIVE') {
      writeSession(null);
      return fail('UNAUTHENTICATED', 'Please sign in.');
    }
    return ok({ member: publicMember(account) });
  }
  if (method === 'POST' && path === '/api/auth/logout') {
    writeSession(null);
    return ok({});
  }
  return fail('NOT_FOUND', `${method} ${path} is not available in the mock.`);
}

async function request(method, path, body) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  const response = mockServer(method, path, body);
  if (response.error) throw new AuthError(response.error.code, response.error.message);
  return response.data;
}

// ---------- Service used by the UI ----------

export const authService = {
  /** Signs in as a demo member. Resolves with the member; rejects with AuthError. */
  async login(accountId) {
    const { member } = await request('POST', '/api/auth/mock-login', { member_id: accountId });
    return member;
  },

  async logout() {
    await request('POST', '/api/auth/logout');
  },

  /** Returns the signed-in member, or null when there is no valid session. */
  async getCurrentMember() {
    try {
      const { member } = await request('GET', '/api/me');
      return member;
    } catch (err) {
      if (err instanceof AuthError && err.code === 'UNAUTHENTICATED') return null;
      throw err;
    }
  },
};
