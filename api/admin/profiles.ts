import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

const DATA_FILE = '/tmp/themindnetwork_profiles.json';

// Seed profiles
const SEED_PROFILES = [
  {
    id: 'bfdb2397-a73e-4986-a2ec-19a1c4e6ca7c',
    status: 'pending_verification',
    role: 'provider',
    basicInfo: {
      fullName: 'Muskan Garg',
      email: 'muskangarg.official@gmail.com',
      phone: '+91 8972949649',
      dob: '1999-07-29',
      location: 'Patiala',
      gender: 'Female'
    },
    createdAt: '2025-12-08T09:17:53.657Z'
  },
  {
    id: 'be000ad4-a571-4d38-b355-c628c98ec491',
    status: 'pending_verification',
    role: 'provider',
    basicInfo: {
      fullName: 'Muskan Garg',
      email: 'muskangarg.official@gmail.com',
      phone: '+91 9501366244',
      dob: '1999-07-29',
      location: 'Bangalore',
      gender: 'Female'
    },
    createdAt: '2025-12-08T16:07:52.230Z'
  }
];

async function readProfilesFile() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(txt || '[]');
    // Return parsed data as-is; don't fallback to SEED_PROFILES
    // This allows truly empty state when admin deletes all profiles
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    console.error('Read error:', err);
    return [];
  }
}

async function writeProfilesFile(profiles: any) {
  try {
    const tmp = DATA_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(profiles, null, 2), 'utf8');
    await fs.rename(tmp, DATA_FILE);
  } catch (err: any) {
    console.error('Write error:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET all profiles (for admin dashboard)
    if (req.method === 'GET') {
      const profiles = await readProfilesFile();
      return res.status(200).json({ profiles, total: profiles.length });
    }

    // DELETE profile by ID
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'id query parameter required' });
      }
      const profiles = await readProfilesFile();
      const filtered = profiles.filter((p: any) => p.id !== id);
      await writeProfilesFile(filtered);
      console.log('[ADMIN] Deleted profile:', id);
      return res.status(200).json({ message: 'Profile deleted', success: true });
    }

    // PUT to update/approve profile
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id query parameter required' });
      }
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid update payload' });
      }

      const profiles = await readProfilesFile();
      const idx = profiles.findIndex((p: any) => p.id === id);

      if (idx === -1) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Merge updates
      profiles[idx] = {
        ...profiles[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await writeProfilesFile(profiles);
      console.log('[ADMIN] Updated profile:', id, 'status:', profiles[idx].status);
      return res.status(200).json({ message: 'Profile updated', profile: profiles[idx] });
    }

    // POST to reset all profiles
    if (req.method === 'POST') {
      const { action } = req.body;
      if (action === 'reset') {
        try {
          await fs.unlink(DATA_FILE);
          console.log('[ADMIN] Reset all profiles');
        } catch (err: any) {
          if (err.code !== 'ENOENT') throw err;
        }
        return res.status(200).json({ message: 'All profiles deleted', success: true });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[ADMIN] Error:', err);
    return res.status(500).json({ error: 'Admin operation failed', details: err?.message });
  }
}
