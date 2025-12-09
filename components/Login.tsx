import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Setup reCAPTCHA on component mount
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved - allow send OTP
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
  }, []);
  }, [step]);

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

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
    }
    setError('');
    setIsLoading(true);
    
    const fullPhone = `${countryCode}${phoneNumber}`;
    
    try {
      const appVerifier = window.recaptchaVerifier;
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
      
      // Set auth tokens
      localStorage.setItem('authToken', 'firebase_verified');
      localStorage.setItem('userPhone', fullPhone);
      
      // Check if profile exists
      console.log('[LOGIN] Checking if profile exists for phone:', fullPhone);
      const resp = await fetch(`/api/profiles/lookup?phone=${encodeURIComponent(fullPhone)}`);
      
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
        navigate('/create');
        return;
      }

      // Server error - still allow them to create profile
      const errBody = await resp.json().catch(() => ({}));
      console.warn('[LOGIN] Lookup error:', errBody, '- allowing profile creation');
      setIsLoading(false);
      navigate('/create');
    } catch (err: any) {
      console.error('[LOGIN] OTP verification error:', err);
      setIsLoading(false);
      setError(err.message || 'Invalid OTP. Please try again.');
    }
  };    // EXISTING USER - Profile found
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
        navigate('/create');
        return;
      }

      // Server error - still allow them to create profile
      const errBody = await resp.json().catch(() => ({}));
      console.warn('[LOGIN] Lookup error:', errBody, '- allowing profile creation');
      setIsLoading(false);
      navigate('/create');
    } catch (err: any) {
      console.error('[LOGIN] Network error:', err);
      setIsLoading(false);
      setError('Connection failed. Please check your internet and try again.');
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