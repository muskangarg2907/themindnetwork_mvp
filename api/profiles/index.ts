import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

const DATA_FILE = '/tmp/themindnetwork_profiles.json';

// Normalize phone: extract last 10 digits (for Indian numbers)
function normalizePhone(s: string) {
  if (!s) return '';
  const digits = String(s).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Seed profiles - fallback data
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
    return parsed.length > 0 ? parsed : SEED_PROFILES;
  } catch (err: any) {
    if (err.code === 'ENOENT') return SEED_PROFILES;
    console.error('Read error:', err);
    return SEED_PROFILES;
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
    if (req.method === 'GET') {
      const profiles = await readProfilesFile();
      return res.status(200).json(profiles);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      const id = randomUUID();
      const profiles = await readProfilesFile();
      
      // Normalize phone in basicInfo for consistent lookup
      const normalizedPayload = {
        ...payload,
        basicInfo: {
          ...payload.basicInfo,
          phone: normalizePhone(payload.basicInfo?.phone || '')
        }
      };
      
      const record = { id, ...normalizedPayload, createdAt: new Date().toISOString() };
      profiles.push(record);
      await writeProfilesFile(profiles);
      return res.status(201).json(record);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
