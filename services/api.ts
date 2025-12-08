import { UserProfile } from '../types';

// Prefer explicit VITE_API_URL in production; default to relative `/api` so
// the frontend can be served alongside an API (nginx proxy) or use Vite proxy in dev.
const VITE_API_URL = (import.meta as any)?.env?.VITE_API_URL || '';

function buildUrl(path: string) {
  const base = VITE_API_URL.replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}

async function parseErrorResponse(res: Response) {
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const body = await res.json();
      return JSON.stringify(body);
    }
    const text = await res.text();
    return text;
  } catch (e) {
    return res.statusText || 'Unknown error';
  }
}

export async function saveProfile(profile: UserProfile) {
  const url = buildUrl('/api/profiles');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const body = await parseErrorResponse(res);
    throw new Error(`Failed to save profile: ${res.status} ${body}`);
  }

  return await res.json();
}

export async function fetchProfiles() {
  const url = buildUrl('/api/profiles');
  const res = await fetch(url);
  if (!res.ok) {
    const body = await parseErrorResponse(res);
    throw new Error(`Failed to fetch profiles: ${res.status} ${body}`);
  }
  return await res.json();
}
