import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { sanitizeForStorage, secureLog } from '../services/security';
import { apiClient } from '../services/apiClient';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+65', country: 'SG' },
  { code: '+971', country: 'AE' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Accept role from state or query param
  const preselectedRole = (location.state as any)?.role || new URLSearchParams(window.location.search).get('role'); // 'client' or 'provider' or undefined
  // If provider role is preselected, skip any role selection and start phone login
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus OTP input when step changes to OTP
  React.useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      window.recaptchaVerifier = null;
      
      // Clear container
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Add keyboard listener for Enter key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (step === 'phone') {
          handleSendOtp();
        } else {
          handleVerifyOtp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, phoneNumber, otp]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const val = e.target.value.replace(/\D/g, '');
    // Limit to 10 digits
    if (val.length <= 10) {
        setPhoneNumber(val);
        // Clear error if user starts typing again
        if (error) setError('');
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
    }
    setError('');
    setIsLoading(true);
    
    const fullPhone = `${countryCode}${phoneNumber}`;
    console.log('[LOGIN] Attempting to send OTP');
    
    try {
      // Clear any existing verifier and container first
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          console.log('[LOGIN] Cleared existing verifier');
        } catch (e) {
          console.log('[LOGIN] Error clearing existing verifier:', e);
        }
        window.recaptchaVerifier = null;
      }
      
      const container = document.getElementById('recaptcha-container');
      if (container) {
        // Remove and recreate the container to fully reset it
        const parent = container.parentNode;
        const newContainer = document.createElement('div');
        newContainer.id = 'recaptcha-container';
        if (parent) {
          parent.removeChild(container);
          parent.appendChild(newContainer);
        }
        console.log('[LOGIN] Recreated container element');
      }
      
      // Small delay to ensure DOM cleanup
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Create fresh verifier
      console.log('[LOGIN] Creating reCAPTCHA verifier');
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('[LOGIN] reCAPTCHA solved');
        }
      });

      const appVerifier = window.recaptchaVerifier;
      console.log('[LOGIN] Calling signInWithPhoneNumber');
      
      // Add timeout wrapper
      const signInPromise = signInWithPhoneNumber(auth, fullPhone, appVerifier);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000)
      );
      
      const confirmation = await Promise.race([signInPromise, timeoutPromise]) as ConfirmationResult;
      setConfirmationResult(confirmation);
      
      setIsLoading(false);
      setStep('otp');
      console.log('[LOGIN] OTP sent successfully');
    } catch (err: any) {
      console.error('[LOGIN] Error sending OTP:', err);
      console.error('[LOGIN] Error code:', err.code);
      console.error('[LOGIN] Error message:', err.message);
      console.error('[LOGIN] Full error:', JSON.stringify(err, null, 2));
      setIsLoading(false);
      
      // Reset verifier on error - clear both verifier and container
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log('[LOGIN] Error clearing verifier:', e);
        }
      }
      window.recaptchaVerifier = null;
      
      // Clear the container HTML for next attempt
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
      
      // Friendly error messages for OTP sending
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again in a few minutes.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please check and try again.');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else if (err.code === 'auth/invalid-app-credential') {
        setError('App configuration error. Please contact support.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('Security verification failed. Please refresh and try again.');
      } else if (err.message?.includes('timed out') || err.message?.includes('Timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else {
        const errorMsg = err.code || err.message || 'Unknown error';
        setError(`Failed to send OTP: ${errorMsg}. Please refresh the page and try again.`);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
        setError('Please enter the 6-digit OTP.');
        return;
    }
    
    if (!confirmationResult) {
        setError('Please request OTP first.');
        return;
    }
    
    // Prevent double-execution (race condition guard)
    if (isLoading) {
        console.log('[LOGIN] Already processing OTP verification, ignoring duplicate call');
        return;
    }
    
    setError('');
    setIsLoading(true);

    const fullPhone = `${countryCode} ${phoneNumber}`;

    try {
      // Verify OTP with Firebase
      console.log('[LOGIN] Attempting to verify OTP...');
      const result = await confirmationResult.confirm(otp);
      console.log('[LOGIN] OTP verified successfully', result);
      

      // Set auth tokens
      // Normalize phone number - remove spaces for consistent storage and API lookups
      const normalizedPhone = fullPhone.replace(/\s+/g, '');
      localStorage.setItem('authToken', 'firebase_verified');
      localStorage.setItem('userPhone', normalizedPhone);
      console.log('[LOGIN] Phone normalized for lookup');
      
      // Check if profile exists via API client
      console.log('[LOGIN] Checking if profile exists');
      const profile = await apiClient.lookupProfileByPhone(normalizedPhone);
      
      if (profile) {
        // EXISTING USER - Profile found
        console.log('[LOGIN] EXISTING USER - Found profile');
        console.log('[LOGIN] Profile type check:', Array.isArray(profile) ? 'ARRAY (ERROR!)' : 'OBJECT (CORRECT)');
        console.log('[LOGIN] Profile role:', profile.role, '| Button flow role:', preselectedRole);
        console.log('[LOGIN] Profile has payments?', !!profile.payments, '| Payment count:', profile.payments?.length || 0);
        
        if (Array.isArray(profile)) {
          console.error('[LOGIN] ERROR: Lookup returned array instead of single profile!');
          setError('Profile lookup error. Please try again.');
          setIsLoading(false);
          return;
        }
        
        // Override button flow - if user already has a profile, use existing profile regardless of which button clicked
        secureLog('[LOGIN] User already has a profile - going to profile view');
        const sanitizedProfile = sanitizeForStorage(profile);
        localStorage.setItem('userProfile', JSON.stringify(sanitizedProfile));
        console.log('[LOGIN] Profile saved to localStorage, navigating to /profile');
        setIsLoading(false);
        // Small delay to ensure localStorage is written before navigation
        setTimeout(() => {
          navigate('/profile');
        }, 100);
        return;
      } else {
        // NEW USER - Profile not found, go to profile creation wizard
        console.log('[LOGIN] NEW USER - No profile found, going to profile creation');
        setIsLoading(false);
        navigate('/create');
        return;
      }
    } catch (err: any) {
      console.error('[LOGIN] OTP verification error:', err);
      console.error('[LOGIN] Error code:', err.code);
      console.error('[LOGIN] Error message:', err.message);
      console.error('[LOGIN] Full error:', JSON.stringify(err, null, 2));
      setIsLoading(false);
      
      // Friendly error messages based on error code
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/missing-app-credential' || err.code === 'auth/app-not-authorized') {
        setError('Firebase configuration error. Please contact support.');
        console.error('[LOGIN] Firebase App Check or configuration issue detected');
      } else {
        setError(`Verification failed: ${err.message || 'Invalid OTP. Please try again.'}`);
      }
      
      // Clear the OTP input to allow re-entry
      setOtp('');
      if (otpInputRef.current) {
        otpInputRef.current.focus();
      }
    }
  };  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-xl p-8 animate-slide-up" style={{ backgroundColor: 'var(--color-surface)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-surface)' }}>
            <i className="fas fa-brain"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>TheMindNetwork</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Welcome to India's premier mental health platform.</p>
        </div>

        <div className="space-y-6">
          {/* If provider role is preselected, skip any role selection UI and show phone/otp login only */}
          {(preselectedRole === 'provider' || preselectedRole === 'therapist') ? (
            step === 'phone' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>
                  Phone Number
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="font-medium rounded-lg px-2 py-3 focus:outline-none focus:ring-2 shadow-sm w-20 flex-shrink-0 cursor-pointer text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', borderWidth: '1px', borderColor: 'var(--color-secondary)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    className={`flex-1 min-w-0 bg-white border ${error ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-medium tracking-wide`}
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                  />
                </div>
                {error && <span className="text-xs font-medium text-red-600 ml-1">{error}</span>}
              </div>
              <Button 
                className="w-full"
                onClick={handleSendOtp}
                isLoading={isLoading}
              >
                Get OTP <i className="fas fa-arrow-right ml-2 text-xs"></i>
              </Button>
            </div>
            ) : (
            <div className="space-y-4 animate-fade-in">
               <div className="text-center mb-2">
                 <p className="text-sm text-slate-600">
                   Enter the OTP sent to <span className="font-semibold text-slate-800">{countryCode} {phoneNumber}</span>
                 </p>
                 <button onClick={() => {
                   setStep('phone');
                   setOtp('');
                   setError('');
                 }} className="text-xs text-primary hover:underline mt-1 font-medium">
                   Change Number
                 </button>
               </div>
               <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 ml-1">Enter 6-Digit OTP</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm`}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {error && <span className="text-xs font-medium text-red-600 ml-1">{error}</span>}
               </div>
              <Button 
                className="w-full"
                onClick={handleVerifyOtp}
                isLoading={isLoading}
              >
                Verify & Login
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  setPhoneNumber('');
                  setOtp('');
                  setError('');
                }}
              >
                <i className="fas fa-arrow-left mr-2"></i> Back to Phone Number
              </Button>
              <p className="text-center text-xs text-slate-400 mt-4">
                Didn't receive code? <span className="text-primary cursor-pointer hover:underline font-medium">Resend</span>
              </p>
            </div>
            )
          ) : (
            // ...existing code for other roles or default login UI...
            step === 'phone' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>
                  Phone Number
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="font-medium rounded-lg px-2 py-3 focus:outline-none focus:ring-2 shadow-sm w-20 flex-shrink-0 cursor-pointer text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', borderWidth: '1px', borderColor: 'var(--color-secondary)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    className={`flex-1 min-w-0 bg-white border ${error ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-medium tracking-wide`}
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                  />
                </div>
                {error && <span className="text-xs font-medium text-red-600 ml-1">{error}</span>}
              </div>
              <Button 
                className="w-full"
                onClick={handleSendOtp}
                isLoading={isLoading}
              >
                Get OTP <i className="fas fa-arrow-right ml-2 text-xs"></i>
              </Button>
            </div>
            ) : (
            <div className="space-y-4 animate-fade-in">
               <div className="text-center mb-2">
                 <p className="text-sm text-slate-600">
                   Enter the OTP sent to <span className="font-semibold text-slate-800">{countryCode} {phoneNumber}</span>
                 </p>
                 <button onClick={() => {
                   setStep('phone');
                   setOtp('');
                   setError('');
                 }} className="text-xs text-primary hover:underline mt-1 font-medium">
                   Change Number
                 </button>
               </div>
               <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 ml-1">Enter 6-Digit OTP</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm`}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {error && <span className="text-xs font-medium text-red-600 ml-1">{error}</span>}
               </div>
              <Button 
                className="w-full"
                onClick={handleVerifyOtp}
                isLoading={isLoading}
              >
                Verify & Login
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  setPhoneNumber('');
                  setOtp('');
                  setError('');
                }}
              >
                <i className="fas fa-arrow-left mr-2"></i> Back to Phone Number
              </Button>
              <p className="text-center text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
                Didn't receive code? <span className="cursor-pointer hover:underline font-medium" style={{ color: 'var(--color-primary)' }}>Resend</span>
              </p>
            </div>
            )
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--color-secondary)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>Secure & Confidential</span>
            </div>
          </div>

          <div className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
            By continuing, you agree to TheMindNetwork's Terms of Service and Privacy Policy.
          </div>
        </div>
            
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};