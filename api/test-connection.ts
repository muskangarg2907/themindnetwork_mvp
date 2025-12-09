import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return res.status(500).json({ 
        error: 'MONGODB_URI not configured',
        hint: 'Add MONGODB_URI to Vercel environment variables'
      });
    }
    
    // Mask password in logs
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('[TEST] Attempting connection with URI pattern:', maskedUri);
    
    const { db } = await connectToDatabase();
    
    // Test the connection
    await db.admin().ping();
    
    // Try to count documents
    const profiles = db.collection('profiles');
    const count = await profiles.countDocuments();
    
    return res.status(200).json({ 
      success: true,
      message: 'MongoDB connection successful',
      database: db.databaseName,
      profileCount: count,
      uriPattern: maskedUri
    });
  } catch (err: any) {
    console.error('[TEST] Connection failed:', err);
    return res.status(500).json({ 
      error: 'Connection failed',
      message: err.message,
      code: err.code,
      stack: err.stack?.split('\n').slice(0, 3)
    });
  }
}
