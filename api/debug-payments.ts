import { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfilesCollection } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const profiles = await getProfilesCollection();
    
    // Get all profiles
    const allProfiles = await profiles.find({}).toArray();
    
    // Filter profiles with payments
    const profilesWithPayments = allProfiles.filter(p => p.payments && p.payments.length > 0);
    
    // Find the test profile
    const testProfile = allProfiles.find(p => p.basicInfo?.phone === '1111111111');
    
    const result = {
      totalProfiles: allProfiles.length,
      profilesWithPayments: profilesWithPayments.length,
      testProfileFound: !!testProfile,
      testProfileData: testProfile ? {
        id: testProfile._id,
        name: testProfile.basicInfo?.fullName,
        phone: testProfile.basicInfo?.phone,
        role: testProfile.role,
        status: testProfile.status,
        hasPaymentsField: !!testProfile.payments,
        paymentCount: testProfile.payments?.length || 0,
        payments: testProfile.payments || []
      } : null,
      allProfilesSummary: allProfiles.map(p => ({
        id: p._id,
        name: p.basicInfo?.fullName,
        phone: p.basicInfo?.phone,
        role: p.role,
        paymentCount: p.payments?.length || 0,
        hasPayments: !!(p.payments && p.payments.length > 0)
      }))
    };
    
    return res.status(200).json(result);
    
  } catch (err: any) {
    console.error('[DEBUG-PAYMENTS] Error:', err);
    return res.status(500).json({ 
      error: 'Failed to check payments', 
      details: err?.message,
      stack: err?.stack 
    });
  }
}
