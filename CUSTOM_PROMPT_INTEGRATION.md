# Custom Psychological Assessment Integration

## Overview
This document summarizes the integration of custom psychological assessment methodology into the Snapshot feature.

## Changes Made

### 1. API Layer (`api/snapshot.ts`)

#### Updated System Prompt
Replaced generic AI behavior with comprehensive 5-phase conversation methodology:
- **Phase 1: Grounding** - Build trust, explain process, check emotional state
- **Phase 2: Open Reflection** - Explore current state with broad open-ended questions
- **Phase 3: Structured Markers** - Gather specific psychological markers
- **Phase 4: Integration** - Synthesize patterns and offer reflection
- **Phase 5: Completion** - Summary, user control, and snapshot finalization

#### Key Features
- **Safety Protocols**: Crisis intervention with India helplines (AASRA +91 9820466726, Kiran 1800-599-0019)
- **Non-Diagnostic Language**: Uses tentative phrasing ("tends to", "may show up", "seems like")
- **User Agency**: Emphasizes optional participation, editability, and user control
- **Structured Markers**: Big Five traits, attachment patterns, stress response, cognitive style

#### Updated Data Structure
Changed from 3 sections to 6 comprehensive sections:

**Old Structure:**
```typescript
{
  mentalHistory: { conditions, treatments, duration },
  personality: { traits, strengths, challenges, coping },
  summary: string
}
```

**New Structure:**
```typescript
{
  emotionalPatterns: {
    currentState: string,
    stressTriggers: string[],
    stressResponse: string,
    regulation: string[]
  },
  relationshipPatterns: {
    connectionStyle: string,
    uncertaintyResponse: string,
    conflictStyle: string,
    attachmentNotes: string
  },
  whatHelps: string[],
  whatHurts: string[],
  personalityTendencies: {
    bigFive: any,
    cognitiveStyle: string,
    naturalRhythm: string
  },
  meaningfulExperiences: string,
  summary: string
}
```

### 2. Frontend Components

#### `components/SnapshotView.tsx`
Updated public snapshot viewer to display new 6-section structure:
- **Emotional Patterns**: Current state, triggers, response, regulation strategies
- **Relationship Patterns**: Connection style, uncertainty response, conflict style, attachment
- **What Helps**: List of supportive factors (green checkmarks)
- **What Hurts**: List of harmful factors (red X marks)
- **Personality Tendencies**: Big Five traits grid, cognitive style, natural rhythm
- **Meaningful Experiences**: Narrative section for significant moments

#### `components/PsychSnapshot.tsx`
Updated TypeScript interface to match new data structure (no visual changes needed - chat interface remains the same).

### 3. Conversation Flow

The AI now follows a structured 5-phase approach:

1. **Grounding (1-2 turns)**
   - Introduces itself and the process
   - Checks user's emotional readiness
   - Sets collaborative tone

2. **Open Reflection (3-5 turns)**
   - Broad questions about current life state
   - Explores what brought them here
   - Recent emotional experiences

3. **Structured Markers (5-10 turns)**
   - Gathers specific psychological data:
     - Big Five personality traits
     - Attachment patterns
     - Stress triggers and responses
     - Cognitive processing style
     - Coping mechanisms
     - Social connection patterns

4. **Integration (2-3 turns)**
   - Reflects back patterns observed
   - Offers tentative connections
   - Invites user validation

5. **Completion (1-2 turns)**
   - Summarizes findings
   - Reminds user of control and editability
   - Triggers `SNAPSHOT_COMPLETE` to generate shareable URL

### 4. Safety & Ethics

#### Crisis Detection
If user shows signs of crisis (suicidal ideation, self-harm, acute distress):
- Pauses assessment immediately
- Provides India-specific helplines
- Offers to pause or continue based on user preference

#### Non-Diagnostic Approach
- Never uses clinical diagnoses
- Uses descriptive, tentative language
- Emphasizes patterns over labels
- Reminds users this is reflection, not therapy

#### User Control
- Users can skip any question
- Snapshots are editable after creation
- Users control who sees their snapshot
- Clear data privacy explanations

## Testing Checklist

- [ ] Start dev server and navigate to `/snapshot`
- [ ] Complete phone OTP authentication
- [ ] Experience all 5 conversation phases
- [ ] Verify AI uses non-diagnostic, warm language
- [ ] Check that structured markers are collected naturally
- [ ] Confirm snapshot generation with 6 sections
- [ ] View shared snapshot URL with new layout
- [ ] Test share functionality (Copy, WhatsApp, Twitter)
- [ ] Verify all 6 sections display properly:
  - [ ] Summary
  - [ ] Emotional Patterns
  - [ ] Relationship Patterns
  - [ ] What Helps
  - [ ] What Hurts
  - [ ] Personality Tendencies
  - [ ] Meaningful Experiences

## API Configuration

**Gemini API Key**: Configured in `.env` file
```
GEMINI_API_KEY=AIzaSyA2_zF3FLMe9MvwiRFu9EcYc_DWW-Equn4
```

**Model**: Google Gemini 1.5 Flash
**Temperature**: 0.7 (balanced creativity and consistency)

## Files Modified

1. `api/snapshot.ts` - Complete system prompt and data structure overhaul
2. `components/SnapshotView.tsx` - Display logic for 6 sections
3. `components/PsychSnapshot.tsx` - TypeScript interface update
4. `prompts/snapshot-context.md` - Custom context document (reference)
5. `prompts/snapshot-system-prompt.md` - System behavior guidelines (reference)

## Next Steps

1. **Test the complete flow** on localhost:5173/#/snapshot
2. **Database Integration**: Replace in-memory Map with Firebase Firestore
3. **Edit Functionality**: Add ability to edit snapshot after creation
4. **Privacy Controls**: Add options to make snapshots private/public
5. **Export Options**: Add PDF download capability
6. **Professional Integration**: Allow therapists to request snapshots from clients

## Notes

- Current storage is in-memory (dev only) - data lost on server restart
- Production deployment requires Firestore setup
- Consider adding email notifications when snapshot is shared
- May want to add analytics on conversation completion rates
