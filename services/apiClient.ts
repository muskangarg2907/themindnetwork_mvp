// Centralized API client with basic retry and unified error handling
import type { UserProfile } from '../types';

function buildUrl(path: string) {
  return path; // Relative path works in dev and prod
}

async function parseErrorResponse(res: Response) {
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return await res.json();
    return await res.text();
  } catch {
    return res.statusText || 'Unknown error';
  }
}

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      // Retry on 5xx
      if (res.status >= 500 && res.status < 600) continue;
      return res; // Return for caller to handle
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Network error');
}

export class APIClient {
  // Profiles
  async getProfiles(): Promise<UserProfile[]> {
    const res = await fetchWithRetry(buildUrl('/api/profiles'));
    if (!res.ok) throw new Error(`Failed profiles: ${res.status}`);
    return res.json();
  }

  async lookupProfileByPhone(phone: string): Promise<UserProfile | null> {
    const res = await fetchWithRetry(buildUrl(`/api/profiles?action=lookup&phone=${encodeURIComponent(phone)}`));
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await parseErrorResponse(res);
      throw new Error(`Lookup failed: ${res.status} ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    const res = await fetchWithRetry(buildUrl('/api/profiles'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const body = await parseErrorResponse(res);
      if ((res.status === 409) && (body as any)?.profile) {
        return (body as any).profile; // Return existing
      }
      throw new Error(`Create failed: ${res.status} ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const res = await fetchWithRetry(buildUrl('/api/profiles'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const body = await parseErrorResponse(res);
      throw new Error(`Update failed: ${res.status} ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  // Snapshot
  async sendSnapshotMessage(payload: any): Promise<any> {
    const res = await fetchWithRetry(buildUrl('/api/snapshot'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await parseErrorResponse(res);
      throw new Error(`Snapshot failed: ${res.status} ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async getSnapshot(id: string): Promise<any> {
    const res = await fetchWithRetry(buildUrl(`/api/snapshot?action=get&snapshotId=${encodeURIComponent(id)}`));
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await parseErrorResponse(res);
      throw new Error(`Get snapshot failed: ${res.status} ${JSON.stringify(body)}`);
    }
    return res.json();
  }
}

export const apiClient = new APIClient();
