#!/usr/bin/env node
// Minimal admin server for local testing
// Usage: node admin-server.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

// Login endpoint
app.post('/api/admin', (req, res) => {
  const { action } = req.query;
  const { password } = req.body || {};

  if (action === 'login') {
    if (!password || password !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(200).json({ success: true, token: ADMIN_SECRET });
  }

  // Profiles endpoint
  if (action === 'profiles') {
    const token = req.headers['x-admin-token'];
    if (token !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = fs.existsSync(PROFILES_FILE)
        ? JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'))
        : [];
      return res.status(200).json({ profiles: data, total: data.length });
    } catch (err) {
      console.error('Error reading profiles:', err);
      return res.status(500).json({ error: 'Failed to read profiles' });
    }
  }

  // Referrals endpoint
  if (action === 'referrals') {
    const token = req.headers['x-admin-token'];
    if (token !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = fs.existsSync(REFERRALS_FILE)
        ? JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf8'))
        : [];
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
  console.log(`\n   Profiles: ${PROFILES_FILE}`);
  console.log(`   Referrals: ${REFERRALS_FILE}`);
  console.log(`\n💡 To stop: Ctrl+C\n`);
});
