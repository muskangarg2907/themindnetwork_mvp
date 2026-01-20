import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getProfilesCollection } from './db.js';

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

  const { action, phone } = req.query;

  try {
    const profiles = await getProfilesCollection();

    // LOOKUP by phone
    if (action === 'lookup' || phone) {
      const phoneNumber = (phone || req.query.phone) as string;
      if (!phoneNumber) {
        return res.status(400).json({ error: 'phone query parameter required' });
      }

      const norm = normalizePhone(phoneNumber);
      console.log('[LOOKUP] Searching for phone (normalized)');
      
      // Allow any status except rejected (enable payments without verification)
      const found = await profiles.findOne({
        'basicInfo.phone': norm,
        status: { $ne: 'rejected' }
      });

      if (!found) {
        console.log('[LOOKUP] NO MATCH FOUND (or rejected)');
        return res.status(404).json({ error: 'Not found', searched: norm });
      }
      
      console.log('[LOOKUP] FOUND:', found._id, '| Role:', found.role, '| Has payments?', !!found.payments, '| Payment count:', found.payments?.length || 0);
      if (found.payments && found.payments.length > 0) {
        console.log('[LOOKUP] Payment sample:', JSON.stringify(found.payments[0]));
      }
      return res.status(200).json(found);
    }

    // GET all profiles
    if (req.method === 'GET') {
      const allProfiles = await profiles.find({}).toArray();
      console.log('[PROFILES] GET: Found', allProfiles.length, 'profiles');
      
      // Log payment statistics
      const profilesWithPayments = allProfiles.filter(p => p.payments && p.payments.length > 0);
      console.log('[PROFILES] GET: Profiles with payments:', profilesWithPayments.length);
      if (profilesWithPayments.length > 0) {
        console.log('[PROFILES] GET: Sample profile with payments available');
      }
      
      return res.status(200).json(allProfiles);
    }

    // POST create profile
    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      
      const normalizedPayload = {
        ...payload,
        basicInfo: {
          ...payload.basicInfo,
          phone: normalizePhone(payload.basicInfo?.phone || '')
        }
      };

      // DUPLICATE CHECK: Prevent creating duplicate profiles for same phone
      const normalizedPhone = normalizedPayload.basicInfo?.phone;
      if (normalizedPhone) {
        const existing = await profiles.findOne({ 'basicInfo.phone': normalizedPhone });
        if (existing) {
          console.log('[PROFILES] POST: DUPLICATE DETECTED - Phone already exists');
          return res.status(409).json({ 
            error: 'Profile already exists for this phone number',
            _id: existing._id,
            profile: existing
          });
        }
      }

      const record = {
        ...normalizedPayload,
        createdAt: new Date().toISOString()
      };

      console.log('[PROFILES] POST: Saving NEW profile');

      try {
        const result = await profiles.insertOne(record);
        console.log('[PROFILES] POST: Profile saved successfully with _id:', result.insertedId);
        return res.status(201).json({ _id: result.insertedId, ...normalizedPayload, createdAt: record.createdAt });
      } catch (err) {
        console.error('[PROFILES] POST: Insert failed:', err);
        return res.status(500).json({ error: 'Failed to save profile', details: (err as any)?.message });
      }
    }

    // PUT update profile
    if (req.method === 'PUT') {
      const payload = req.body;
      if (!payload || typeof payload !== 'object' || !payload._id) {
        return res.status(400).json({ error: 'Invalid payload or missing _id' });
      }

      const { _id, ...updates } = payload;
      
      console.log('[PROFILES] PUT: Updating profile', _id);
      console.log('[PROFILES] PUT: Has payments?', !!updates.payments, '| Count:', updates.payments?.length || 0);

      try {
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
        console.log('[PROFILES] PUT: Result has payments?', !!result.payments, '| Count:', result.payments?.length || 0);
        return res.status(200).json(result);
      } catch (err) {
        console.error('[PROFILES] PUT: Update failed:', err);
        return res.status(500).json({ error: 'Failed to update profile', details: (err as any)?.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err: any) {
    console.error('[PROFILES] Error:', err);
    return res.status(500).json({ error: 'Profile operation failed', details: err?.message });
  }
}
