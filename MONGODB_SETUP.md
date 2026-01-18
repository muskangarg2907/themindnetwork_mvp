# MongoDB Setup Guide

## Quick Setup (5 minutes)

### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email (it's free)
3. Choose the **FREE** M0 tier

### 2. Create a Cluster
1. Click **"Build a Database"**
2. Choose **"Shared" (FREE)**
3. Select a cloud provider (AWS recommended) and region closest to you
4. Click **"Create Cluster"** (takes 1-3 minutes)

### 3. Set Up Database Access
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Username: `themindnetwork`
4. Password: Click **"Autogenerate Secure Password"** and **SAVE IT**
5. Database User Privileges: Select **"Read and write to any database"**
6. Click **"Add User"**

### 4. Set Up Network Access
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (shows 0.0.0.0/0)
   - ⚠️ For production, restrict to your server IP only
4. Click **"Confirm"**

### 5. Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://themindnetwork:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password from step 3

### 6. Add to .env File
1. Open `backend/.env`
2. Find the line `MONGODB_URI=`
3. Paste your connection string:
   ```
   MONGODB_URI=mongodb+srv://themindnetwork:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/themindnetwork?retryWrites=true&w=majority
   ```
   
   ⚠️ Make sure to:
   - Replace `<password>` with your actual password
   - Add `/themindnetwork` before the `?` (this sets the database name)

### 7. Restart Backend Server
```powershell
# Stop the backend (Ctrl+C in terminal)
# Then restart:
cd backend
node server.js
```

You should see:
```
✅ Connected to MongoDB
Server listening on 4000
```

## Testing

1. Create a new snapshot at http://localhost:5173/#/snapshot
2. Complete the conversation
3. Copy the snapshot URL
4. Open in a **different browser** (Chrome, Edge, Firefox)
5. The snapshot should load! 🎉

## What This Fixes

✅ **Before:** Snapshots only worked in the same browser (localStorage only)  
✅ **After:** Snapshots work anywhere, even after backend restart  
✅ **Sharing:** Anyone with the link can view the snapshot  
✅ **Persistence:** Data survives server restarts  

## MongoDB Collection Structure

Collection: `snapshots`

Document example:
```json
{
  "_id": "ObjectId(...)",
  "snapshotId": "abc123xyz789",
  "userId": "anonymous-1234567890",
  "phoneNumber": "anonymous",
  "snapshot": {
    "emotionalPatterns": { ... },
    "relationshipPatterns": { ... },
    "personalityTendencies": { ... }
  },
  "messages": [ ... ],
  "createdAt": ISODate("2026-01-16T...")
}
```

## Free Tier Limits

- Storage: **512 MB** (enough for ~10,000 snapshots)
- Connections: **500** concurrent
- No credit card required

## Troubleshooting

**Connection Error:**
- Check your password is correct (no spaces)
- Verify IP whitelist includes 0.0.0.0/0
- Wait 1-2 minutes after creating user

**Still not working:**
- Check backend logs for "Connected to MongoDB"
- Test connection string format
- Ensure database name is in the URL: `/themindnetwork?`

## Security Note

For production deployment:
1. Restrict Network Access to your server IP only
2. Use environment variables (never commit .env to git)
3. Enable MongoDB Atlas alerts for unusual activity
4. Rotate passwords regularly
