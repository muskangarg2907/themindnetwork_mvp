import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';

const DATA_FILE = '/tmp/themindnetwork_profiles.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (req.method === 'DELETE') {
      // Delete all profiles
      try {
        await fs.unlink(DATA_FILE);
        console.log('[ADMIN] Deleted all profiles');
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
      }
      return res.status(200).json({ message: 'All profiles deleted', success: true });
    }

    if (req.method === 'GET') {
      // Show current count
      try {
        const txt = await fs.readFile(DATA_FILE, 'utf8');
        const profiles = JSON.parse(txt || '[]');
        return res.status(200).json({ count: profiles.length, profiles });
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          return res.status(200).json({ count: 0, profiles: [], message: 'No profiles file' });
        }
        throw err;
      }
    }

    return res.status(405).json({ error: 'Only GET and DELETE allowed' });
  } catch (err: any) {
    console.error('[ADMIN] Error:', err);
    return res.status(500).json({ error: 'Admin operation failed', details: err?.message });
  }
}
