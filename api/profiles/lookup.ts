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
    const profiles = await readProfilesFile();

    const found = profiles.find((p: any) => {
      const pPhone = p?.basicInfo?.phone || p?.phone || '';
      const pNorm = normalizePhone(pPhone);
      if (!pNorm) return false;
      if (norm.length >= 10 && pNorm.endsWith(norm.slice(-10))) return true;
      return pNorm === norm;
    });

    if (!found) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(found);
  } catch (err: any) {
    console.error('Lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed', details: err?.message });
  }
}
