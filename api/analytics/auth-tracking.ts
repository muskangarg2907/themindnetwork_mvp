import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, event, timestamp } = req.body;
  
  // event types: 'otp_requested', 'otp_verified', 'profile_submitted'
  if (!phone || !event) {
    return res.status(400).json({ error: 'Phone and event required' });
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('themindnetwork');
    const collection = db.collection('auth_tracking');
    
    // Store tracking event
    await collection.insertOne({
      phone,
      event,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date()
    });
    
    await client.close();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
}
