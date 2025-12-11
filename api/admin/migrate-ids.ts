import { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfilesCollection } from '../db.js';

/**
 * Migration endpoint to remove 'id' field from all profiles in MongoDB
 * Only keeps '_id' as the primary identifier
 * 
 * Usage: POST /api/admin/migrate-ids
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const profiles = await getProfilesCollection();

    console.log('[MIGRATE] Starting migration to remove id field...');

    // Remove 'id' field from all documents
    const result = await profiles.updateMany(
      { id: { $exists: true } },
      { $unset: { id: '' } }
    );

    console.log('[MIGRATE] Migration complete:', {
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

    return res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (err: any) {
    console.error('[MIGRATE] Migration failed:', err);
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: err?.message 
    });
  }
}
