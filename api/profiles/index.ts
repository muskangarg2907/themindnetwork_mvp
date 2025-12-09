import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';
import { getProfilesCollection } from '../db.js';

// Normalize phone: extract last 10 digits (for Indian numbers)
function normalizePhone(s: string) {
  if (!s) return '';
  const digits = String(s).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
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
    const profiles = await getProfilesCollection();

    if (req.method === 'GET') {
      const allProfiles = await profiles.find({}).toArray();
      console.log('[PROFILES] GET: Found', allProfiles.length, 'profiles');
      return res.status(200).json(allProfiles);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const id = randomUUID();
      
      // Normalize phone in basicInfo for consistent lookup
      const normalizedPayload = {
        ...payload,
        basicInfo: {
          ...payload.basicInfo,
          phone: normalizePhone(payload.basicInfo?.phone || '')
        }
      };

      const record = {
        _id: id,
        ...normalizedPayload,
        createdAt: new Date().toISOString()
      };

      console.log('[PROFILES] POST: Saving profile', id, 'with phone:', record.basicInfo?.phone);

      try {
        await profiles.insertOne(record);
        console.log('[PROFILES] POST: Profile saved successfully');
        return res.status(201).json({ _id: id, ...normalizedPayload, createdAt: record.createdAt });
      } catch (err) {
        console.error('[PROFILES] POST: Insert failed:', err);
        return res.status(500).json({ error: 'Failed to save profile', details: (err as any)?.message });
      }
    }

    if (req.method === 'PUT') {
      const payload = req.body;
      if (!payload || typeof payload !== 'object' || !payload._id) {
        return res.status(400).json({ error: 'Invalid payload or missing _id' });
      }

      const { _id, ...updates } = payload;
      
      console.log('[PROFILES] PUT: Updating profile', _id);

      try {
        // Try to use as ObjectId, fallback to string match for UUID
        let query;
        try {
          query = { _id: new ObjectId(_id) };
        } catch {
          query = { _id: _id };
        }
        
        const result = await profiles.findOneAndUpdate(
          query,
          {
            $set: {
              ...updates,
              updatedAt: new Date().toISOString()
            }
          },
          { returnDocument: 'after' }
        );

        if (!result) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        console.log('[PROFILES] PUT: Profile updated successfully');
        return res.status(200).json(result);
      } catch (err) {
        console.error('[PROFILES] PUT: Update failed:', err);
        return res.status(500).json({ error: 'Failed to update profile', details: (err as any)?.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[PROFILES] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
