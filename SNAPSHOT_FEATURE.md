# Psychological Snapshot Feature

## Overview
The Psychological Snapshot feature allows users to create a shareable psychological profile through an AI-guided conversational interview.

## Access
- **Main URL**: `themindnetwork.in/snapshot` (or `/#/snapshot` in development)
- **Shared Snapshot**: `themindnetwork.in/snapshot/{snapshotId}`

## How It Works

### 1. User Authentication
- User lands on `/snapshot`
- Prompted to login with phone number + OTP
- Uses existing Firebase Authentication system
- No additional personal information required

### 2. AI Interview
- Conversational AI conducts psychological assessment
- 8-12 questions covering:
  - Current mental state
  - Mental health history
  - Personality traits
  - Coping mechanisms
  - Support systems
- Warm, empathetic, and non-judgmental approach
- Takes approximately 10-15 minutes

### 3. Snapshot Generation
- AI analyzes conversation
- Extracts structured information:
  - **Mental History**: Conditions, treatments, timeline
  - **Personality**: Traits, strengths, challenges, coping mechanisms
  - **Summary**: 2-3 paragraph compassionate narrative
- Generates unique 12-character URL

### 4. Sharing
- User receives shareable URL
- Anyone with URL can view the snapshot
- Share via:
  - Direct link copy
  - WhatsApp
  - Twitter
  - Other platforms

## Technical Architecture

### Frontend Components
- **PsychSnapshot.tsx**: Main interview interface with auth
- **SnapshotView.tsx**: Public snapshot display page

### API Endpoints
- **POST /api/snapshot/chat**: Process conversation messages
- **GET /api/snapshot/:id**: Retrieve snapshot by ID

### AI Configuration
- **Model**: Gemini 1.5 Flash
- **System Prompt**: See `prompts/snapshot-system-prompt.md`
- **Context**: See `prompts/snapshot-context.md`

### Data Flow
```
User → Phone Auth → AI Chat → Analysis → Storage → Unique URL → Shareable Profile
```

## File Structure
```
components/
  PsychSnapshot.tsx      # Main chat interface with auth
  SnapshotView.tsx       # Public snapshot viewer

api/
  snapshot.ts            # API endpoints for chat & retrieval

prompts/
  snapshot-system-prompt.md   # AI system instructions
  snapshot-context.md         # Feature documentation & guidelines
```

## Setup & Configuration

### 1. Environment Variables
Required (should already be set):
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 2. Install Dependencies
No new dependencies required - uses existing stack:
- React Router DOM
- Firebase Auth
- Gemini API
- TailwindCSS
- Font Awesome

### 3. Deploy
The feature works with existing deployment setup:
```bash
# Development
npm run dev

# Production
npm run build
```

## Usage Examples

### Creating a Snapshot
1. Visit `/#/snapshot`
2. Login with phone number
3. Enter OTP
4. Answer AI questions naturally
5. Receive unique snapshot URL
6. Share with anyone

### Viewing a Snapshot
1. Open shared URL: `/#/snapshot/{id}`
2. View complete psychological profile
3. See mental history, personality traits, and summary
4. Option to create own snapshot

## Privacy & Security

### What We Collect
- ✓ Phone number (authentication only)
- ✓ Conversation messages
- ✓ Extracted psychological insights

### What We DON'T Collect
- ✗ Name or email address
- ✗ Location data
- ✗ Payment information
- ✗ Third-party tracking

### Data Storage
- **Development**: In-memory (temporary)
- **Production**: Requires database implementation (Firebase Firestore recommended)
- **Retention**: Implement 90-day policy (recommended)

### Access Control
- Snapshots are PUBLIC by design
- Anyone with URL can view
- No authentication required to view
- No edit/delete after creation

⚠️ **Important**: Users should be informed that snapshots are public before sharing sensitive information.

## API Documentation

### POST /api/snapshot/chat

**Request:**
```json
{
  "userId": "firebase-uid",
  "phoneNumber": "+911234567890",
  "message": "I've been feeling anxious lately",
  "conversationHistory": [
    {
      "id": "1",
      "role": "assistant",
      "text": "Hello! How are you feeling?",
      "timestamp": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "response": "I'm sorry to hear that. Can you tell me more about what's been causing your anxiety?",
  "isComplete": false,
  "snapshotUrl": ""
}
```

**When Complete:**
```json
{
  "response": "Thank you for sharing...",
  "isComplete": true,
  "snapshotUrl": "abc123xyz789"
}
```

### GET /api/snapshot/:snapshotId

**Response:**
```json
{
  "userId": "firebase-uid",
  "phoneNumber": "+91...",
  "snapshot": {
    "mentalHistory": {
      "conditions": ["anxiety", "stress"],
      "treatments": ["therapy", "meditation"],
      "duration": "6 months"
    },
    "personality": {
      "traits": ["empathetic", "perfectionist"],
      "strengths": ["resilient", "creative"],
      "challenges": ["overthinking", "self-doubt"],
      "coping": ["journaling", "exercise"]
    },
    "summary": "A compassionate narrative about the person..."
  },
  "createdAt": 1234567890
}
```

## Customization

### Modifying Interview Questions
Edit `prompts/snapshot-system-prompt.md`:
- Change question flow
- Add new assessment areas
- Adjust tone and style

### Changing UI Colors
Update TailwindCSS classes in components:
- Purple: Primary brand color
- Teal: Secondary wellness color
- Green: Success/completion states

### Adjusting Interview Length
In `api/snapshot.ts`, modify the system prompt:
- Default: 8-12 exchanges
- Shorter: 5-7 exchanges
- Longer: 12-15 exchanges

## Testing

### Manual Testing Checklist
- [ ] Phone authentication works
- [ ] OTP verification succeeds
- [ ] Chat messages send/receive
- [ ] AI responses are appropriate
- [ ] Snapshot generates after completion
- [ ] Unique URL is created
- [ ] Snapshot view loads correctly
- [ ] Share buttons work
- [ ] Mobile responsive design
- [ ] Error handling works

### Test Phone Numbers (Development)
If using Firebase test numbers:
- Phone: `1111111111`, OTP: `123456`
- Phone: `2222222222`, OTP: `654321`

## Troubleshooting

### Chat Not Responding
- Check Gemini API key in `.env`
- Verify API endpoint is accessible
- Check browser console for errors

### OTP Not Sending
- Verify Firebase configuration
- Check phone number format
- See existing `FIREBASE_TROUBLESHOOTING.md`

### Snapshot Not Found
- Verify storage is working (in development, data is in-memory)
- Check snapshot ID in URL
- Implement persistent storage for production

### UI Issues
- Clear browser cache
- Check TailwindCSS is building
- Verify Font Awesome icons are loaded

## Future Improvements

### Short Term
- [ ] Add loading skeleton for snapshot view
- [ ] Implement conversation save/resume
- [ ] Add more share options (LinkedIn, Email)
- [ ] Better error messages

### Medium Term
- [ ] Persistent database storage (Firestore)
- [ ] User dashboard to view their snapshots
- [ ] Edit/delete functionality
- [ ] Privacy settings (public/private)
- [ ] PDF export of snapshot

### Long Term
- [ ] Multi-language support
- [ ] Integration with therapist matching
- [ ] Snapshot evolution tracking
- [ ] Personalized recommendations
- [ ] Community features

## Contributing

When modifying this feature:
1. Test full user flow end-to-end
2. Maintain empathetic, supportive tone
3. Follow existing code style
4. Update documentation
5. Test on mobile devices

## Support

For issues or questions:
- Check `prompts/snapshot-context.md` for detailed specifications
- Review `FIREBASE_TROUBLESHOOTING.md` for auth issues
- Contact development team

## License

Part of TheMindNetwork MVP - All rights reserved.
