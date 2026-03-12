import { UserProfile } from '../types';

// On Vercel, always use relative /api paths which route to serverless functions.
// In dev, Vite proxy handles /api routes
function buildUrl(path: string) {
  // Always use relative path (works with Vercel and Vite dev proxy)
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
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const body = await parseErrorResponse(res);
      
      // If duplicate (409), return the existing profile instead of throwing
      if (res.status === 409) {
        try {
          const errorData = JSON.parse(body);
          if (errorData.profile) {
            console.log('[API] Duplicate profile detected, returning existing profile');
            return errorData.profile;
          }
        } catch (e) {
          // If we can't parse, fall through to throw
        }
      }
      
      throw new Error(`Failed to save profile: ${res.status} ${body}`);
    }

    return await res.json();
  } catch (err: any) {
    // For local dev: if backend API isn't available, save to localStorage instead
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('Failed to fetch') || import.meta.env.DEV) {
      console.log('[API] Backend unavailable (local dev mode), saving profile to localStorage');
      // Add timestamps for consistency
      const profileWithTimestamps = {
        ...profile,
        createdAt: profile.createdAt || new Date().toISOString()
      };
      localStorage.setItem('userProfile', JSON.stringify(profileWithTimestamps));
      return profileWithTimestamps;
    }
    throw err;
  }
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
