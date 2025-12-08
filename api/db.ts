import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'themindnetwork';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we have a cached connection, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create a new connection
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log('[DB] Connected to MongoDB');
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
