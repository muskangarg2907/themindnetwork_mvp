import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import { getProfilesCollection } from '../lib/db.js';

const NOTIFY_FILE = '/tmp/themindnetwork_admin_notify.json';
const DATA_FILE = '/tmp/themindnetwork_profiles.json';
const REFERRALS_FILE = '/tmp/themindnetwork_referrals.json';

function checkAdminAuth(req: VercelRequest): boolean {
  const token = req.headers['x-admin-token'];
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false; // block all if env var not set
  return token === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  // LOGIN — validates password against env var, no other auth needed
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { password } = req.body || {};
    const secret = process.env.ADMIN_SECRET;
    if (!secret || !password || password !== secret) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(200).json({ success: true, token: secret });
  }

  // All other actions require valid admin token
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // PROFILES MANAGEMENT
    if (action === 'profiles') {
      const profiles = await getProfilesCollection();

      if (req.method === 'GET') {
        // Exclude large base64 resume data from bulk list — fetched separately per profile
        const allProfiles = await profiles.find({}, {
          projection: { 'providerDetails.resumeFileData': 0 }
        }).toArray();
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

    // RESUME — fetch base64 resume data for a single provider profile
    if (action === 'resume') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id query parameter required' });
      const profiles = await getProfilesCollection();
      let query;
      try { query = { _id: new ObjectId(id as string) }; } catch { query = { _id: id as string }; }
      const profile = await profiles.findOne(query, {
        projection: { 'providerDetails.resumeFileData': 1, 'providerDetails.resumeFileName': 1 }
      });
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json({
        resumeFileData: profile.providerDetails?.resumeFileData || null,
        resumeFileName: profile.providerDetails?.resumeFileName || null
      });
    }

    // REFERRALS — fetch paginated referrals with aggregation
    if (action === 'referrals') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      try {
        const profiles = await getProfilesCollection();
        const referralsCollection = profiles.db.collection('referrals');
        
        // Parse pagination params
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(10, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;
        
        // Single aggregation query: fetch referrals + join applications + count
        const referralsWithCounts = await referralsCollection.aggregate([
          { $sort: { createdAt: -1 } },
          { $facet: {
              metadata: [{ $count: 'total' }],
              records: [
                { $skip: skip },
                { $limit: limit },
                { $lookup: {
                    from: 'referral_applications',
                    localField: 'requestId',
                    foreignField: 'requestId',
                    as: 'applicants'
                  }
                },
                { $project: {
                    requestId: 1,
                    userId: 1,
                    clientInitials: 1,
                    clientType: 1,
                    clientAge: 1,
                    concerns: 1,
                    genderPreference: 1,
                    languages: 1,
                    mode: 1,
                    location: 1,
                    budgetRange: 1,
                    urgency: 1,
                    notes: 1,
                    status: 1,
                    createdAt: 1,
                    'applicants._id': 1,
                    'applicants.phoneNumber': 1,
                    'applicants.name': 1,
                    'applicants.createdAt': 1
                  }
                }
              ]
            }
          }
        ]).toArray();
        
        const metadata = referralsWithCounts[0]?.metadata[0] || { total: 0 };
        const records = referralsWithCounts[0]?.records || [];
        
        // Map userId to creatorPhone for compatibility
        const referrals = records.map((ref: any) => ({
          ...ref,
          creatorPhone: ref.userId,
          applicants: ref.applicants || []
        }));
        
        return res.status(200).json({
          referrals,
          pagination: {
            page,
            limit,
            total: metadata.total,
            pages: Math.ceil(metadata.total / limit),
            hasMore: page < Math.ceil(metadata.total / limit)
          }
        });
      } catch (err: any) {
        console.error('[ADMIN] Error fetching referrals:', err);
        return res.status(500).json({ error: 'Failed to fetch referrals', details: err?.message });
      }
    }

    return res.status(400).json({ error: 'Invalid action parameter. Use: profiles, notify, reset, resume, or referrals' });

  } catch (err: any) {
    console.error('[ADMIN] Error:', err);
    return res.status(500).json({ error: 'Admin operation failed', details: err?.message });
  }
}
