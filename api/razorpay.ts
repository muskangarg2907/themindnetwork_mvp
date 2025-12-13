import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, planId, planName } = req.body;

  if (!amount || !planId || !planName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[RAZORPAY] Missing credentials:', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
      });
      return res.status(500).json({ 
        error: 'Razorpay not configured. Please contact support.',
        details: 'Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables'
      });
    }

    const Razorpay = require('razorpay');
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${planId}_${Date.now()}`,
      notes: {
        plan_id: planId,
        plan_name: planName,
      },
    });

    console.log('[RAZORPAY] Order created:', order.id);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('[RAZORPAY] Order creation failed:', err);
    console.error('[RAZORPAY] Error details:', {
      message: err?.message,
      code: err?.code,
      description: err?.description,
      stack: err?.stack
    });
    return res.status(500).json({ 
      error: 'Failed to create payment order', 
      details: err?.message || 'Unknown error',
      errorCode: err?.code || 'UNKNOWN'
    });
  }
}
