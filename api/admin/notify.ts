import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';

const NOTIFY_FILE = '/tmp/themindnetwork_admin_notify.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const payload = req.body || {};
      const obj = {
        lastUpdate: new Date().toISOString(),
        source: payload.source || 'frontend'
      };
      await fs.writeFile(NOTIFY_FILE, JSON.stringify(obj, null, 2), 'utf8');
      return res.status(200).json({ success: true, note: 'Notified admin', ...obj });
    }

    if (req.method === 'GET') {
      try {
        const txt = await fs.readFile(NOTIFY_FILE, 'utf8');
        const parsed = JSON.parse(txt || '{}');
        return res.status(200).json(parsed);
      } catch (err: any) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'No notify record' });
        throw err;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[ADMIN/NOTIFY] Error:', err);
    return res.status(500).json({ error: 'Notify failed', details: err?.message });
  }
}
