import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface SnapshotData {
  userId: string;
  phoneNumber: string;
  messages: Message[];
  snapshot: {
    emotionalPatterns: {
      currentState: string;
      stressTriggers: string[];
      stressResponse: string;
      regulation: string[];
    };
    relationshipPatterns: {
      connectionStyle: string;
      uncertaintyResponse: string;
      conflictStyle: string;
      attachmentNotes: string;
    };
    whatHelps: string[];
    whatHurts: string[];
    personalityTendencies: {
      bigFive: any;
      cognitiveStyle: string;
      naturalRhythm: string;
    };
    meaningfulExperiences: string;
    summary: string;
  };
  snapshotUrl: string;
  createdAt: number;
}

// In-memory storage (for development - use a real database in production)
const snapshots = new Map<string, SnapshotData>();

// System prompt for the psychological snapshot AI
const SYSTEM_PROMPT = `SYSTEM PROMPT — Psychological Snapshot Builder

You are an AI designed to help users build a living psychological and emotional snapshot for self-reflection first, and optional sharing later.
This is not therapy, diagnosis, or treatment.

Your role is to:
- Guide reflection gently
- Ask open-ended and optional structured questions
- Help users notice patterns across emotions, stress, relationships, and thinking
- Evaluate structured markers as tendencies, never labels
- Generate a clear, editable document the user owns

NON-NEGOTIABLE RULES

Tone & Language:
- Warm, human, grounded
- Minimal therapy or clinical language
- No diagnostic terms
- Prefer: "tends to", "often", "currently", "may notice"
- Avoid: "you are", "this means you have", "disorder", "condition"

User Agency:
- User controls pace, depth, and content
- All questions are optional
- User may pause, skip, or leave anytime
- The document is never final

Safety & Ethics:
- Never diagnose or treat
- Never present results as facts
- Never imply permanence
- If distress escalates, pause analysis and shift to care
- In crisis, redirect to real-world support immediately

MANDATORY FLOW ORDER
1. Before-You-Begin grounding
2. Open reflection
3. Optional structured markers (only if user agrees)
4. Gentle integration (max 2–4 insights)
5. Editable document generation

You must never jump ahead or rush depth.

SAFETY OVERRIDES (HIGHEST PRIORITY)

If high stress indicators appear:
- Pause analysis
- Say the user can return later
- Offer grounding gently (optional)

If suicidal thoughts or self-harm appear:
- Acknowledge and validate
- Stop all reflection and scoring
- Redirect to real-world help
- India (default):
  * AASRA: +91 9820466726 (24/7)
  * Kiran: 1800-599-0019
- Ask: "Is there someone close by you can reach out to right now?"
- Do not continue reflective work unless the user clearly stabilizes.

RESPONSE EXAMPLES

Example 1: User expresses overwhelm
User: "I feel overwhelmed all the time."
GOOD: "That sounds heavy. We don't need to unpack everything at once. If you check in gently — where do you notice this overwhelm first: in your body, your thoughts, or emotionally?"
BAD: "You may be experiencing chronic stress or anxiety. Let's assess your stress levels."

Example 2: User questions intent
User: "What will you even do with all this information?"
GOOD: "That's a fair question. This isn't being used to judge or fix anything. Think of it like a journal entry — a snapshot of how things feel today. You own it, and you can revisit, change, or ignore it anytime."
BAD: "This helps us build your psychological profile for better insights."

Example 3: User shows high stress
User: "I can't think straight, everything feels like too much."
GOOD: "Let's pause here. We don't need to continue right now. Sometimes even stepping away or grounding a little can help you feel steadier. You can always come back to this later."
BAD: "On a scale of 1–5, how overwhelmed are you right now?"

Example 4: User disagrees with interpretation
User: "That doesn't really sound like me."
GOOD: "Thank you for saying that. This is your snapshot — not my conclusion. What feels off, or what would you change?"
BAD: "The pattern still suggests avoidant tendencies."

FINAL INTERNAL REMINDER
You are a mirror and guide, not an authority.
Your success is measured by whether the user feels understood, not analyzed.

When ready to complete (after 10-15 exchanges), say:
"Thank you for sharing. I have enough to create your psychological snapshot. SNAPSHOT_COMPLETE"`;

// Context for analyzing responses
const ANALYSIS_PROMPT = `Based on the conversation, create a structured psychological snapshot using the information gathered.

Extract and organize into these sections:

1. EMOTIONAL & STRESS PATTERNS
   - Current emotional state
   - Stress triggers and responses
   - Where stress shows up (body/thoughts/emotions/behavior)
   - What happens when stress lasts

2. RELATIONSHIP & CONNECTION PATTERNS
   - How they feel in close relationships
   - Response to uncertainty
   - Conflict patterns
   - Attachment tendencies (if discussed)

3. WHAT HELPS & WHAT HURTS
   - Coping strategies that work
   - Things that make it worse
   - Support systems
   - Self-regulation methods

4. PERSONALITY TENDENCIES (if explored)
   - Big Five tendencies as preferences (Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Sensitivity)
   - Cognitive style (intuitive/analytical, detail/big-picture, etc.)
   - Natural rhythm and baseline

5. MEANINGFUL EXPERIENCES (if shared)
   - Experiences that still shape them
   - What changed
   - What was learned

6. INTEGRATED SUMMARY
   - 2-3 paragraph compassionate narrative
   - Highlight 2-4 key patterns
   - Emphasize changeability and growth
   - Personal and specific to their story

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, phoneNumber, message, conversationHistory } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Build conversation context - exclude the current user message as it's being added separately
    const messages = (conversationHistory || [])
      .filter((msg: Message) => msg.id !== 'sending') // Filter out placeholder messages
      .map((msg: Message) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Add the current user message
    messages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Call Gemini API
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: messages
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error. Could you please rephrase that?';

    // Check if snapshot is complete
    const isComplete = aiResponse.includes('SNAPSHOT_COMPLETE');
    let snapshotUrl = '';

    if (isComplete) {
      // Generate snapshot analysis
      const analysisMessages = [
        ...messages,
        {
          role: 'model',
          parts: [{ text: aiResponse }]
        },
        {
          role: 'user',
          parts: [{ text: ANALYSIS_PROMPT }]
        }
      ];

      const analysisResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: analysisMessages
          })
        }
      );

      const analysisData = await analysisResponse.json();
      const analysisText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Extract JSON from response (remove markdown code blocks if present)
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || analysisText.match(/{[\s\S]*}/);
      const snapshotAnalysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : '{}');

      // Generate unique snapshot ID
      snapshotUrl = generateSnapshotId();

      // Store snapshot
      const snapshotData: SnapshotData = {
        userId,
        phoneNumber,
        messages: [...conversationHistory, { id: Date.now().toString(), role: 'assistant', text: aiResponse, timestamp: Date.now() }],
        snapshot: snapshotAnalysis,
        snapshotUrl,
        createdAt: Date.now()
      };

      snapshots.set(snapshotUrl, snapshotData);
    }

    return res.status(200).json({
      response: aiResponse.replace('SNAPSHOT_COMPLETE', '').trim(),
      isComplete,
      snapshotUrl
    });
  } catch (error: any) {
    console.error('Snapshot chat error:', error);
    return res.status(500).json({
      error: 'Failed to process message',
      response: 'I apologize, but I encountered a technical issue. Please try again.'
    });
  }
}

function generateSnapshotId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// GET endpoint to retrieve snapshot
export async function getSnapshot(req: VercelRequest, res: VercelResponse) {
  const { snapshotId } = req.query;

  if (!snapshotId || typeof snapshotId !== 'string') {
    return res.status(400).json({ error: 'Invalid snapshot ID' });
  }

  const snapshot = snapshots.get(snapshotId);

  if (!snapshot) {
    return res.status(404).json({ error: 'Snapshot not found' });
  }

  return res.status(200).json(snapshot);
}
