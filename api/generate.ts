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

  const { type } = req.query;

  try {
    const profile = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // BIO GENERATION
    if (type === 'bio') {
      if (!apiKey) {
        console.log('[BIO] No GEMINI_API_KEY configured, using fallback');
        const name = profile?.basicInfo?.fullName || 'Provider';
        const text = `${name} is a mental health provider with expertise in their field.`;
        return res.status(200).json({ text });
      }

      const prompt = `Create a professional 3-sentence bio for a mental health provider based on this profile data: ${JSON.stringify(profile)}. Focus on their expertise, approach, and who they help.`;
      
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
    }

    // SUMMARY GENERATION
    if (type === 'summary') {
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
    }

    return res.status(400).json({ error: 'Invalid type parameter. Use: bio or summary' });

  } catch (err: any) {
    console.error('Generation error:', err);
    const fallback = type === 'bio' ? 'Professional mental health provider.' : 'Clinical intake summary unavailable.';
    return res.status(200).json({ text: fallback });
  }
}
