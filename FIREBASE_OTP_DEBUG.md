# Firebase OTP Authentication - Setup & Debugging Guide

## Current Status: ❌ OTP NOT WORKING

### Root Causes Identified:

1. **Missing Firebase Configuration** ❌
   - `.env` file was not present (now created as template)
   - Firebase credentials need to be added
   
2. **Firebase Phone Auth Not Enabled** ⚠️
   - Need to verify in Firebase Console
   
3. **Test Phone Numbers Not Configured** ⚠️
   - Required for development/testing

---

## Setup Steps (MUST DO)

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create new one)
3. Click ⚙️ Settings > Project Settings
4. Scroll to "Your apps" section
5. Click on your Web app (or create new web app)
6. Copy the configuration values

### Step 2: Update `.env` File

Replace the placeholder values in `.env` with your actual Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIza...your-actual-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

### Step 3: Enable Phone Authentication in Firebase

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** provider
3. Click **Enable** toggle
4. Click **Save**

### Step 4: Add Test Phone Numbers (For Development)

1. In Firebase Console: **Authentication** > **Sign-in method**
2. Scroll to **Phone numbers for testing**
3. Add test numbers:
   - Phone: `+911111111111`
   - Code: `123456`
   - Phone: `+912222222222`
   - Code: `654321`

### Step 5: Configure App Check (Production)

For production, you'll need to set up App Check:
1. Go to **App Check** in Firebase Console
2. Register your app
3. Enable reCAPTCHA Enterprise

---

## Testing Checklist

### ✅ Pre-Flight Checks

- [ ] `.env` file exists with real Firebase credentials
- [ ] Firebase project created
- [ ] Phone authentication enabled in Firebase Console
- [ ] Test phone numbers added (for dev testing)
- [ ] Domain authorized in Firebase Console (localhost for dev)

### ✅ Browser Console Checks

When you click "Get OTP", check browser console for:

**Expected Logs:**
```
[LOGIN] OTP sent successfully to +919876543210
```

**Common Errors:**

1. **"Firebase: Error (auth/invalid-app-credential)"**
   - ❌ Invalid Firebase API key
   - **Fix:** Update `VITE_FIREBASE_API_KEY` in `.env`

2. **"Firebase: Error (auth/operation-not-allowed)"**
   - ❌ Phone auth not enabled
   - **Fix:** Enable Phone sign-in in Firebase Console

3. **"Firebase: Error (auth/quota-exceeded)"**
   - ❌ SMS quota exceeded
   - **Fix:** Use test phone numbers or upgrade Firebase plan

4. **"Firebase: reCAPTCHA has already been rendered"**
   - ❌ reCAPTCHA initialization issue
   - **Fix:** Refresh page

5. **"Firebase: TOO_SHORT or INVALID_PHONE_NUMBER"**
   - ❌ Phone number format issue
   - **Fix:** Ensure format is `+919876543210` (no spaces in Firebase call)

---

## Debugging Commands

### Check if environment variables are loaded:
```powershell
npm run dev
# Then in browser console:
console.log(import.meta.env.VITE_FIREBASE_API_KEY);
```

### Monitor Network Requests:
1. Open DevTools > Network tab
2. Filter: `identitytoolkit` (Firebase Auth API)
3. Click "Get OTP"
4. Check request/response

---

## Code Review Points

### Current Implementation Status:

✅ **What's Working:**
- reCAPTCHA container exists
- Phone number validation (10 digits)
- UI flow (phone → OTP → profile lookup)
- Firebase SDK imported correctly

❌ **What's NOT Working:**
- Firebase credentials not configured
- OTP not being sent (no valid Firebase project)

---

## Quick Test (After Setup)

### Test with Development Phone:

1. Make sure `.env` has real credentials
2. Add test phones in Firebase Console:
   - `+911111111111` → OTP: `123456`
   - `+912222222222` → OTP: `654321`
3. Start dev server: `npm run dev`
4. Open app in browser
5. Enter phone: `9876543210`
6. Click "Get OTP"
7. Check console for success/error
8. If successful, enter OTP: `123456`
9. Should proceed to profile or create flow

---

## Production Deployment Notes

### For Vercel Deployment:

1. Add environment variables in Vercel dashboard:
   - Settings > Environment Variables
   - Add all `VITE_FIREBASE_*` variables
   
2. Add authorized domains in Firebase Console:
   - Authentication > Settings > Authorized domains
   - Add: `your-app.vercel.app`

3. Update reCAPTCHA (Production):
   - Consider using App Check
   - Or visible reCAPTCHA for better security

---

## Alternative: Mock OTP for Development

If you want to test WITHOUT Firebase setup temporarily:

1. Comment out Firebase signInWithPhoneNumber call
2. Use a mock confirmation:
```typescript
// Mock for development only
const mockConfirmation = {
  confirm: async (code: string) => {
    if (code === '123456') {
      return { user: { phoneNumber: fullPhone } };
    }
    throw new Error('Invalid OTP');
  }
};
setConfirmationResult(mockConfirmation as any);
```

**⚠️ Remove mock before production!**

---

## Next Steps

1. ✅ Create `.env` file (DONE - but needs real credentials)
2. 📝 Get Firebase credentials from Firebase Console
3. 📝 Update `.env` with real values
4. 📝 Enable Phone authentication
5. 📝 Add test phone numbers
6. 🧪 Test OTP flow
7. 🐛 Debug any errors using this guide

---

## Support

If OTP still doesn't work after following all steps, check:
- Browser console for specific Firebase errors
- Network tab for API calls to `identitytoolkit.googleapis.com`
- Firebase Console > Authentication > Users (to see auth attempts)
- Firebase Console > Usage tab (to check quotas)
