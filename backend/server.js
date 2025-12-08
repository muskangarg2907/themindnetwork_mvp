require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

const DATABASE_URL = process.env.DATABASE_URL;
const usePostgres = Boolean(DATABASE_URL);

if (!DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not set. Falling back to file-based storage for local testing.');
}

const pool = usePostgres ? new Pool({ connectionString: DATABASE_URL }) : null;

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
    const payload = req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid payload' });
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
    return res.status(201).json(record);
  } catch (err) {
    console.error('POST /api/profiles error:', err);
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

// Generic error handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err?.message });
});

async function start() {
  await ensureSchema();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
