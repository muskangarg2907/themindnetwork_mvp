import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize App Check ONLY in production (not localhost) and ONLY if reCAPTCHA v3 key is configured
if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
  
  if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_V3_SITE_KEY') {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('[Firebase] App Check initialized for production with reCAPTCHA v3');
    } catch (error) {
      console.error('[Firebase] App Check initialization failed:', error);
      console.warn('[Firebase] Continuing without App Check - OTP should still work');
    }
  } else {
    console.warn('[Firebase] App Check DISABLED in production - VITE_RECAPTCHA_V3_SITE_KEY not configured');
    console.warn('[Firebase] OTP will work but without additional security from App Check');
  }
} else {
  console.log('[Firebase] App Check DISABLED for local development - use test numbers or real numbers will fail');
  console.log('[Firebase] Test numbers: 1111111111 (OTP: 123456), 2222222222 (OTP: 654321)');
}

export default app;
