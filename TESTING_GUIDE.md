# 🚀 Quick Start Guide - Testing Psychological Snapshot

## ✅ Status: Ready for Testing

### Current Setup
- ✅ Backend running on port 4000
- ✅ Groq API configured and tested
- ✅ System prompts integrated
- ✅ Conversation context working
- ✅ Analysis generation includes full history

### Start Testing Now

#### Step 1: Start Frontend
```bash
npm run dev
```

#### Step 2: Open in Browser
```
http://localhost:5173/#/snapshot
```

#### Step 3: Test the Flow

**What You'll See:**
1. **Initial Greeting:**
   > "This space is for reflection, not evaluation. You can go slowly, skip questions, or stop at any time. Nothing here needs to be finished today. How are you feeling right now?"

2. **Conversation:**
   - Type your responses
   - AI will ask follow-up questions
   - AI remembers what you said earlier (context preserved)
   - Tone should be warm, not clinical

3. **After 10-15 Exchanges:**
   - AI will say "SNAPSHOT_COMPLETE"
   - Green banner appears with shareable link
   - Click "View" to see your 6-section snapshot

**Example Test Conversation:**
```
You: "I feel overwhelmed all the time"
AI: [Should respond warmly, ask where you notice it]

You: "In my chest, like pressure"
AI: [Should acknowledge, ask what helps]

You: "Going for walks helps"
AI: [Should build on this, explore more]

... continue for 10-15 exchanges ...

AI: "Thank you for sharing. I have enough to create your psychological snapshot. SNAPSHOT_COMPLETE"
```

### What to Verify

#### ✅ System Prompt Working
- [ ] AI tone is warm and non-clinical
- [ ] No diagnostic terms (avoid "disorder", "condition")
- [ ] Uses tentative language ("tends to", "may notice", "often")
- [ ] Questions are open-ended
- [ ] User can skip/pause anytime

#### ✅ Context Memory Working
- [ ] AI references earlier messages
- [ ] Builds on previous responses
- [ ] Doesn't repeat questions
- [ ] Shows understanding of your story

#### ✅ Analysis Generation Working
- [ ] Snapshot URL generated after completion
- [ ] Can access snapshot at `/snapshot/{id}`
- [ ] Shows 6 sections:
  - Emotional Patterns
  - Relationship Patterns
  - What Helps
  - What Hurts
  - Personality Tendencies
  - Meaningful Experiences
- [ ] Content reflects actual conversation
- [ ] Summary is personalized, not generic

### Backend Verification

**Check backend terminal for:**
```
Server listening on 4000
```

**During conversation, you should see:**
- POST /api/snapshot/chat requests
- No Groq API errors
- When complete: snapshot analysis generation

### Troubleshooting

**Problem:** Frontend won't start
```bash
# Kill any process on port 5173
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
npm run dev
```

**Problem:** Backend not responding
```bash
# Restart backend
cd backend
node server.js
```

**Problem:** AI not responding
- Check backend terminal for errors
- Verify GROQ_API_KEY in backend/.env
- Check browser console (F12) for fetch errors

**Problem:** Lost conversation context
- This should NOT happen (fixed)
- If it does, check browser console for errors
- Verify conversationHistory in request payload

### Test Scenarios

#### Scenario 1: Basic Flow
1. Start with how you're feeling
2. Answer 10-15 questions honestly
3. Verify snapshot generates
4. Check snapshot content matches conversation

#### Scenario 2: Context Memory
1. Mention something specific (e.g., "I love painting")
2. Continue conversation for 5+ exchanges
3. See if AI references painting later
4. Expected: AI should remember and build on it

#### Scenario 3: Tone Verification
1. Share something vulnerable
2. Check AI response tone
3. Expected: Warm, validating, not clinical
4. Expected: No "you are X" statements

#### Scenario 4: Skip Questions
1. Say "I'd rather not answer that"
2. Expected: AI should accept and move on gracefully
3. No pressure to answer

### Success Criteria

✅ **Ready for Production When:**
- All 4 test scenarios pass
- Snapshot content is personalized
- No errors in backend terminal
- Context maintained throughout conversation
- Tone matches system prompt requirements

### Next Steps After Testing

1. **If all works:** Commit to git, deploy to production
2. **If issues found:** Document them and we'll fix
3. **Database setup:** Replace in-memory Map with Firestore
4. **Production config:** Add GROQ_API_KEY to production env

---

## 📞 Support

If you encounter issues:
1. Check [GROQ_VERIFICATION.md](./GROQ_VERIFICATION.md) for detailed verification
2. Run test script: `node test-groq-local.js`
3. Check backend logs for specific errors

**Current Status:** All backend tests passing ✅
**Your Action:** Start frontend and begin testing 🚀
