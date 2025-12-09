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

  try {
    const profile = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log('[BIO] No GEMINI_API_KEY configured, using fallback');
      const name = profile?.basicInfo?.fullName || 'Provider';
      const text = `${name} is a mental health provider with expertise in their field.`;
      return res.status(200).json({ text });
    }

    const prompt = `Create a professional 3-sentence bio for a mental health provider based on this profile data: ${JSON.stringify(profile)}. Focus on their expertise, approach, and who they help.`;
    
    // Use the correct Gemini API format with API key in URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    console.log('[BIO] Calling Gemini API...');
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error('[BIO] Gemini API error:', r.status, errorText);
      const fallback = `${profile?.basicInfo?.fullName || 'Provider'} is a dedicated mental health professional committed to supporting clients.`;
      return res.status(200).json({ text: fallback });
    }

    const json = await r.json();
    console.log('[BIO] Gemini response received');
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || `${profile?.basicInfo?.fullName || 'Provider'} is a mental health provider.`;
    return res.status(200).json({ text });
  } catch (err: any) {
    console.error('Generation error:', err);
    const fallback = 'Professional mental health provider.';
    return res.status(200).json({ text: fallback });
  }
}
