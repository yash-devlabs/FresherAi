import { supabase } from '@/database/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export async function apiRequest(path, body) {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error('Could not read your sign-in session. Please sign in again.');
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let response;
  try {
    response = await fetch(`${API_URL}${cleanPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (cause) {
    throw new Error('Could not reach the FresherAI API. Check that the backend is running.', { cause });
  }

  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    throw new Error(result.message || result.error || `API request failed with HTTP ${response.status}.`);
  }
  if (!contentType.includes('application/json')) {
    throw new Error('The API returned an unexpected response. Check the backend route configuration.');
  }
  return result;
}
