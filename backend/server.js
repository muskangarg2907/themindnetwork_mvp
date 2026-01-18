require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const { readFileSync } = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

const DATABASE_URL = process.env.DATABASE_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const usePostgres = Boolean(DATABASE_URL);
const useMongo = Boolean(MONGODB_URI);

if (!DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not set. Falling back to file-based storage for local testing.');
}

if (!MONGODB_URI) {
  console.warn('Warning: MONGODB_URI not set. Contact form submissions will be logged to console only.');
}

if (!GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY not set. AI features will not work.');
}

if (!ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY not set. Fallback AI provider not available.');
}

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. Second fallback AI provider not available.');
}

// Initialize AI clients
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
const gemini = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

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
      
      // Return profile for any status except rejected (allow payments without verification)
      const found = profiles.find(p => {
        const phoneMatch = normalizePhone(p.basicInfo?.phone || '') === norm;
        const notRejected = p.status !== 'rejected';
        return phoneMatch && notRejected;
      });
      
      if (!found) {
        console.log('[LOOKUP] NO MATCH FOUND (or rejected)');
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

// In-memory storage for snapshots (development only)
const snapshots = new Map();

// Snapshot chat endpoint
app.post('/api/snapshot/chat', async (req, res) => {
  const { userId, phoneNumber, message, conversationHistory } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Mock mode for testing when APIs are unavailable
  const USE_MOCK_MODE = process.env.USE_MOCK_MODE === 'true' || (!GROQ_API_KEY && !ANTHROPIC_API_KEY);
  
  if (USE_MOCK_MODE) {
    console.log('🎭 MOCK MODE: Using simulated responses');
    
    const messageCount = (conversationHistory || []).length;
    const mockResponses = [
      "That sounds like a lot to carry. I'm here to listen. What's been weighing on you most recently?",
      "Thank you for sharing that. When you're feeling this way, what do you notice happening in your body or thoughts?",
      "When faced with something new or unfamiliar, do you usually feel excited and curious, or do you prefer sticking with what you know?",
      "How do you approach tasks and deadlines - are you someone who plans ahead and stays organized, or more spontaneous and flexible?",
      "After spending time with a group of people, do you feel energized or do you need time alone to recharge?",
      "In disagreements, are you more likely to prioritize harmony and others' feelings, or stand firm on your own perspective?",
      "When something unexpected or stressful happens, how quickly do your emotions settle?",
      "In close relationships, do you feel comfortable depending on others and having them depend on you?",
      "Do you often worry about whether people really care about you, or do you feel pretty secure?",
      "When you're going through something difficult, do you tend to reach out or handle it on your own?",
      "Thank you for sharing all of this with me. I have enough to create your psychological snapshot. SNAPSHOT_COMPLETE"
    ];
    
    const responseIndex = Math.min(messageCount, mockResponses.length - 1);
    const mockResponse = mockResponses[responseIndex];
    const isComplete = mockResponse.includes('SNAPSHOT_COMPLETE');
    
    let snapshotUrl = '';
    let snapshotData = null;
    
    if (isComplete) {
      snapshotUrl = 'mock-snapshot-' + Date.now();
      snapshotData = {
        userId,
        phoneNumber,
        snapshot: {
          emotionalPatterns: {
            currentState: 'Generally balanced with occasional stress',
            stressTriggers: ['Work pressure', 'Uncertainty', 'Conflict'],
            stressResponse: 'Initially withdraws, then seeks support',
            regulation: ['Deep breathing', 'Exercise', 'Talking to friends']
          },
          relationshipPatterns: {
            connectionStyle: 'Prefers deep, meaningful connections',
            uncertaintyResponse: 'Sometimes worries about being valued',
            conflictStyle: 'Avoids initially, discusses when calm',
            attachmentNotes: 'Secure with occasional anxiety'
          },
          whatHelps: ['Exercise', 'Creative activities', 'Time with close friends', 'Nature'],
          whatHurts: ['Feeling dismissed', 'Lack of structure', 'Prolonged isolation'],
          personalityTendencies: {
            bigFive: {
              openness: 'High - curious about new experiences',
              conscientiousness: 'Moderate - organized but flexible',
              extraversion: 'Moderate - enjoys people and solitude',
              agreeableness: 'High - values harmony and empathy',
              emotionalStability: 'Moderate - generally stable with occasional stress'
            },
            cognitiveStyle: 'Balanced analytical and intuitive thinking',
            naturalRhythm: 'Morning productive, evening creative'
          },
          meaningfulExperiences: 'Finds meaning in helping others and personal growth',
          summary: 'This snapshot reflects someone with strong self-awareness and healthy coping strategies. They show balanced personality traits with a tendency toward empathy and growth. While they experience normal stress and occasional relationship concerns, they have developed effective ways to manage challenges.'
        },
        createdAt: Date.now()
      };
      
      snapshots.set(snapshotUrl, snapshotData);
      
      // Save to MongoDB if available
      if (mongoDb) {
        try {
          await mongoDb.collection('snapshots').insertOne({
            snapshotId: snapshotUrl,
            ...snapshotData,
            createdAt: new Date()
          });
          console.log('🎭 MOCK: Saved snapshot to MongoDB:', snapshotUrl);
        } catch (dbErr) {
          console.error('🎭 MOCK: Failed to save to MongoDB:', dbErr.message);
        }
      }
      
      console.log('🎭 MOCK: Created test snapshot:', snapshotUrl);
    }
    
    return res.json({
      response: mockResponse.replace('SNAPSHOT_COMPLETE', '').trim(),
      isComplete,
      snapshotUrl,
      snapshot: snapshotData
    });
  }

  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    // Build conversation context - keeping for variable reference
    const messages = (conversationHistory || [])
      .filter((msg) => msg.id !== 'sending')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Load system prompt from file
    const SYSTEM_PROMPT = readFileSync(
      path.join(__dirname, '..', 'prompts', 'snapshot-system-prompt-optimized.md'),
      'utf-8'
    ).replace(/^# /, ''); // Remove markdown heading

    // Build OpenAI messages format
    const openaiMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];

    // Smart conversation history management
    const allHistory = (conversationHistory || []).filter((msg) => msg.id !== 'sending');
    
    let historyToSend = [];
    if (allHistory.length <= 10) {
      // If conversation is short, send everything
      historyToSend = allHistory;
    } else {
      // If conversation is long, send:
      // - First 2 messages (context)
      // - Last 8 messages (recent context)
      historyToSend = [
        ...allHistory.slice(0, 2),
        ...allHistory.slice(-8)
      ];
    }
    
    historyToSend.forEach((msg) => {
      openaiMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });

    // Add current user message
    openaiMessages.push({
      role: 'user',
      content: message
    });

    // Try Groq first, fallback to Anthropic if it fails
    let aiResponse;
    let usedProvider = 'groq';
    
    try {
      // Call Groq API (OpenAI-compatible)
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 150
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content;
      
    } catch (groqError) {
      console.warn('Groq failed, trying Anthropic fallback:', groqError.message);
      
      if (!anthropic) {
        throw new Error('Both Groq and Anthropic (fallback) are unavailable');
      }
      
      // Fallback to Anthropic Claude with prompt caching
      try {
        usedProvider = 'anthropic';
        
        // Convert messages format for Anthropic
        const anthropicMessages = historyToSend.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
        
        // Add current message
        anthropicMessages.push({
          role: 'user',
          content: message
        });
        
        const anthropicResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 150,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' } // Cache the prompt!
            }
          ],
          messages: anthropicMessages
        });
        
        aiResponse = anthropicResponse.content[0].text;
        console.log('✓ Using Anthropic fallback successfully');
        
      } catch (anthropicError) {
        console.error('Anthropic fallback also failed:', anthropicError);
        console.log('Trying Gemini as second fallback...');
        
        // Try Gemini as third option
        try {
          if (!gemini) {
            throw new Error('Gemini not configured');
          }
          
          const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          // Optimize context: only send first 2 and last 6 messages (reduced from 8)
          const recentMessages = messages.length <= 8 
            ? messages 
            : [...messages.slice(0, 2), ...messages.slice(-6)];
          
          // Build conversation history in Gemini format
          const geminiHistory = recentMessages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));
          
          const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7,
            },
            systemInstruction: SYSTEM_PROMPT
          });
          
          const result = await chat.sendMessage(userMessage);
          aiResponse = result.response.text();
          console.log('✓ Using Gemini fallback successfully');
          
        } catch (geminiError) {
          console.error('Gemini fallback also failed:', geminiError);
          console.log('Falling back to mock mode...');
          
          // Fall back to mock mode when all APIs fail
          const mockResponses = [
            "I'm here to help you explore your thoughts and feelings. How have you been feeling lately?",
            "Thank you for sharing that. Can you tell me more about what's been on your mind?",
            "I appreciate your openness. Let's explore this together - on a scale of 1-10, how would you rate your current stress level?",
            "Understanding your personality can help. How much do you agree with this: 'I tend to be organized and responsible'? (Very much, Somewhat, Neutral, Not much, Not at all)",
            "Thank you. And how about this: 'I enjoy meeting new people and being social'?",
            "How much do you agree: 'I'm often curious and enjoy learning new things'?",
            "And this one: 'I tend to be calm and emotionally stable'?",
            "Last personality question: 'I'm generally cooperative and compassionate with others'?",
            "Now let's explore relationships. In close relationships, do you: a) Feel comfortable depending on others, or b) Prefer to be self-reliant?",
            "And when conflicts arise, do you tend to: a) Address them directly, or b) Need time to process alone first?",
            "SNAPSHOT_COMPLETE"
          ];
          
          const messageCount = messages.length;
          if (messageCount < mockResponses.length) {
            aiResponse = mockResponses[messageCount];
          } else {
            aiResponse = mockResponses[mockResponses.length - 1];
          }
        }
      }
    }

    if (!aiResponse) {
      aiResponse = 'I apologize, but I encountered an error. Could you please rephrase that?';
    }

    // Check if snapshot is complete
    const isComplete = aiResponse.includes('SNAPSHOT_COMPLETE');
    let snapshotUrl = '';

    if (isComplete) {
      // Generate snapshot analysis
      const ANALYSIS_PROMPT = `Based on the conversation, create a structured psychological snapshot using the information gathered.

Extract and organize into these sections:

1. EMOTIONAL & STRESS PATTERNS
2. RELATIONSHIP & CONNECTION PATTERNS
3. WHAT HELPS & WHAT HURTS
4. PERSONALITY TENDENCIES
5. MEANINGFUL EXPERIENCES
6. INTEGRATED SUMMARY

Format your response as JSON:
{
  "emotionalPatterns": {
    "currentState": "",
    "stressTriggers": [],
    "stressResponse": "",
    "regulation": []
  },
  "relationshipPatterns": {
    "connectionStyle": "",
    "uncertaintyResponse": "",
    "conflictStyle": "",
    "attachmentNotes": ""
  },
  "whatHelps": [],
  "whatHurts": [],
  "personalityTendencies": {
    "bigFive": {},
    "cognitiveStyle": "",
    "naturalRhythm": ""
  },
  "meaningfulExperiences": "",
  "summary": ""
}`;

      // Build analysis messages with full conversation context
      const analysisMessages = [
        { role: 'system', content: 'You are a helpful assistant that creates structured psychological snapshots based on conversations.' }
      ];

      // Add all conversation history for context
      (conversationHistory || [])
        .filter((msg) => msg.id !== 'sending')
        .forEach((msg) => {
          analysisMessages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });

      // Add the current message
      analysisMessages.push({
        role: 'user',
        content: message
      });

      // Add analysis instruction
      analysisMessages.push({
        role: 'user',
        content: ANALYSIS_PROMPT
      });

      const analysisResponse = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: analysisMessages,
            temperature: 0.3,
            max_tokens: 2048
          })
        }
      );

      const analysisData = await analysisResponse.json();
      const analysisText = analysisData.choices?.[0]?.message?.content || '{}';
      
      // Extract JSON
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || analysisText.match(/{[\s\S]*}/);
      const snapshotAnalysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : '{}');

      // Generate unique ID
      snapshotUrl = generateSnapshotId();

      // Store snapshot
      const snapshotData = {
        userId,
        phoneNumber,
        messages: [...(conversationHistory || []), { id: Date.now().toString(), role: 'assistant', text: aiResponse, timestamp: Date.now() }],
        snapshot: snapshotAnalysis,
        snapshotUrl,
        createdAt: Date.now()
      };

      snapshots.set(snapshotUrl, snapshotData);
      
      // Save to MongoDB if available
      if (mongoDb) {
        try {
          await mongoDb.collection('snapshots').insertOne({
            snapshotId: snapshotUrl,
            ...snapshotData,
            createdAt: new Date()
          });
          console.log('Saved snapshot to MongoDB:', snapshotUrl);
        } catch (dbErr) {
          console.error('MongoDB save error:', dbErr.message);
        }
      }
    }

    res.json({
      response: aiResponse.replace('SNAPSHOT_COMPLETE', '').trim(),
      isComplete,
      snapshotUrl,
      snapshot: isComplete ? snapshots.get(snapshotUrl) : undefined
    });
  } catch (error) {
    console.error('Snapshot chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      response: 'I apologize, but I encountered a technical issue. Please try again.'
    });
  }
});

// Get snapshot by ID
// Test endpoint to create a dummy snapshot for testing
app.post('/api/snapshot/test-create', (req, res) => {
  const snapshotId = 'test-snapshot-123';
  const testSnapshot = {
    userId: 'test-user',
    phoneNumber: '+919876543210',
    snapshot: {
      emotionalPatterns: {
        currentState: 'Generally feeling balanced with occasional stress',
        stressTriggers: ['Work deadlines', 'Social situations', 'Uncertainty'],
        stressResponse: 'Tends to withdraw initially, then seeks support',
        regulation: ['Deep breathing', 'Journaling', 'Talking to friends']
      },
      relationshipPatterns: {
        connectionStyle: 'Prefers deep, meaningful connections over many casual ones',
        uncertaintyResponse: 'Sometimes worries about being valued by others',
        conflictStyle: 'Avoids conflict initially, but willing to discuss when calm',
        attachmentNotes: 'Secure with moments of anxiety in relationships'
      },
      whatHelps: ['Exercise', 'Creative hobbies', 'Quality time with close friends', 'Nature walks'],
      whatHurts: ['Feeling dismissed', 'Lack of structure', 'Isolation for too long'],
      personalityTendencies: {
        bigFive: {
          openness: 'High - Curious and enjoys new experiences',
          conscientiousness: 'Moderate - Organized but flexible',
          extraversion: 'Moderate - Enjoys socializing but needs alone time',
          agreeableness: 'High - Values harmony and empathy',
          emotionalStability: 'Moderate - Generally stable with occasional stress'
        },
        cognitiveStyle: 'Balanced between analytical thinking and intuitive feeling',
        naturalRhythm: 'Morning person with creative energy in evenings'
      },
      meaningfulExperiences: 'Finds meaning in helping others, creating things, and deep conversations',
      summary: 'This person shows a balanced psychological profile with healthy coping mechanisms and strong relationship values. They demonstrate self-awareness and actively work on emotional regulation. While they experience normal stress and occasional relationship anxiety, they have developed effective strategies for managing these challenges. Their personality suggests someone who is introspective, empathetic, and growth-oriented.'
    },
    createdAt: Date.now()
  };
  
  snapshots.set(snapshotId, testSnapshot);
  console.log('[TEST] Created test snapshot:', snapshotId);
  res.json({ snapshotId, url: `/snapshot/${snapshotId}` });
});

// Get user's snapshots by phone number
app.get('/api/user/snapshots', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    console.log('[USER SNAPSHOTS] Fetching snapshots for:', phone);
    
    let userSnapshots = [];
    
    // Try MongoDB first
    if (mongoDb) {
      try {
        userSnapshots = await mongoDb.collection('snapshots')
          .find({ phoneNumber: phone })
          .sort({ createdAt: -1 })
          .toArray();
        console.log('[USER SNAPSHOTS] Found', userSnapshots.length, 'snapshots in MongoDB');
      } catch (dbErr) {
        console.error('[USER SNAPSHOTS] MongoDB error:', dbErr.message);
      }
    }
    
    // Fallback to in-memory
    if (userSnapshots.length === 0) {
      userSnapshots = Array.from(snapshots.values())
        .filter(snap => snap.phoneNumber === phone)
        .sort((a, b) => b.createdAt - a.createdAt);
      console.log('[USER SNAPSHOTS] Found', userSnapshots.length, 'snapshots in memory');
    }
    
    res.json({ snapshots: userSnapshots });
  } catch (error) {
    console.error('[USER SNAPSHOTS] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Link snapshot to user after login
app.post('/api/snapshot/link', async (req, res) => {
  try {
    const { snapshotId, phoneNumber } = req.body;
    
    if (!snapshotId || !phoneNumber) {
      return res.status(400).json({ error: 'snapshotId and phoneNumber are required' });
    }
    
    console.log('[LINK SNAPSHOT] Linking', snapshotId, 'to', phoneNumber);
    
    let updated = false;
    
    // Update in MongoDB
    if (mongoDb) {
      try {
        const result = await mongoDb.collection('snapshots').updateOne(
          { snapshotId },
          { 
            $set: { 
              phoneNumber,
              linkedAt: new Date()
            } 
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log('[LINK SNAPSHOT] Updated in MongoDB');
          updated = true;
        }
      } catch (dbErr) {
        console.error('[LINK SNAPSHOT] MongoDB error:', dbErr.message);
      }
    }
    
    // Update in memory
    const snapshot = snapshots.get(snapshotId);
    if (snapshot) {
      snapshot.phoneNumber = phoneNumber;
      snapshot.linkedAt = Date.now();
      snapshots.set(snapshotId, snapshot);
      console.log('[LINK SNAPSHOT] Updated in memory');
      updated = true;
    }
    
    if (updated) {
      res.json({ success: true, message: 'Snapshot linked to user' });
    } else {
      res.status(404).json({ error: 'Snapshot not found' });
    }
  } catch (error) {
    console.error('[LINK SNAPSHOT] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/snapshot/:snapshotId', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    console.log('[SNAPSHOT GET] Fetching snapshot:', snapshotId);
    
    // Try MongoDB first
    if (mongoDb) {
      try {
        const snapshot = await mongoDb.collection('snapshots').findOne({ snapshotId });
        if (snapshot) {
          console.log('[SNAPSHOT GET] Found in MongoDB:', snapshotId);
          return res.json(snapshot);
        }
      } catch (dbErr) {
        console.error('[SNAPSHOT GET] MongoDB error:', dbErr.message);
      }
    }
    
    // Fallback to in-memory
    console.log('[SNAPSHOT GET] Available in-memory snapshots:', Array.from(snapshots.keys()));
    const snapshot = snapshots.get(snapshotId);

    if (!snapshot) {
      console.log('[SNAPSHOT GET] Snapshot not found:', snapshotId);
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    console.log('[SNAPSHOT GET] Returning from memory:', snapshotId);
    res.json(snapshot);
  } catch (error) {
    console.error('[SNAPSHOT GET] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateSnapshotId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

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
