import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getProfilesCollection } from '../db.js';

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
    const profiles = await getProfilesCollection();

    // GET all profiles (for admin dashboard)
    if (req.method === 'GET') {
      const allProfiles = await profiles.find({}).toArray();
      return res.status(200).json({ profiles: allProfiles, total: allProfiles.length });
    }

    // DELETE profile by ID
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'id query parameter required' });
      }
      const result = await profiles.deleteOne({ _id: new ObjectId(id as string) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      console.log('[ADMIN] Deleted profile:', id);
      return res.status(200).json({ message: 'Profile deleted', success: true });
    }

    // PUT to update/approve profile
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;

      console.log('[ADMIN] PUT request - id:', id, 'updates:', updates);

      if (!id) {
        return res.status(400).json({ error: 'id query parameter required' });
      }
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid update payload' });
      }

      try {
        const objectId = new ObjectId(id as string);
        console.log('[ADMIN] Converted to ObjectId:', objectId);

        const result = await profiles.findOneAndUpdate(
          { _id: objectId },
          {
            $set: {
              ...updates,
              updatedAt: new Date().toISOString()
            }
          },
          { returnDocument: 'after' }
        );

        console.log('[ADMIN] Update result:', result);

        if (!result) {
          console.log('[ADMIN] Profile not found for id:', id);
          return res.status(404).json({ error: 'Profile not found' });
        }

        console.log('[ADMIN] Updated profile:', id, 'new status:', result.status);
        return res.status(200).json({ message: 'Profile updated', profile: result });
      } catch (updateErr: any) {
        console.error('[ADMIN] Update error:', updateErr);
        return res.status(500).json({ error: 'Update failed', details: updateErr.message });
      }
    }

    // POST to reset all profiles
    if (req.method === 'POST') {
      const { action } = req.body;
      if (action === 'reset') {
        const result = await profiles.deleteMany({});
        console.log('[ADMIN] Reset all profiles. Deleted:', result.deletedCount);
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
