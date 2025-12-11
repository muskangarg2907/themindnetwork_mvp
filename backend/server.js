require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

const DATABASE_URL = process.env.DATABASE_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const usePostgres = Boolean(DATABASE_URL);
const useMongo = Boolean(MONGODB_URI);

if (!DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not set. Falling back to file-based storage for local testing.');
}

if (!MONGODB_URI) {
  console.warn('Warning: MONGODB_URI not set. Contact form submissions will be logged to console only.');
}

const pool = usePostgres ? new Pool({ connectionString: DATABASE_URL }) : null;
let mongoClient = null;
let mongoDb = null;

async function ensureSchema() {
  if (!usePostgres) return;
  const create = `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ
    );
  `;
  await pool.query(create);
}

async function connectMongo() {
  if (!useMongo) return;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db('themindnetwork');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    mongoDb = null;
  }
}

async function readProfilesFile() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeProfilesFile(profiles) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(profiles, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

function normalizePhone(s) {
  if (!s) return '';
  return String(s).replace(/\D/g, '');
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    if (usePostgres) {
      await pool.query('SELECT 1');
    }
    res.json({ ok: true, db: usePostgres });
  } catch (err) {
    console.error('Health check failed:', err);
    res.json({ ok: true, db: false, error: err.message });
  }
});

app.get('/api/profiles', async (req, res) => {
  try {
    if (usePostgres) {
      const q = await pool.query('SELECT id, data, created_at, updated_at FROM profiles ORDER BY created_at DESC');
      const rows = q.rows.map(r => ({ id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at }));
      return res.json(rows);
    }
    const profiles = await readProfilesFile();
    return res.json(profiles);
  } catch (err) {
    console.error('GET /api/profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch profiles', details: err.message });
  }
});

// Lookup profile by phone. Query param: ?phone=<phone>
app.get('/api/profiles/lookup', async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: 'phone query parameter required' });
    const norm = normalizePhone(phone);

    let profiles = [];
    if (usePostgres) {
      const q = await pool.query('SELECT id, data, created_at, updated_at FROM profiles');
      profiles = q.rows.map(r => ({ id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at }));
    } else {
      profiles = await readProfilesFile();
    }

    const found = profiles.find(p => {
      const pPhone = p?.basicInfo?.phone || p?.phone || '';
      const pNorm = normalizePhone(pPhone);
      if (!pNorm) return false;
      // match by last 10 digits if available, else full match
      if (norm.length >= 10 && pNorm.endsWith(norm.slice(-10))) return true;
      return pNorm === norm;
    });

    if (!found) return res.status(404).json({ error: 'Not found' });
    return res.json(found);
  } catch (err) {
    console.error('GET /api/profiles/lookup error:', err);
    res.status(500).json({ error: 'Lookup failed', details: err.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (usePostgres) {
      const q = await pool.query('SELECT id, data, created_at, updated_at FROM profiles WHERE id = $1', [id]);
      if (q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      const r = q.rows[0];
      return res.json({ id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at });
    }
    const profiles = await readProfilesFile();
    const p = profiles.find(x => x.id === id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    return res.json(p);
  } catch (err) {
    console.error('GET /api/profiles/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

app.post('/api/profiles', async (req, res) => {
  try {
    console.log('Received profile POST request:', JSON.stringify(req.body, null, 2));
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      console.error('Invalid payload received');
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const id = randomUUID();
    if (usePostgres) {
      const q = await pool.query('INSERT INTO profiles(id, data) VALUES($1, $2) RETURNING id, data, created_at, updated_at', [id, payload]);
      const r = q.rows[0];
      return res.status(201).json({ id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at });
    }
    const profiles = await readProfilesFile();
    const record = { id, ...payload, createdAt: new Date().toISOString() };
    profiles.push(record);
    await writeProfilesFile(profiles);
    console.log('Profile saved successfully:', id);
    return res.status(201).json(record);
  } catch (err) {
    console.error('POST /api/profiles error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to save profile', details: err.message });
  }
});

// Simple AI-generation endpoints (server-side). If GEMINI_API_KEY is set, these
// could call Google Generative API. For local/dev, return placeholder text.
app.post('/api/generate/summary', async (req, res) => {
  try {
    const profile = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      // Fallback placeholder
      const name = profile?.basicInfo?.fullName || 'Client';
      const text = `${name} submitted an intake form. Summary: brief clinical intake summary unavailable in local mode.`;
      return res.json({ text });
    }

    // If API key exists, attempt a simple REST call to the Generative API.
    const prompt = `Create a brief clinical intake summary (max 3 sentences) for a mental health profile. Use data: ${JSON.stringify(profile)}`;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const body = {
      "instructions": prompt
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    const json = await r.json();
    // Attempt to pull text from common response shapes.
    const text = json?.candidates?.[0]?.content || json?.output?.[0]?.content || json?.text || JSON.stringify(json);
    return res.json({ text });
  } catch (err) {
    console.error('POST /api/generate/summary error:', err);
    return res.status(500).json({ error: 'Generation failed', details: err?.message });
  }
});

app.post('/api/generate/bio', async (req, res) => {
  try {
    const profile = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      const name = profile?.basicInfo?.fullName || 'Provider';
      const text = `${name} is a provider. A professional bio is not available in local mode.`;
      return res.json({ text });
    }

    const prompt = `Create a professional 3-sentence bio for provider using data: ${JSON.stringify(profile)}`;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const body = { "instructions": prompt };
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    const json = await r.json();
    const text = json?.candidates?.[0]?.content || json?.output?.[0]?.content || json?.text || JSON.stringify(json);
    return res.json({ text });
  } catch (err) {
    console.error('POST /api/generate/bio error:', err);
    return res.status(500).json({ error: 'Generation failed', details: err?.message });
  }
});

app.put('/api/profiles/:id', async (req, res) => {
  try {
    const payload = req.body;
    const id = req.params.id;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid payload' });
    if (usePostgres) {
      const q = await pool.query('UPDATE profiles SET data = $2, updated_at = now() WHERE id = $1 RETURNING id, data, created_at, updated_at', [id, payload]);
      if (q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      const r = q.rows[0];
      return res.json({ id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at });
    }
    const profiles = await readProfilesFile();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    profiles[idx] = { ...profiles[idx], ...payload, updatedAt: new Date().toISOString() };
    await writeProfilesFile(profiles);
    return res.json(profiles[idx]);
  } catch (err) {
    console.error('PUT /api/profiles/:id error:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (usePostgres) {
      const q = await pool.query('DELETE FROM profiles WHERE id = $1 RETURNING id, data, created_at, updated_at', [id]);
      if (q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      const r = q.rows[0];
      return res.json({ id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at });
    }
    const profiles = await readProfilesFile();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const removed = profiles.splice(idx, 1)[0];
    await writeProfilesFile(profiles);
    return res.json(removed);
  } catch (err) {
    console.error('DELETE /api/profiles/:id error:', err);
    res.status(500).json({ error: 'Failed to delete profile', details: err.message });
  }
});

// Admin endpoints (for local dev - these are serverless functions in production)
app.get('/api/admin/profiles', async (req, res) => {
  try {
    if (usePostgres) {
      const q = await pool.query('SELECT id, data, created_at, updated_at FROM profiles ORDER BY created_at DESC');
      const allProfiles = q.rows.map(r => ({ _id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at }));
      return res.json({ profiles: allProfiles, total: allProfiles.length });
    }
    const profiles = await readProfilesFile();
    // Add _id field for compatibility with frontend (which expects _id, not id)
    const normalized = profiles.map(p => ({ ...p, _id: p._id || p.id }));
    return res.json({ profiles: normalized, total: normalized.length });
  } catch (err) {
    console.error('GET /api/admin/profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch profiles', details: err.message });
  }
});

app.delete('/api/admin/profiles', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id query parameter required' });
    
    if (usePostgres) {
      const q = await pool.query('DELETE FROM profiles WHERE id = $1 RETURNING id', [id]);
      if (q.rowCount === 0) return res.status(404).json({ error: 'Profile not found' });
      return res.json({ message: 'Profile deleted', success: true });
    }
    const profiles = await readProfilesFile();
    // Support both id and _id
    const idx = profiles.findIndex(p => p.id === id || p._id === id);
    if (idx === -1) return res.status(404).json({ error: 'Profile not found' });
    profiles.splice(idx, 1);
    await writeProfilesFile(profiles);
    return res.json({ message: 'Profile deleted', success: true });
  } catch (err) {
    console.error('DELETE /api/admin/profiles error:', err);
    res.status(500).json({ error: 'Failed to delete profile', details: err.message });
  }
});

app.put('/api/admin/profiles', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id query parameter required' });
    
    const updates = req.body;
    
    if (usePostgres) {
      const existing = await pool.query('SELECT data FROM profiles WHERE id = $1', [id]);
      if (existing.rowCount === 0) return res.status(404).json({ error: 'Profile not found' });
      const merged = { ...existing.rows[0].data, ...updates };
      const q = await pool.query('UPDATE profiles SET data = $1, updated_at = now() WHERE id = $2 RETURNING id, data, created_at, updated_at', [merged, id]);
      const r = q.rows[0];
      return res.json({ _id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at });
    }
    
    const profiles = await readProfilesFile();
    // Support both id and _id
    const profile = profiles.find(p => p.id === id || p._id === id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    Object.assign(profile, updates);
    profile.updatedAt = new Date().toISOString();
    await writeProfilesFile(profiles);
    // Return with _id for frontend compatibility
    return res.json({ ...profile, _id: profile._id || profile.id });
  } catch (err) {
    console.error('PUT /api/admin/profiles error:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

app.post('/api/admin/notify', async (req, res) => {
  try {
    // In local dev, just acknowledge the notification
    res.json({ success: true, note: 'Notified admin (local dev)', lastUpdate: new Date().toISOString() });
  } catch (err) {
    console.error('POST /api/admin/notify error:', err);
    res.status(500).json({ error: 'Notify failed', details: err.message });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const submission = {
      name,
      email,
      message,
      timestamp: new Date(),
      read: false
    };

    // Store in MongoDB if available
    if (mongoDb) {
      try {
        const result = await mongoDb.collection('contact_submissions').insertOne(submission);
        console.log('📧 Contact form saved to MongoDB:', result.insertedId);
      } catch (mongoErr) {
        console.error('Failed to save to MongoDB:', mongoErr);
        // Don't fail the request if MongoDB fails
      }
    }

    // Also log to console for visibility
    console.log('📧 Contact Form Submission:', {
      name,
      email,
      message,
      timestamp: submission.timestamp.toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Thank you for your message! We will get back to you soon.' 
    });
  } catch (err) {
    console.error('POST /api/contact error:', err);
    res.status(500).json({ error: 'Failed to submit contact form', details: err.message });
  }
});

// Generic error handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err?.message });
});

async function start() {
  await ensureSchema();
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

// Generic error handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err?.message });
});

async function start() {
  await ensureSchema();
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

