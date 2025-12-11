import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

async function connectToMongoDB() {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set');
    return null;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  // HEALTH CHECK
  if (!action || action === 'health') {
    return res.status(200).json({ ok: true, db: !!process.env.MONGODB_URI });
  }

  // CONTACT FORM
  if (action === 'contact') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

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

      // Store in MongoDB
      const client = await connectToMongoDB();
      if (client) {
        try {
          const db = client.db('themindnetwork');
          const result = await db.collection('contact_submissions').insertOne(submission);
          console.log('Contact form saved to MongoDB:', result.insertedId);
        } catch (mongoErr) {
          console.error('Failed to save to MongoDB:', mongoErr);
        }
      }

      // Log the contact form submission
      console.log('Contact Form Submission:', {
        name,
        email,
        message,
        timestamp: submission.timestamp.toISOString()
      });

      // Send email using Resend (if configured)
      if (process.env.RESEND_API_KEY) {
        try {
          const emailData = {
            from: 'TheMindNetwork <noreply@themindnetwork.com>',
            to: 'muskangarg.official@gmail.com',
            subject: `New Contact Form Submission from ${name}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><small>Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small></p>
            `,
            text: `
New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}

Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            `
          };

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
          });

          if (!response.ok) {
            console.error('Failed to send email via Resend:', await response.text());
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Thank you for your message! We will get back to you soon.' 
      });

    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({ error: 'Failed to submit contact form' });
    }
  }

  return res.status(400).json({ error: 'Invalid action parameter. Use: health or contact' });
}
