// Test script to verify Groq API integration locally
// Run with: node test-groq-local.js

import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('./backend/.env', 'utf-8');
const GROQ_API_KEY = envContent
  .split('\n')
  .find(line => line.startsWith('GROQ_API_KEY='))
  ?.split('=')[1]
  ?.trim();

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in backend/.env');
  process.exit(1);
}

console.log('✅ GROQ_API_KEY loaded:', GROQ_API_KEY.substring(0, 10) + '...');

const SYSTEM_PROMPT = `SYSTEM PROMPT — Psychological Snapshot Builder

You are an AI designed to help users build a living psychological and emotional snapshot for self-reflection first, and optional sharing later.
This is not therapy, diagnosis, or treatment.

Your role is to:
- Guide reflection gently
- Ask open-ended and optional structured questions
- Help users notice patterns across emotions, stress, relationships, and thinking

Tone & Language:
- Warm, human, grounded
- Minimal therapy or clinical language
- No diagnostic terms
- Prefer: "tends to", "often", "currently", "may notice"

When ready to complete (after 10-15 exchanges), say:
"Thank you for sharing. I have enough to create your psychological snapshot. SNAPSHOT_COMPLETE"`;

async function testGroqChat() {
  console.log('\n🧪 Testing Groq API with sample conversation...\n');

  const testMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'I feel overwhelmed all the time.' }
  ];

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: testMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('✅ Groq API Response:\n');
    console.log(aiResponse);
    console.log('\n✅ Test passed! Groq is responding correctly with context.');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testGroqAnalysis() {
  console.log('\n🧪 Testing Groq Analysis Generation...\n');

  const conversationHistory = [
    { role: 'user', content: 'I feel overwhelmed all the time.' },
    { role: 'assistant', content: 'That sounds heavy. Where do you notice this overwhelm first?' },
    { role: 'user', content: 'In my chest, like pressure building up.' },
    { role: 'assistant', content: 'That physical sensation must be difficult. What usually helps when you notice that pressure?' },
    { role: 'user', content: 'Going for a walk, or just stepping outside for a bit.' }
  ];

  const ANALYSIS_PROMPT = `Based on the conversation, create a structured psychological snapshot using the information gathered.

Extract and organize into these sections:

1. EMOTIONAL & STRESS PATTERNS
2. RELATIONSHIP & CONNECTION PATTERNS
3. WHAT HELPS & WHAT HURTS

Format your response as JSON:
{
  "emotionalPatterns": {
    "currentState": "",
    "stressTriggers": [],
    "stressResponse": ""
  },
  "whatHelps": [],
  "summary": ""
}`;

  const analysisMessages = [
    { role: 'system', content: 'You are a helpful assistant that creates structured psychological snapshots based on conversations.' },
    ...conversationHistory,
    { role: 'user', content: ANALYSIS_PROMPT }
  ];

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: analysisMessages,
          temperature: 0.3,
          max_tokens: 1024
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Analysis API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    console.log('✅ Groq Analysis Response:\n');
    console.log(analysisText);
    console.log('\n✅ Analysis test passed! Groq can generate structured snapshots from conversation history.');
    return true;
  } catch (error) {
    console.error('❌ Analysis test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 GROQ LOCAL ENVIRONMENT TEST');
  console.log('='.repeat(60));

  const chatTest = await testGroqChat();
  const analysisTest = await testGroqAnalysis();

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS:');
  console.log('='.repeat(60));
  console.log(`Chat with Context: ${chatTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Analysis Generation: ${analysisTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));

  if (chatTest && analysisTest) {
    console.log('\n🎉 All tests passed! Your local environment is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Start backend: cd backend && node server.js');
    console.log('2. Start frontend: npm run dev');
    console.log('3. Open: http://localhost:5173/#/snapshot');
  } else {
    console.log('\n⚠️  Some tests failed. Check your GROQ_API_KEY configuration.');
  }
}

runAllTests();
