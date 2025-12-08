import { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfilesCollection } from '../db';

function normalizePhone(s: string) {
  if (!s) return '';
  const digits = String(s).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
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
    console.log('[LOOKUP] Searching for phone:', phone, 'normalized:', norm);
    
    const profiles = await getProfilesCollection();
    
    // Find profile by normalized phone
    const found = await profiles.findOne({
      'basicInfo.phone': norm
    });

    if (!found) {
      console.log('[LOOKUP] NO MATCH FOUND');
      return res.status(404).json({ error: 'Not found', searched: norm });
    }
    
    console.log('[LOOKUP] FOUND:', found._id);
    return res.status(200).json(found);
  } catch (err: any) {
    console.error('[LOOKUP] ERROR:', err);
    return res.status(500).json({ error: 'Lookup failed', details: err?.message });
  }
}
