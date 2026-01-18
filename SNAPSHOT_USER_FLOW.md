# Snapshot User Flow & Storage Strategy

## Current User Experience (Development)

### Creating a Snapshot
1. User visits `/snapshot` page (**NO login required**)
2. User chats with AI (11 simulated messages in test mode)
3. On completion, snapshot data is:
   - Saved to **browser localStorage** (primary storage)
   - Sent to **backend in-memory Map** (temporary, lost on restart)
4. User sees "View Snapshot" button with Copy Link and Share options

### Viewing a Snapshot
1. User clicks "View Snapshot" → opens `/snapshot/{id}` in new tab
2. **NO authentication required** - snapshots are publicly viewable
3. **Snapshot loading priority:**
   - ✅ **localStorage first** (exact URL match)
   - ⚠️ Backend API (if localStorage doesn't match)
   - ⚠️ localStorage fallback (any available snapshot)
4. User sees full psychological profile
5. Anyone with the link can view the snapshot (no login needed)

### Sharing a Snapshot
1. User completes snapshot creation
2. **Share features are immediately available** (no login required in current version)
3. User can:
   - Copy link to clipboard
   - Share on WhatsApp
   - Share on Twitter
4. Shared links are publicly accessible

### Current Limitations
- ❌ Snapshots only available in the **same browser** where created
- ❌ Backend restart **loses all snapshots** from memory
- ❌ Sharing snapshot URL with others **won't work** unless they have localStorage data
- ❌ Different devices **can't access** the same snapshot

## Production Migration Plan

### Database Setup Required

**Option 1: Firebase Firestore (Recommended)**
```javascript
// Collection: snapshots
{
  snapshotId: "abc123...",
  userId: "+919876543210",
  snapshot: { /* full snapshot data */ },
  createdAt: timestamp,
  expiresAt: timestamp // optional: auto-delete after 30 days
}
```

**Option 2: MongoDB**
```javascript
// Collection: snapshots
{
  _id: ObjectId,
  snapshotId: "abc123...",
  phoneNumber: "+919876543210",
  snapshot: { /* full snapshot data */ },
  createdAt: Date,
  accessedAt: Date // track last access
}
```

### Code Changes Needed

#### 1. Backend: Replace In-Memory Map
**File:** `backend/server.js`

**Current (lines 560-640):**
```javascript
const snapshots = new Map(); // ❌ In-memory storage
snapshots.set(snapshotUrl, snapshotData);
```

**Production:**
```javascript
// Firebase
await db.collection('snapshots').doc(snapshotUrl).set(snapshotData);

// Or MongoDB
await Snapshot.create({ snapshotId: snapshotUrl, ...snapshotData });
```

#### 2. GET Endpoint: Fetch from Database
**File:** `backend/server.js` (lines 973-990)

**Current:**
```javascript
const snapshot = snapshots.get(snapshotId); // ❌ In-memory
```

**Production:**
```javascript
// Firebase
const doc = await db.collection('snapshots').doc(snapshotId).get();
const snapshot = doc.data();

// Or MongoDB
const snapshot = await Snapshot.findOne({ snapshotId });
```

#### 3. Frontend: Remove localStorage Dependency
**File:** `components/SnapshotView.tsx` (lines 273-310)

**Current:** localStorage is primary source
**Production:** Always fetch from backend API (database-backed)

#### 4. Add User Dashboard
**New Feature:** Show all user's snapshots

```javascript
// New endpoint: GET /api/snapshots/user/:phoneNumber
app.get('/api/snapshots/user/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  
  // Verify user owns this phone number (check auth token)
  
  const snapshots = await db.collection('snapshots')
    .where('phoneNumber', '==', phoneNumber)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
    
  res.json({ snapshots: snapshots.docs.map(d => d.data()) });
});
```

### Environment Variables to Add

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@project.iam
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Or MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindnetwork
```

## Testing the Current System

### ✅ What Works Now
1. Create snapshot → View in same browser ✓
2. Logout → Login → View snapshot ✓
3. Refresh page → Snapshot persists ✓
4. Close browser → Reopen → Snapshot available ✓

### ❌ What Doesn't Work
1. Share URL with others → They see "Snapshot not available"
2. Backend restart → Shared snapshots lost (but localStorage works)
3. Different browser/device → No access to snapshot
4. Incognito/Private mode → Snapshot lost after closing

## Quick Start Guide

### For Development Testing
1. Go to `http://localhost:5174/#/snapshot`
2. Send 10-11 messages to complete snapshot
3. Click "View Snapshot" → Authenticate → See results
4. Test logout/login → Snapshot should still appear
5. **Important:** Don't clear browser data or snapshots are lost

### For Production Deployment
1. Set up Firebase Firestore or MongoDB
2. Update `backend/server.js` to use database
3. Remove localStorage as primary storage
4. Add user authentication token verification
5. Implement snapshot expiration (auto-delete after 30 days)
6. Add rate limiting for API endpoints
7. Enable CORS for production domain

## Security Considerations

### Current Setup (Development)
- ⚠️ No token verification
- ⚠️ Anyone can view any snapshot URL (if they have it)
- ⚠️ Phone OTP is only barrier

### Production Requirements
- ✅ JWT or session tokens after phone auth
- ✅ Verify user owns phone number before showing snapshots
- ✅ Rate limit snapshot creation (max 3 per day per phone)
- ✅ Encrypt sensitive snapshot data in database
- ✅ Add snapshot visibility options (private/shareable)
- ✅ Implement snapshot expiration

## Migration Checklist

- [ ] Choose database (Firebase or MongoDB)
- [ ] Set up database credentials
- [ ] Create snapshot collection/table schema
- [ ] Update backend endpoints to use database
- [ ] Test snapshot creation and retrieval
- [ ] Remove localStorage as primary storage
- [ ] Add user authentication tokens
- [ ] Implement snapshot listing for users
- [ ] Add snapshot privacy controls
- [ ] Set up automatic expiration
- [ ] Test sharing functionality
- [ ] Deploy and monitor

## Support & Documentation

For questions about:
- **Firebase setup:** See `FIREBASE_SETUP.md`
- **MongoDB setup:** Create similar guide or use official docs
- **Authentication:** See `FIREBASE_OTP_DEBUG.md`
- **Deployment:** See `DEPLOYMENT.md`
