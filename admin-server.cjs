#!/usr/bin/env node
// Minimal admin server for local testing (CommonJS version)
// Usage: node admin-server.cjs

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Admin secret (use env var or hardcoded for local testing)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';
const PROFILES_FILE = '/tmp/themindnetwork_profiles.json';
const REFERRALS_FILE = '/tmp/themindnetwork_referrals.json';

console.log('🚀 Admin test server starting on port', PORT);
console.log('📝 ADMIN_SECRET:', ADMIN_SECRET);

// Helper to read JSON file
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return [];
  }
}

// Login endpoint
app.post('/api/admin', (req, res) => {
  const action = req.query.action;
  const { password } = req.body || {};

  if (action === 'login') {
    if (!password || password !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(200).json({ success: true, token: ADMIN_SECRET });
  }

  // All other actions require valid token
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Profiles endpoint
  if (action === 'profiles') {
    try {
      const data = readJsonFile(PROFILES_FILE);
      return res.status(200).json({ profiles: data, total: data.length });
    } catch (err) {
      console.error('Error reading profiles:', err);
      return res.status(500).json({ error: 'Failed to read profiles' });
    }
  }

  // Referrals endpoint
  if (action === 'referrals') {
    try {
      const data = readJsonFile(REFERRALS_FILE);
      return res.status(200).json(data);
    } catch (err) {
      console.error('Error reading referrals:', err);
      return res.status(500).json({ error: 'Failed to read referrals' });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Admin server ready!`);
  console.log(`   Frontend: http://localhost:5173/#/admin-login`);
  console.log(`   Password: ${ADMIN_SECRET}`);
  console.log(`\n   Reading from:`);
  console.log(`   - Profiles: ${PROFILES_FILE}`);
  console.log(`   - Referrals: ${REFERRALS_FILE}`);
  console.log(`\n💡 To stop: Ctrl+C\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});
