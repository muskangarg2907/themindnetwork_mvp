import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

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
  const preselectedRole = (location.state as any)?.role; // 'client' or 'provider' or undefined
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
    console.log('[LOGIN] Attempting to send OTP to:', fullPhone);
    console.log('[LOGIN] Country code:', countryCode, 'Phone:', phoneNumber);
    
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
      console.log('[LOGIN] Calling signInWithPhoneNumber with:', fullPhone);
      
      // Add timeout wrapper
      const signInPromise = signInWithPhoneNumber(auth, fullPhone, appVerifier);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000)
      );
      
      const confirmation = await Promise.race([signInPromise, timeoutPromise]) as ConfirmationResult;
      setConfirmationResult(confirmation);
      
      // Track OTP request
      try {
        await fetch('/api/analytics/auth-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone, event: 'otp_requested', timestamp: new Date().toISOString() })
        });
      } catch (e) {
        console.log('[LOGIN] Failed to track OTP request:', e);
      }
      
      setIsLoading(false);
      setStep('otp');
      console.log('[LOGIN] OTP sent successfully to', fullPhone);
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
    
    setError('');
    setIsLoading(true);

    const fullPhone = `${countryCode} ${phoneNumber}`;

    try {
      // Verify OTP with Firebase
      await confirmationResult.confirm(otp);
      console.log('[LOGIN] OTP verified successfully');
      
      // Track OTP verification
      try {
        await fetch('/api/analytics/auth-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone, event: 'otp_verified', timestamp: new Date().toISOString() })
        });
      } catch (e) {
        console.log('[LOGIN] Failed to track OTP verification:', e);
      }
      
      // Set auth tokens
      localStorage.setItem('authToken', 'firebase_verified');
      localStorage.setItem('userPhone', fullPhone);
      
      // Check if profile exists
      console.log('[LOGIN] Checking if profile exists for phone:', fullPhone);
      const resp = await fetch(`/api/profiles?action=lookup&phone=${encodeURIComponent(fullPhone)}`);
      
      console.log('[LOGIN] Lookup response status:', resp.status);
      
      if (resp.ok) {
        // EXISTING USER - Profile found
        const profile = await resp.json();
        console.log('[LOGIN] EXISTING USER - Found profile:', profile._id, profile.basicInfo?.fullName);
        localStorage.setItem('userProfile', JSON.stringify(profile));
        setIsLoading(false);
        navigate('/profile');
        return;
      }

      // NEW USER - Profile not found, start signup flow
      if (resp.status === 404) {
        console.log('[LOGIN] NEW USER - No profile found, starting signup');
        setIsLoading(false);
        navigate('/create', { state: { phone: fullPhone, preselectedRole } });
        return;
      }

      // Server error - still allow them to create profile
      const errBody = await resp.json().catch(() => ({}));
      console.warn('[LOGIN] Lookup error:', errBody, '- allowing profile creation');
      setIsLoading(false);
      navigate('/create', { state: { phone: fullPhone, preselectedRole } });
    } catch (err: any) {
      console.error('[LOGIN] OTP verification error:', err);
      setIsLoading(false);
      
      // Friendly error messages based on error code
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Invalid OTP. Please check and try again.');
      }
      
      // Clear the OTP input to allow re-entry
      setOtp('');
      if (otpInputRef.current) {
        otpInputRef.current.focus();
      }
    }
  };  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-slide-up">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    <i className="fas fa-brain"></i>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">TheMindNetwork</h1>
                <p className="text-slate-500">Welcome to India's premier mental health platform.</p>
            </div>

            <div className="space-y-6">
                {step === 'phone' ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-semibold text-slate-700 ml-1">
                                Phone Number
                            </label>
                            <div className="flex gap-3">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="bg-white border border-slate-300 text-slate-700 font-medium rounded-lg px-2 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm w-24 cursor-pointer"
                                >
                                    {COUNTRY_CODES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} {c.country}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    className={`flex-1 bg-white border ${error ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm font-medium tracking-wide`}
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
                             }} className="text-xs text-teal-600 hover:underline mt-1 font-medium">
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
                                className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm`}
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
                            Didn't receive code? <span className="text-teal-600 cursor-pointer hover:underline font-medium">Resend</span>
                        </p>
                    </div>
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-400">Secure & Confidential</span>
                    </div>
                </div>

                <div className="text-center text-xs text-slate-400">
                    By continuing, you agree to TheMindNetwork's Terms of Service and Privacy Policy.
                </div>
            </div>
            
            {/* Hidden reCAPTCHA container */}
            <div id="recaptcha-container"></div>
        </div>
    </div>
  );
};