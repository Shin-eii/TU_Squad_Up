import { apiRequest } from './client.js';

export async function createActivity(activity) {
  const payload = await apiRequest('/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
  return payload.activity;
}
