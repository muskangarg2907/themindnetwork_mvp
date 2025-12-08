import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';

const DATA_FILE = '/tmp/themindnetwork_profiles.json';

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

function normalizePhone(s: string) {
  if (!s) return '';
  return String(s).replace(/\D/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const phone = req.query.phone as string;
    if (!phone) {
      return res.status(400).json({ error: 'phone query parameter required' });
    }

    const norm = normalizePhone(phone);
    console.log('[LOOKUP] Searching for phone:', phone, 'normalized:', norm);
    
    const profiles = await readProfilesFile();
    console.log('[LOOKUP] Total profiles:', profiles.length);

    const found = profiles.find((p: any) => {
      const pPhone = p?.basicInfo?.phone || p?.phone || '';
      const pNorm = normalizePhone(pPhone);
      
      console.log('[LOOKUP] Checking profile:', p?.id, 'phone:', pPhone, 'normalized:', pNorm);
      
      if (!pNorm) return false;
      
      // Match by last 10 digits
      if (norm.length >= 10 && pNorm.length >= 10) {
        const match = pNorm.slice(-10) === norm.slice(-10);
        console.log('[LOOKUP] Last 10 digits match?', match, pNorm.slice(-10), 'vs', norm.slice(-10));
        return match;
      }
      
      // Exact match
      return pNorm === norm;
    });

    if (!found) {
      console.log('[LOOKUP] NO MATCH FOUND');
      return res.status(404).json({ error: 'Not found', searched: norm });
    }
    
    console.log('[LOOKUP] FOUND:', found.id);
    return res.status(200).json(found);
  } catch (err: any) {
    console.error('[LOOKUP] ERROR:', err);
    return res.status(500).json({ error: 'Lookup failed', details: err?.message });
  }
}
