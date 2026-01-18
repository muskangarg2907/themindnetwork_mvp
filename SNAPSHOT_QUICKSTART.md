# Quick Start Guide - Psychological Snapshot Feature

## What's New? 🎉
A new feature at `/snapshot` that creates shareable psychological profiles through AI conversation.

## Branch Info
- **Branch**: `feature/psychological-snapshot`
- **Based on**: main
- **Status**: Ready for testing

## What Was Built

### 1. Components Created
✅ **PsychSnapshot.tsx** - Main interview interface
   - Phone OTP authentication
   - AI chat interface
   - Real-time conversation
   - Snapshot generation

✅ **SnapshotView.tsx** - Public snapshot viewer
   - Display psychological profile
   - Share functionality
   - Responsive design

### 2. API Endpoints
✅ **POST /api/snapshot/chat** - Process chat messages
✅ **GET /api/snapshot/:id** - Retrieve snapshots

### 3. Documentation
✅ System prompt for AI (`prompts/snapshot-system-prompt.md`)
✅ Feature context (`prompts/snapshot-context.md`)
✅ Complete feature guide (`SNAPSHOT_FEATURE.md`)

### 4. Routing
✅ `/snapshot` - Create new snapshot
✅ `/snapshot/:id` - View shared snapshot

## How to Test

### 1. Start Development Server
```bash
npm run dev
```

### 2. Access the Feature
Navigate to: `http://localhost:5173/#/snapshot`

### 3. Complete Flow
1. **Login**: Enter phone number → Receive OTP → Verify
2. **Chat**: Answer AI questions (8-12 exchanges)
3. **Generate**: Snapshot created with unique URL
4. **Share**: Copy link and open in new tab/browser
5. **View**: See complete psychological profile

### Test Authentication
Use Firebase test numbers if configured:
- Phone: `1111111111`, OTP: `123456`
- Phone: `2222222222`, OTP: `654321`

Or use your real number (requires Firebase production setup)

## What to Look For

### ✅ Success Criteria
- [ ] Phone auth works smoothly
- [ ] Chat messages send/receive without delay
- [ ] AI responses are empathetic and appropriate
- [ ] Snapshot generates after ~10 exchanges
- [ ] Unique URL is created and accessible
- [ ] Snapshot displays correctly
- [ ] Share buttons work
- [ ] Mobile responsive

### ⚠️ Known Limitations
- **Storage**: Currently in-memory (data lost on server restart)
- **Production**: Needs database implementation before deployment
- **Privacy**: Snapshots are public (by design)

## Next Steps

### Before Merging
1. **Test thoroughly** on multiple devices
2. **Implement persistent storage** (Firebase Firestore)
3. **Add error tracking** (Sentry or similar)
4. **Load testing** with multiple concurrent users
5. **Security review** of API endpoints

### To Deploy
```bash
# Commit changes
git add .
git commit -m "feat: Add psychological snapshot feature"

# Push to remote
git push origin feature/psychological-snapshot

# Create PR for review
# After approval, merge to main
# Deploy to Vercel
```

## Environment Check

Required environment variables (should already exist):
```bash
VITE_GEMINI_API_KEY=your_key
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
```

## Files Modified/Created

### New Files
```
components/PsychSnapshot.tsx
components/SnapshotView.tsx
api/snapshot.ts
prompts/snapshot-system-prompt.md
prompts/snapshot-context.md
SNAPSHOT_FEATURE.md
SNAPSHOT_QUICKSTART.md (this file)
```

### Modified Files
```
App.tsx (added routes)
```

## Troubleshooting

### "API key not configured"
→ Check `.env` file has `VITE_GEMINI_API_KEY`

### "OTP not sending"
→ Check Firebase console, ensure phone auth is enabled

### "Snapshot not found"
→ Server restarted (in-memory storage). Implement database for persistence.

### Chat not responding
→ Check browser console for errors, verify API endpoint is reachable

## Questions?

Refer to:
- `SNAPSHOT_FEATURE.md` - Complete feature documentation
- `prompts/snapshot-context.md` - Technical specifications
- `prompts/snapshot-system-prompt.md` - AI behavior guide
- `FIREBASE_TROUBLESHOOTING.md` - Auth issues

## Demo Flow

**Step 1**: User visits `/#/snapshot`
```
Landing page → Beautiful UI with brain icon
```

**Step 2**: Authentication
```
Enter phone → Send OTP → Verify → Authenticated
```

**Step 3**: AI Interview
```
AI: "Hello! How are you feeling today?"
User: "I've been anxious lately..."
AI: "Can you tell me more about that?"
[8-12 exchanges total]
```

**Step 4**: Completion
```
✅ "Your snapshot is ready!"
🔗 Copy Link | 👁️ View
```

**Step 5**: Share & View
```
Share URL → Anyone can view
Beautiful display with:
- Summary narrative
- Mental health history
- Personality traits
- Coping mechanisms
```

---

**Ready to test!** 🚀

Start with: `npm run dev` → Navigate to `/#/snapshot`
