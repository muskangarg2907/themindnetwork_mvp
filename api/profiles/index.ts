import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

async function writeProfilesFile(profiles: any) {
  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(profiles, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
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
      const record = { id, ...payload, createdAt: new Date().toISOString() };
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
