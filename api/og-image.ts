import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAGES: Record<string, { title: string; subtitle: string; tag: string }> = {
  home: {
    title: 'Find the Right Therapist.',
    subtitle: 'Verified therapists. Affordable care. AI-powered matching.',
    tag: 'Online Therapy in India',
  },
  'therapy-guide': {
    title: 'Which Therapy Is\nRight for Me?',
    subtitle: 'Free interactive guide · CBT · ACT · DBT · Psychodynamic · and more',
    tag: 'Free Therapy Guide',
  },
};

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const page = ((req.query.page as string) || 'home').replace(/[^a-z0-9-]/gi, '');
  const meta = PAGES[page] || PAGES['home'];

  // Handle multi-line titles (newline in string)
  const titleLines = meta.title.includes('\n') ? meta.title.split('\n') : wrapText(meta.title, 26);
  const subtitleLines = wrapText(meta.subtitle, 58);

  const titleY = titleLines.length === 1 ? 310 : 280;
  const titleLineHeight = 72;
  const subtitleYStart = titleY + titleLines.length * titleLineHeight + 24;

  const titleSvg = titleLines
    .map((line, i) => `<text x="80" y="${titleY + i * titleLineHeight}" font-family="Georgia, serif" font-size="62" font-weight="bold" fill="white">${escapeXml(line)}</text>`)
    .join('\n    ');

  const subtitleSvg = subtitleLines
    .map((line, i) => `<text x="80" y="${subtitleYStart + i * 38}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="rgba(163,177,138,1)">${escapeXml(line)}</text>`)
    .join('\n    ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2E3A2F"/>
      <stop offset="100%" stop-color="#1e2920"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative accent bar -->
  <rect x="0" y="0" width="8" height="630" fill="#A3B18A"/>

  <!-- Top tag pill -->
  <rect x="80" y="72" width="${meta.tag.length * 14 + 32}" height="40" rx="20" fill="rgba(163,177,138,0.18)"/>
  <text x="96" y="98" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="#A3B18A" letter-spacing="1">${escapeXml(meta.tag.toUpperCase())}</text>

  <!-- Title -->
  ${titleSvg}

  <!-- Subtitle -->
  ${subtitleSvg}

  <!-- Bottom brand strip -->
  <rect x="0" y="560" width="1200" height="70" fill="rgba(0,0,0,0.25)"/>
  <circle cx="80" cy="595" r="18" fill="#A3B18A"/>
  <text x="78" y="602" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="#2E3A2F" text-anchor="middle">T</text>
  <text x="110" y="602" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="bold" fill="white">TheMindNetwork</text>
  <text x="1120" y="602" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="rgba(163,177,138,0.8)" text-anchor="end">themindnetwork.in</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  res.status(200).send(svg);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
