import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import { getProfilesCollection } from './db.js';

const NOTIFY_FILE = '/tmp/themindnetwork_admin_notify.json';
const DATA_FILE = '/tmp/themindnetwork_profiles.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  try {
    // PROFILES MANAGEMENT
    if (action === 'profiles') {
      const profiles = await getProfilesCollection();

      if (req.method === 'GET') {
        const allProfiles = await profiles.find({}).toArray();
        return res.status(200).json({ profiles: allProfiles, total: allProfiles.length });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'id query parameter required' });
        }
        
        let query;
        try {
          query = { _id: new ObjectId(id as string) };
        } catch {
          query = { _id: id as string };
        }
        
        const result = await profiles.deleteOne(query);
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        console.log('[ADMIN] Deleted profile:', id);
        return res.status(200).json({ message: 'Profile deleted', success: true });
      }

      if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'id query parameter required' });
        }

        const updates = req.body || {};
        let query;
        try {
          query = { _id: new ObjectId(id as string) };
        } catch {
          query = { _id: id as string };
        }

        const result = await profiles.findOneAndUpdate(
          query,
          { 
            $set: { 
              ...updates, 
              updatedAt: new Date() 
            } 
          },
          { returnDocument: 'after' }
        );

        if (!result) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        console.log('[ADMIN] Updated profile:', id);
        return res.status(200).json(result);
      }
    }

    // NOTIFY MANAGEMENT
    if (action === 'notify') {
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
    }

    // RESET/DELETE ALL
    if (action === 'reset') {
      if (req.method === 'DELETE') {
        try {
          await fs.unlink(DATA_FILE);
          console.log('[ADMIN] Deleted all profiles');
        } catch (err: any) {
          if (err.code !== 'ENOENT') throw err;
        }
        return res.status(200).json({ message: 'All profiles deleted', success: true });
      }

      if (req.method === 'GET') {
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
    }

    return res.status(400).json({ error: 'Invalid action parameter. Use: profiles, notify, or reset' });

  } catch (err: any) {
    console.error('[ADMIN] Error:', err);
    return res.status(500).json({ error: 'Admin operation failed', details: err?.message });
  }
}
