# Firebase OTP Authentication - Troubleshooting Guide

## Common Issue: "Invalid OTP" Error on Production

If you're getting "Invalid OTP. Please check and try again." even with the correct OTP on production, it's likely due to one of these issues:

### 1. **Missing Firebase Environment Variables**

Make sure these are set in **Vercel Environment Variables**:

```
VITE_FIREBASE_API_KEY = [Your Firebase API Key]
VITE_FIREBASE_AUTH_DOMAIN = [Your Project ID].firebaseapp.com
VITE_FIREBASE_PROJECT_ID = [Your Project ID]
VITE_FIREBASE_STORAGE_BUCKET = [Your Project ID].appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = [Your Sender ID]
VITE_FIREBASE_APP_ID = [Your App ID]
```

Get these from: **Firebase Console → Project Settings → General → Your apps → Web app**

### 2. **App Check Configuration (Optional but Recommended)**

App Check provides additional security but requires setup:

#### Option A: Enable App Check (Recommended for Production)
1. Go to Firebase Console → Build → App Check
2. Register your app for reCAPTCHA v3
3. Get your reCAPTCHA v3 Site Key
4. Add to Vercel environment variables:
   ```
   VITE_RECAPTCHA_V3_SITE_KEY = [Your reCAPTCHA v3 Site Key]
   ```

#### Option B: Skip App Check (Works but Less Secure)
- Don't set `VITE_RECAPTCHA_V3_SITE_KEY` in Vercel
- The app will automatically skip App Check initialization
- OTP will work without additional security layer

### 3. **Firebase Console - Authentication Setup**

Make sure Phone Authentication is enabled:

1. Go to **Firebase Console → Build → Authentication → Sign-in method**
2. Enable **Phone** provider
3. Under **Phone numbers for testing** (optional for dev):
   - Add: `+91 1111111111` → OTP: `123456`
   - Add: `+91 2222222222` → OTP: `654321`

### 4. **Authorized Domains**

Add your production domain to Firebase authorized domains:

1. Go to **Firebase Console → Build → Authentication → Settings**
2. Under **Authorized domains**, add:
   - Your Vercel production URL (e.g., `your-app.vercel.app`)
   - Any custom domains

### 5. **Debugging on Production**

Open browser console (F12) and look for these logs:

**Good Signs:**
```
[Firebase] App Check initialized for production with reCAPTCHA v3
[LOGIN] OTP verified successfully
```

**Problem Indicators:**
```
[LOGIN] Error code: auth/invalid-verification-code
[LOGIN] Error code: auth/missing-app-credential
[LOGIN] Error code: auth/app-not-authorized
```

**Error Code Meanings:**
- `auth/invalid-verification-code` - Wrong OTP entered
- `auth/code-expired` - OTP expired (10 minutes timeout)
- `auth/too-many-requests` - Too many failed attempts
- `auth/missing-app-credential` - Firebase config missing or App Check issue
- `auth/app-not-authorized` - Domain not authorized in Firebase

### 6. **Quick Fix Steps**

If OTP is failing:

1. **Check browser console** for Firebase errors
2. **Verify environment variables** in Vercel Dashboard
3. **Redeploy** after adding/updating environment variables
4. **Clear browser cache** and try again
5. **Check authorized domains** in Firebase Console
6. **Try without App Check** first (don't set VITE_RECAPTCHA_V3_SITE_KEY)

### 7. **Local Development**

App Check is automatically disabled in development (`localhost`). You can use:
- Real phone numbers (will receive actual OTP via SMS)
- Test phone numbers (if configured in Firebase)

### 8. **Production Checklist**

Before deploying:

- [ ] All Firebase environment variables set in Vercel
- [ ] Phone authentication enabled in Firebase Console
- [ ] Production domain added to Firebase authorized domains
- [ ] App Check configured (optional but recommended)
- [ ] Tested OTP flow on production URL

---

## Current Configuration

As of the latest update:

✅ **Improved Error Logging**: Detailed error messages in console  
✅ **Graceful App Check Fallback**: Works without App Check if not configured  
✅ **Better Error Messages**: Shows specific error to users  

The app will now:
- Work without App Check if `VITE_RECAPTCHA_V3_SITE_KEY` is not set
- Show detailed error logs in console for debugging
- Display helpful error messages based on Firebase error codes

---

## Still Having Issues?

1. Check the browser console for detailed error logs
2. Verify Firebase project settings match your environment variables
3. Ensure your domain is in the authorized domains list
4. Try with a different phone number
5. Check Firebase Console → Authentication → Users to see if authentication is working

## Contact

For persistent issues, check:
- Firebase Console → Usage → Authentication logs
- Vercel Deployment logs
- Browser DevTools → Console tab
