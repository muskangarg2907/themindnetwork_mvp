require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
  const digits = String(s).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS - Restrict to specific origins in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4000',
  process.env.FRONTEND_URL || 'https://themindnetwork.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('[SECURITY] Blocked CORS request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/profiles?action=lookup', authLimiter);

app.use(express.json({ limit: '10mb' }));

// Sanitize sensitive data from responses
function sanitizeProfile(profile, includeHealthData = false) {
  if (!profile) return null;
  
  const sanitized = { ...profile };
  
  // Always remove internal fields
  delete sanitized._id;
  
  // Remove sensitive health data unless explicitly requested (e.g., for authenticated admin/owner)
  if (!includeHealthData && sanitized.clinical) {
    sanitized.clinical = {
      hasPriorTherapy: sanitized.clinical.hasPriorTherapy || false,
      // Remove: presentingProblem, currentMood, medications, riskFactors, priorExperience
    };
  }
  
  // Sanitize payment info - only show necessary fields
  if (sanitized.payments) {
    sanitized.payments = sanitized.payments.map(p => ({
      planId: p.planId,
      planName: p.planName,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
      // Remove: razorpayOrderId, razorpayPaymentId, razorpaySignature
    }));
  }
  
  return sanitized;
}

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

// Removed duplicate GET /api/profiles - now handled by consolidated endpoint below

// Consolidated ADMIN endpoint (matches /api/admin.ts)
app.all('/api/admin', async (req, res) => {
  const { action, id } = req.query;

  try {
    // PROFILES MANAGEMENT
    if (action === 'profiles') {
      if (req.method === 'GET') {
        let profiles = [];
        if (usePostgres) {
          const q = await pool.query('SELECT id, data, created_at, updated_at FROM profiles ORDER BY created_at DESC');
          profiles = q.rows.map(r => ({ _id: r.id, ...r.data, createdAt: r.created_at, updatedAt: r.updated_at }));
        } else {
          profiles = await readProfilesFile();
          profiles = profiles.map(p => ({ ...p, _id: p._id || p.id }));
        }
        return res.json({ profiles, total: profiles.length });
      }

      if (req.method === 'DELETE' && id) {
        if (usePostgres) {
          await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
        } else {
          let profiles = await readProfilesFile();
          profiles = profiles.filter(p => (p.id !== id && p._id !== id));
          await writeProfilesFile(profiles);
        }
        console.log('[ADMIN] Deleted profile:', id);
        return res.json({ message: 'Profile deleted', success: true });
      }

      if (req.method === 'PUT' && id) {
        const updates = req.body || {};
        if (usePostgres) {
          const q = await pool.query(
            'UPDATE profiles SET data = data || $1::jsonb, updated_at = now() WHERE id = $2 RETURNING id, data, created_at, updated_at',
            [JSON.stringify(updates), id]
          );
          if (q.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
          return res.json({ _id: q.rows[0].id, ...q.rows[0].data });
        } else {
          const profiles = await readProfilesFile();
          const profile = profiles.find(p => p.id === id || p._id === id);
          if (!profile) return res.status(404).json({ error: 'Profile not found' });
          Object.assign(profile, updates);
          profile.updatedAt = new Date().toISOString();
          await writeProfilesFile(profiles);
          return res.json({ ...profile, _id: profile._id || profile.id });
        }
      }
    }

    // NOTIFY MANAGEMENT
    if (action === 'notify') {
      if (req.method === 'POST') {
        return res.json({ success: true, note: 'Notified admin (local dev)', lastUpdate: new Date().toISOString() });
      }
      if (req.method === 'GET') {
        return res.json({ lastUpdate: new Date().toISOString() });
      }
    }

    // RESET
    if (action === 'reset') {
      if (req.method === 'DELETE') {
        if (!usePostgres) {
          await writeProfilesFile([]);
        }
        return res.json({ message: 'All profiles deleted', success: true });
      }
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  } catch (err) {
    console.error('Admin endpoint error:', err);
    res.status(500).json({ error: 'Admin operation failed', details: err.message });
  }
});

// Consolidated PROFILES endpoint (matches /api/profiles.ts)
app.all('/api/profiles', async (req, res) => {
  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  const phone = Array.isArray(req.query.phone) ? req.query.phone[0] : req.query.phone;
  
  console.log('[PROFILES] Request:', req.method, 'action:', action, 'phone:', phone ? '****' + phone.slice(-4) : 'none');

  try {
    // LOOKUP by phone
    if (action === 'lookup' || phone) {
      const phoneNumber = phone || req.query.phone;
      if (!phoneNumber) {
        return res.status(400).json({ error: 'phone query parameter required' });
      }
      const norm = normalizePhone(phoneNumber);
      
      console.log('[LOOKUP] Searching for phone: ****' + norm.slice(-4)); // Sanitized for security
      
      let profiles = [];
      if (usePostgres) {
        const q = await pool.query('SELECT id, data FROM profiles');
        profiles = q.rows.map(r => ({ id: r.id, ...r.data }));
      } else {
        profiles = await readProfilesFile();
      }
      
      // Only return approved profiles (matches Vercel endpoint)
      const found = profiles.find(p => {
        const phoneMatch = normalizePhone(p.basicInfo?.phone || '') === norm;
        const isApproved = p.status === 'approved';
        return phoneMatch && isApproved;
      });
      
      if (!found) {
        console.log('[LOOKUP] NO MATCH FOUND (or not approved)');
        return res.status(404).json({ error: 'Not found', searched: norm });
      }
      
      const profileId = found._id || found.id;
      const result = { ...found, _id: profileId };
      console.log('[LOOKUP] FOUND: ****' + profileId.slice(-4)); // Partial ID for security
      console.log('[LOOKUP] Returning object (not array):', Array.isArray(result) ? 'ERROR: IS ARRAY!' : 'OK: is object');
      
      // Return full profile with health data (user is authenticated via phone OTP)
      return res.json(result);
    }

    // GET all profiles
    if (req.method === 'GET') {
      console.log('[PROFILES] GET: Fetching all profiles');
      let profiles = [];
      if (usePostgres) {
        const q = await pool.query('SELECT id, data, created_at FROM profiles ORDER BY created_at DESC');
        profiles = q.rows.map(r => ({ _id: r.id, ...r.data, createdAt: r.created_at }));
      } else {
        profiles = await readProfilesFile();
        profiles = profiles.map(p => ({ ...p, _id: p._id || p.id }));
      }
      return res.json(profiles);
    }

    // POST create profile (existing logic)
    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const normalizedPayload = {
        ...payload,
        basicInfo: {
          ...payload.basicInfo,
          phone: normalizePhone(payload.basicInfo?.phone || '')
        }
      };

      const id = randomUUID();
      const record = { id, ...normalizedPayload, createdAt: new Date().toISOString() };

      if (usePostgres) {
        await pool.query('INSERT INTO profiles (id, data, created_at) VALUES ($1, $2, now())', [id, record]);
      } else {
        const profiles = await readProfilesFile();
        profiles.push(record);
        await writeProfilesFile(profiles);
      }

      return res.status(201).json({ _id: id, ...normalizedPayload, createdAt: record.createdAt });
    }

    // PUT update profile
    if (req.method === 'PUT') {
      const payload = req.body;
      if (!payload || !payload._id) {
        return res.status(400).json({ error: 'Missing _id' });
      }

      const { _id, ...updates } = payload;
      
      if (usePostgres) {
        const q = await pool.query(
          'UPDATE profiles SET data = data || $1::jsonb, updated_at = now() WHERE id = $2 RETURNING id, data',
          [JSON.stringify(updates), _id]
        );
        if (q.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
        return res.json({ _id: q.rows[0].id, ...q.rows[0].data });
      } else {
        const profiles = await readProfilesFile();
        const profile = profiles.find(p => p.id === _id || p._id === _id);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        Object.assign(profile, updates);
        profile.updatedAt = new Date().toISOString();
        await writeProfilesFile(profiles);
        return res.json({ ...profile, _id: profile._id || profile.id });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Profiles endpoint error:', err);
    res.status(500).json({ error: 'Profile operation failed', details: err.message });
  }
});

// Consolidated GENERATE endpoint (matches /api/generate.ts)
app.post('/api/generate', async (req, res) => {
  const { type } = req.query;
  const profile = req.body;

  try {
    // BIO GENERATION
    if (type === 'bio') {
      const name = profile?.basicInfo?.fullName || 'Provider';
      const text = `${name} is a mental health provider with expertise in their field.`;
      return res.json({ text });
    }

    // SUMMARY GENERATION
    if (type === 'summary') {
      const name = profile?.basicInfo?.fullName || 'Client';
      const text = `${name} submitted an intake form.`;
      return res.json({ text });
    }

    return res.status(400).json({ error: 'Invalid type parameter' });
  } catch (err) {
    console.error('Generate endpoint error:', err);
    res.status(500).json({ error: 'Generation failed', details: err.message });
  }
});

// Consolidated UTILS endpoint (matches /api/utils.ts)
app.all('/api/utils', async (req, res) => {
  const { action } = req.query;
  
  console.log('[UTILS] Request:', req.method, 'action:', action);

  // HEALTH CHECK
  if (!action || action === 'health') {
    try {
      if (usePostgres) {
        await pool.query('SELECT 1');
      }
      return res.json({ ok: true, db: usePostgres });
    } catch (err) {
      return res.json({ ok: true, db: false, error: err.message });
    }
  }

  // CONTACT FORM
  if (action === 'contact' && req.method === 'POST') {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const submission = { name, email, message, timestamp: new Date(), read: false };

      if (mongoDb) {
        try {
          const result = await mongoDb.collection('contact_submissions').insertOne(submission);
          console.log('📧 Contact form saved to MongoDB:', result.insertedId);
        } catch (mongoErr) {
          console.error('Failed to save to MongoDB:', mongoErr);
        }
      }

      console.log('📧 Contact Form Submission:', {
        name,
        email,
        message,
        timestamp: submission.timestamp.toISOString()
      });
      
      return res.json({ 
        success: true, 
        message: 'Thank you for your message! We will get back to you soon.' 
      });
    } catch (err) {
      console.error('Contact form error:', err);
      return res.status(500).json({ error: 'Failed to submit contact form', details: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action parameter' });
});

// Razorpay payment endpoint
app.post('/api/razorpay', async (req, res) => {
  const { amount, planId, planName } = req.body;

  if (!amount || !planId || !planName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // For local testing without Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log('[RAZORPAY] Using test mode - no actual order created');
      return res.json({
        orderId: `test_order_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
        keyId: 'rzp_test_placeholder',
      });
    }

    const Razorpay = require('razorpay');
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${planId}_${Date.now()}`,
      notes: {
        plan_id: planId,
        plan_name: planName,
      },
      payment_capture: 1, // Auto-capture payment
    });

    console.log('[RAZORPAY] Order created:', order.id);

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[RAZORPAY] Order creation failed:', err);
    return res.status(500).json({ 
      error: 'Failed to create payment order', 
      details: err?.message 
    });
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
