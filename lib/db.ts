import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesEnsured = false;

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'themindnetwork';

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Check if MongoDB URI is configured
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set. Please configure MongoDB Atlas connection string in Vercel environment variables.');
  }

  // If we have a cached connection, verify it's still alive
  if (cachedClient && cachedDb) {
    try {
      await cachedClient.db().admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (err) {
      console.log('[DB] Cached connection stale, reconnecting...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  // Create a new connection
  try {
    // Ensure the URI includes the database name and proper parameters
    let uri = MONGODB_URI;
    
    // Log masked URI for debugging (hide password)
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('[DB] Connection URI pattern:', maskedUri);
    
    // Check if database name is in the URI
    if (!uri.includes('/themindnetwork')) {
      console.log('[DB] Adding database name to URI');
      // Insert database name before query params or at the end
      const hasParams = uri.includes('?');
      if (hasParams) {
        uri = uri.replace('/?', '/themindnetwork?');
      } else {
        uri = uri.replace(/\/$/, '') + '/themindnetwork';
      }
    }
    
    // Add required parameters
    const params = 'retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false';
    uri = uri.includes('?') 
      ? `${uri}&${params}`
      : `${uri}?${params}`;
    
    console.log('[DB] Connecting to MongoDB Atlas...');
    
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('[DB] Connection established, selecting database...');
    const db = client.db(DB_NAME);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log('[DB] Connected to MongoDB');
    // Ensure indexes once per cold start
    await ensureIndexes(db);
    return { client, db };
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err);
    throw err;
  }
}

export async function getProfilesCollection() {
  const { db } = await connectToDatabase();
  return db.collection('profiles');
}

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;
  try {
    console.log('[DB] Ensuring indexes...');
    // Profiles: unique index on phone, status and role for queries
    await db.collection('profiles').createIndex({ 'basicInfo.phone': 1 }, { unique: true, sparse: true });
    await db.collection('profiles').createIndex({ role: 1, status: 1 });
    await db.collection('profiles').createIndex({ createdAt: -1 });

    // Snapshots: primary key is _id (snapshotUrl), plus userId and createdAt
    await db.collection('snapshots').createIndex({ _id: 1 }, { unique: true });
    await db.collection('snapshots').createIndex({ userId: 1, createdAt: -1 });

    indexesEnsured = true;
    console.log('[DB] Indexes ensured');
  } catch (err) {
    console.error('[DB] Failed to ensure indexes:', err);
  }
}
