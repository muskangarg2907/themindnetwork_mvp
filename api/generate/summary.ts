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
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      const name = profile?.basicInfo?.fullName || 'Client';
      const text = `${name} submitted an intake form. Summary: brief clinical intake summary unavailable in local mode.`;
      return res.status(200).json({ text });
    }

    const prompt = `Create a brief clinical intake summary (max 3 sentences) for a mental health profile. Use data: ${JSON.stringify(profile)}`;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const body = { instructions: prompt };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const json = await r.json();
    const text = json?.candidates?.[0]?.content || json?.output?.[0]?.content || json?.text || JSON.stringify(json);
    return res.status(200).json({ text });
  } catch (err: any) {
    console.error('Generation error:', err);
    return res.status(500).json({ error: 'Generation failed', details: err?.message });
  }
}
