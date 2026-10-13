export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message ?? 'The server could not complete the request.');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error?.code;
    this.fields = payload?.error?.fields ?? {};
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}
