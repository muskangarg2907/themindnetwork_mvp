# Firebase Phone Authentication Setup Guide

## Steps to Enable Real OTP with Firebase (FREE)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "TheMindNetwork")
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

### 2. Enable Phone Authentication
1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Phone** provider
5. Click "Save"

### 3. Add Web App to Firebase Project
1. In Project Overview, click the **Web icon** (</>)
2. Register app nickname: "TheMindNetwork Web"
3. Copy the Firebase config object
4. Click "Continue to console"

### 4. Configure Your App

#### A. Create `.env` file in project root:
```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

Replace with values from Firebase config you copied in step 3.

#### B. Add `.env` to `.gitignore` (if not already there)
```
.env
.env.local
```

### 5. Configure Authorized Domains
1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Add your domains:
   - `localhost` (for development)
   - Your Vercel domain (e.g., `themindnetworkmvp1.vercel.app`)

### 6. Test Phone Number (for Development)
1. In Firebase Console → **Authentication** → **Sign-in method**
2. Scroll down to **Phone numbers for testing**
3. Add test numbers (optional):
   - Phone: `+919876543210`
   - Code: `123456`
4. This allows testing without sending real SMS

### 7. Deploy to Vercel
1. Add environment variables in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all `VITE_FIREBASE_*` variables
2. Redeploy the project

## Firebase Free Tier Limits
- **Phone Auth**: 10,000 verifications/month (FREE)
- **Authentication**: Unlimited users (FREE)
- **SMS**: First 10K verifications FREE, then pay-as-you-go

## Quota Increase (if needed)
For production with high volume:
1. Upgrade to Firebase Blaze plan (pay-as-you-go)
2. Phone auth beyond 10K/month: ~$0.01 per verification

## Testing Flow
1. Enter phone number: `+91 9876543210`
2. Click "Get OTP"
3. Check your phone for SMS (or use test number from step 6)
4. Enter 6-digit OTP
5. Click "Verify & Login"

## Troubleshooting
- **"reCAPTCHA not loaded"**: Make sure your domain is in authorized domains
- **"Quota exceeded"**: Check Firebase Console → Authentication → Usage
- **"Invalid phone number"**: Ensure format is correct (e.g., `+919876543210`)

## Cost Optimization Tips
1. Use test phone numbers during development
2. Implement rate limiting on frontend
3. Monitor usage in Firebase Console
4. Consider adding a cooldown period between OTP requests

---

**Note**: Firebase Phone Auth is completely FREE for up to 10,000 verifications/month, which is perfect for MVP and early-stage apps!
