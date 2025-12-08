import { UserProfile } from '../types';

// On Vercel, use relative /api paths which route to serverless functions.
// In dev, Vite proxy handles /api routes to localhost:4000
const VITE_API_URL = (import.meta as any)?.env?.VITE_API_URL || '';

function buildUrl(path: string) {
  if (VITE_API_URL) {
    const base = VITE_API_URL.replace(/\/$/, '');
    return `${base}${path}`;
  }
  // Default: relative path (works with Vercel and Vite dev proxy)
  return path;
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
