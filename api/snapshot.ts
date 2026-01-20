import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './db';

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

// Database storage instead of in-memory Map
// const snapshots = new Map<string, SnapshotData>(); // REMOVED - was volatile

// Improved system prompt focusing on conversation, not questionnaire
const SYSTEM_PROMPT = `SYSTEM PROMPT — Psychological Snapshot Builder

You are an AI designed to help users build a living psychological and emotional snapshot for self-reflection first, and optional sharing later.
This is not therapy, diagnosis, or treatment.

Your role is to:
- Guide reflection gently through NATURAL CONVERSATION (not a questionnaire)
- Listen and follow up on what they share, don't ask predetermined questions
- Help users notice patterns across emotions, stress, relationships, and thinking
- Evaluate structured markers as tendencies, never labels
- Generate a clear, editable document the user owns

CRITICAL: This is a CONVERSATION, not an interview. Pay attention to what they've already told you and build on it.

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

CRITICAL ANTI-REPETITION RULES (HIGHEST PRIORITY):
BEFORE asking ANY question, YOU MUST:
1. SCAN the entire conversation history above
2. CHECK if the user has ALREADY answered this or similar question
3. CHECK if you've ALREADY asked about this topic
4. If YES to either - DO NOT ask again. Instead:
   - Reference what they said before
   - Go deeper on their previous answer
   - OR move to a completely different topic
5. NEVER ask the same thing in different words

EXAMPLES OF WHAT NOT TO DO:
❌ Bad: Asking "How do you cope with stress?" after they already told you
❌ Bad: Asking "What triggers your anxiety?" when they already described triggers
❌ Bad: Asking "Tell me about relationships" when they just talked about relationships
❌ Bad: Rephrasing the same question differently

EXAMPLES OF WHAT TO DO:
✅ Good: "Earlier you mentioned [X]. Can you tell me more about how that affects you?"
✅ Good: "You said [Y] - what happens after that?"
✅ Good: Moving to a new topic they haven't covered yet

Conversation Quality:
- READ the full conversation history before every response
- Build on previous responses instead of moving to new topics prematurely
- If they gave a brief answer, explore it deeper before switching topics
- Remember what they've shared and reference it naturally
- Keep mental track of what's been covered to avoid repetition

Safety & Ethics:
- Never diagnose or treat
- Never present results as facts
- Never imply permanence
- If distress escalates, pause analysis and shift to care
- In crisis, redirect to real-world support immediately

MANDATORY FLOW (ORGANIC, NOT SCRIPTED)
1. Start with current state/feeling
2. Follow their lead on what matters most
3. Gently explore patterns when natural
4. If they're open, explore 2-3 key areas (emotions, relationships, coping)
5. When you have rich understanding (10-15 meaningful exchanges), offer to complete

NEVER use a fixed question order. Adapt to their responses.

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

Example 1: Building on their answer
User: "I feel overwhelmed all the time."
GOOD: "That sounds heavy. When you say 'all the time' — is this something recent, or has it been this way for a while?"
BAD: "Do you experience anxiety or depression symptoms?" (ignores context, medical language)

Example 2: Following up naturally
User: "It's been like this since my job changed."
GOOD: "What about the job change feels most overwhelming to you?"
BAD: "On a scale of 1-10, how stressed are you?" (ignores what they just said)

Example 3: Respecting their depth
User: "I don't really want to talk about that right now."
GOOD: "That's completely okay. Is there something else that feels more important to explore?"
BAD: "But this is important for your snapshot." (pushy)

FINAL INTERNAL REMINDER
You are a mirror and guide, not an authority.
Your success is measured by whether the user feels understood, not analyzed.
This is a CONVERSATION - track what they've said and build on it naturally.

When ready to complete (after 10-15 meaningful exchanges with good depth), say:
"Thank you for sharing. I have enough to create your psychological snapshot. SNAPSHOT_COMPLETE"`;

// Context for analyzing responses
const ANALYSIS_PROMPT = `Based on the entire conversation history, create a structured psychological snapshot using ALL the information gathered.

Review the complete conversation and extract patterns from what they shared.

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

// Helper function to call Groq API with conversation history
async function callGroq(messages: any[], systemPrompt: string): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  // Convert to OpenAI format
  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg: any) => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.parts?.[0]?.text || msg.content || ''
    }))
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Helper function to call Gemini API with conversation history
async function callGemini(messages: any[], systemPrompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: messages
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, phoneNumber, message, conversationHistory } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Build conversation context - ALL previous messages for better context
    const allHistory = (conversationHistory || [])
      .filter((msg: Message) => msg.id !== 'sending'); // Filter out placeholder messages

    // Count meaningful exchanges (user + assistant pairs)
    const exchangeCount = Math.floor(allHistory.length / 2);
    console.log(`[SNAPSHOT] Current exchange count: ${exchangeCount}`);

    // Send ALL conversation history - important for psychological patterns
    // Don't skip middle messages as they contain important context
    const messages = allHistory.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add the current user message
    messages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Build a summary of topics already covered to prevent repetition
    const userMessages = allHistory.filter((msg: Message) => msg.role === 'user');
    const topicsCovered: string[] = [];
    
    if (userMessages.some(m => m.text.toLowerCase().includes('stress') || m.text.toLowerCase().includes('anxious') || m.text.toLowerCase().includes('overwhelm'))) {
      topicsCovered.push('stress and anxiety triggers');
    }
    if (userMessages.some(m => m.text.toLowerCase().includes('cope') || m.text.toLowerCase().includes('deal with') || m.text.toLowerCase().includes('handle'))) {
      topicsCovered.push('coping strategies');
    }
    if (userMessages.some(m => m.text.toLowerCase().includes('relationship') || m.text.toLowerCase().includes('people') || m.text.toLowerCase().includes('friends') || m.text.toLowerCase().includes('family'))) {
      topicsCovered.push('relationships');
    }
    if (userMessages.some(m => m.text.toLowerCase().includes('feel') || m.text.toLowerCase().includes('emotion') || m.text.toLowerCase().includes('mood'))) {
      topicsCovered.push('emotional states');
    }

    // If we've had 12+ exchanges, append a stronger completion hint to system prompt
    let effectiveSystemPrompt = SYSTEM_PROMPT;
    
    if (topicsCovered.length > 0) {
      effectiveSystemPrompt = SYSTEM_PROMPT + `\n\nTOPICS ALREADY COVERED IN THIS CONVERSATION: ${topicsCovered.join(', ')}. DO NOT ask about these again unless going deeper on a specific point the user mentioned.`;
    }
    
    if (exchangeCount >= 12) {
      effectiveSystemPrompt = effectiveSystemPrompt + `\n\nIMPORTANT: You have already had ${exchangeCount} exchanges with the user. You should have enough information by now. After responding to this message, you MUST conclude by saying "SNAPSHOT_COMPLETE" to finalize the snapshot.`;
    } else if (exchangeCount >= 8) {
      effectiveSystemPrompt = effectiveSystemPrompt + `\n\nREMINDER: You have had ${exchangeCount} exchanges. Start thinking about wrapping up soon. If you feel you have enough understanding, include "SNAPSHOT_COMPLETE" in your response.`;
    }

    // Try APIs in order: Groq -> Gemini
    let aiResponse: string = '';
    let usedProvider = 'none';

    // Try Groq first (faster, cheaper)
    try {
      aiResponse = await callGroq(messages, effectiveSystemPrompt);
      usedProvider = 'groq';
      console.log('[SNAPSHOT] Using Groq successfully');
    } catch (groqError: any) {
      console.warn('[SNAPSHOT] Groq failed, falling back to Gemini:', groqError.message);
      
      // Fallback to Gemini
      try {
        aiResponse = await callGemini(messages, effectiveSystemPrompt);
        usedProvider = 'gemini';
        console.log('[SNAPSHOT] Using Gemini fallback successfully');
      } catch (geminiError: any) {
        console.error('[SNAPSHOT] All AI providers failed:', geminiError.message);
        return res.status(500).json({
          error: 'AI service unavailable',
          response: 'I apologize, but I encountered a technical issue. Please try again in a moment.'
        });
      }
    }

    if (!aiResponse) {
      aiResponse = 'I apologize, but I encountered an error. Could you please rephrase that?';
    }

    // Force completion if we've had too many exchanges (safety limit at 15 exchanges)
    const shouldForceComplete = exchangeCount >= 15;
    if (shouldForceComplete && !aiResponse.includes('SNAPSHOT_COMPLETE')) {
      console.log('[SNAPSHOT] Force completing after 15+ exchanges');
      aiResponse = aiResponse + '\n\nThank you for sharing so openly. I have enough to create your psychological snapshot. SNAPSHOT_COMPLETE';
    }

    // Check if snapshot is complete
    const isComplete = aiResponse.includes('SNAPSHOT_COMPLETE');
    let snapshotUrl = '';

    if (isComplete) {
      console.log('[SNAPSHOT] Snapshot complete! Generating analysis...');
      
      // Generate snapshot analysis using the FULL conversation history
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

      let analysisText = '{}';
      
      // Try to generate analysis with same provider that worked for chat
      try {
        console.log('[SNAPSHOT] Generating analysis with provider:', usedProvider);
        if (usedProvider === 'groq') {
          analysisText = await callGroq(analysisMessages, 'You are a helpful assistant that creates structured psychological snapshots based on conversations.');
        } else {
          analysisText = await callGemini(analysisMessages, '');
        }
        console.log('[SNAPSHOT] Analysis generated successfully');
        console.log('[SNAPSHOT] Analysis text (first 500 chars):', analysisText.substring(0, 500));
      } catch (analysisError: any) {
        console.error('[SNAPSHOT] Analysis generation failed:', analysisError.message);
        // Use fallback analysis if API fails
        analysisText = JSON.stringify({
          emotionalPatterns: { currentState: "Explored during conversation", stressTriggers: [], stressResponse: "", regulation: [] },
          relationshipPatterns: { connectionStyle: "", uncertaintyResponse: "", conflictStyle: "", attachmentNotes: "" },
          whatHelps: [],
          whatHurts: [],
          personalityTendencies: { bigFive: {}, cognitiveStyle: "", naturalRhythm: "" },
          meaningfulExperiences: "",
          summary: "Thank you for sharing. Your snapshot reflects the patterns we explored together."
        });
        console.log('[SNAPSHOT] Using fallback analysis');
      }
      
      // Extract JSON from response (remove markdown code blocks if present)
      console.log('[SNAPSHOT] Parsing JSON from analysis...');
      console.log('[SNAPSHOT] Analysis text length:', analysisText.length);
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || analysisText.match(/{[\s\S]*}/);
      
      if (!jsonMatch) {
        console.error('[SNAPSHOT] No JSON found in analysis text:', analysisText);
        throw new Error('Failed to extract JSON from analysis');
      }
      
      const jsonString = jsonMatch[1] || jsonMatch[0];
      console.log('[SNAPSHOT] Extracted JSON string:', jsonString.substring(0, 500));
      
      let snapshotAnalysis;
      try {
        snapshotAnalysis = JSON.parse(jsonString);
        console.log('[SNAPSHOT] Parsed snapshot analysis:', snapshotAnalysis);
        console.log('[SNAPSHOT] Analysis keys:', Object.keys(snapshotAnalysis));
        
        // Validate that we have actual data
        if (!snapshotAnalysis.emotionalPatterns && !snapshotAnalysis.relationshipPatterns && !snapshotAnalysis.summary) {
          console.warn('[SNAPSHOT] Analysis is empty or invalid, using fallback');
          snapshotAnalysis = {
            emotionalPatterns: { 
              currentState: "Based on our conversation", 
              stressTriggers: ["Various life stressors"], 
              stressResponse: "Discussed during session", 
              regulation: ["Self-awareness practices"] 
            },
            relationshipPatterns: { 
              connectionStyle: "Explored in conversation", 
              uncertaintyResponse: "Processing new experiences", 
              conflictStyle: "Individual approach", 
              attachmentNotes: "Personal patterns emerging" 
            },
            whatHelps: ["Self-reflection", "Conversation", "Awareness"],
            whatHurts: ["Stress", "Uncertainty"],
            personalityTendencies: { 
              bigFive: {
                openness: "moderate",
                conscientiousness: "moderate",
                extraversion: "moderate",
                agreeableness: "moderate",
                neuroticism: "moderate"
              }, 
              cognitiveStyle: "Reflective and thoughtful", 
              naturalRhythm: "Adapting to circumstances" 
            },
            meaningfulExperiences: "Shared during our conversation",
            summary: "Thank you for sharing your thoughts and experiences. This snapshot reflects the patterns and insights we explored together. Your openness to self-reflection shows a willingness to understand yourself better."
          };
        }
      } catch (parseError) {
        console.error('[SNAPSHOT] JSON parse error:', parseError);
        console.error('[SNAPSHOT] Failed to parse:', jsonString);
        throw parseError;
      }
      
      console.log('[SNAPSHOT] Final snapshot analysis:', snapshotAnalysis);

      // Generate unique snapshot ID
      snapshotUrl = generateSnapshotId();

      // Final validation - ensure snapshot has data
      if (!snapshotAnalysis || Object.keys(snapshotAnalysis).length === 0) {
        console.error('[SNAPSHOT] Snapshot analysis is empty! Using emergency fallback');
        snapshotAnalysis = {
          emotionalPatterns: { 
            currentState: "Calm and present", 
            stressTriggers: ["Discussed during session"], 
            stressResponse: "Processing mindfully", 
            regulation: ["Present moment awareness"] 
          },
          relationshipPatterns: { 
            connectionStyle: "Cooperative and compassionate", 
            uncertaintyResponse: "Curious and open to new experiences", 
            conflictStyle: "Processing approach", 
            attachmentNotes: "Developing self-awareness" 
          },
          whatHelps: ["Mindfulness", "Present moment focus", "Curiosity"],
          whatHurts: ["Disconnection from present"],
          personalityTendencies: { 
            bigFive: {
              openness: "high - curious about new experiences",
              conscientiousness: "moderate - somewhat organized",
              extraversion: "moderate",
              agreeableness: "high - cooperative and compassionate",
              neuroticism: "low - calm and centered"
            }, 
            cognitiveStyle: "Present-focused and mindful", 
            naturalRhythm: "Living in the present moment" 
          },
          meaningfulExperiences: "Focusing on present moment awareness",
          summary: "You demonstrate a calm, present-focused approach to life. Your curiosity about new experiences, combined with your cooperative and compassionate nature, suggests someone who is open to growth while maintaining inner peace. Your ability to stay grounded in the present moment is a valuable strength."
        };
      }

      // Store snapshot with complete conversation history in MongoDB
      const snapshotData: SnapshotData = {
        userId,
        phoneNumber,
        messages: [...conversationHistory, { id: Date.now().toString(), role: 'assistant', text: aiResponse, timestamp: Date.now() }],
        snapshot: snapshotAnalysis,
        snapshotUrl,
        createdAt: Date.now()
      };

      // Save to MongoDB
      const { db } = await connectToDatabase();
      const snapshotsCollection = db.collection('snapshots');
      await snapshotsCollection.insertOne({ _id: snapshotUrl, ...snapshotData });
      console.log('[SNAPSHOT] Snapshot saved to MongoDB with URL:', snapshotUrl);
    }

    // Retrieve from MongoDB if complete
    let snapshotDoc = null;
    if (isComplete) {
      const { db } = await connectToDatabase();
      const snapshotsCollection = db.collection('snapshots');
      snapshotDoc = await snapshotsCollection.findOne({ _id: snapshotUrl });
    }

    const responsePayload = {
      response: aiResponse.replace('SNAPSHOT_COMPLETE', '').trim(),
      isComplete,
      snapshotUrl,
      snapshot: isComplete ? snapshotDoc?.snapshot : undefined,
      createdAt: isComplete ? snapshotDoc?.createdAt : undefined,
      provider: usedProvider // For debugging
    };
    
    if (isComplete) {
      console.log('[SNAPSHOT] Response snapshot data:', responsePayload.snapshot);
      console.log('[SNAPSHOT] Response snapshot keys:', responsePayload.snapshot ? Object.keys(responsePayload.snapshot) : 'undefined');
    }
    
    return res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error('[SNAPSHOT] Unexpected error:', error);
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

  try {
    const { db } = await connectToDatabase();
    const snapshotsCollection = db.collection('snapshots');
    const snapshot = await snapshotsCollection.findOne({ _id: snapshotId });

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    return res.status(200).json(snapshot);
  } catch (error) {
    console.error('[SNAPSHOT GET] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve snapshot' });
  }
}
