import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';
import { join } from 'path';

const DATA_FILE = join('/tmp', 'profiles.json');

async function readProfilesFile() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
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
    console.log('Lookup phone normalized:', norm);
    const profiles = await readProfilesFile();
    console.log('Total profiles in storage:', profiles.length);

    const found = profiles.find((p: any) => {
      const pPhone = p?.basicInfo?.phone || p?.phone || '';
      const pNorm = normalizePhone(pPhone);
      console.log('Checking profile phone:', pPhone, 'normalized:', pNorm);
      
      if (!pNorm) return false;
      
      // Match by last 10 digits if both have at least 10 digits
      if (norm.length >= 10 && pNorm.length >= 10) {
        return pNorm.slice(-10) === norm.slice(-10);
      }
      
      // Otherwise exact match
      return pNorm === norm;
    });

    if (!found) {
      console.log('No matching profile found for:', norm);
      return res.status(404).json({ error: 'Not found', searchedPhone: norm });
    }
    
    console.log('Found profile:', found.id);
    return res.status(200).json(found);
  } catch (err: any) {
    console.error('Lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed', details: err?.message });
  }
}
