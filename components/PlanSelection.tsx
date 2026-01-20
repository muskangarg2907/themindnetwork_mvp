import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { auth } from '../services/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
];

interface Plan {
  id: string;
  name: string;
  icon: string;
  price: string;
  oldPrice?: string;
  description: string;
  features: string[];
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'explore',
    name: 'Explore',
    icon: 'fa-compass',
    price: '₹1,799',
    oldPrice: '₹2,997',
    description: 'Try different therapists and find your perfect match',
    features: [
      'Unlimited consultations with our team',
      'Try different therapists',
      'Get 3 therapy sessions'
    ],
    highlight: true
  },
  {
    id: 'connect',
    name: 'Connect',
    icon: 'fa-handshake',
    price: '₹1,299',
    description: 'AI-powered matching for the best fit',
    features: [
      'AI-powered therapist matching',
      'First 3 sessions included',
      'Cancel anytime'
    ],
    highlight: false
  }
];

export const PlanSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Auth states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinueToPayment = () => {
    if (!selectedPlan) {
      console.log('[PLANS] No plan selected');
      return;
    }
    
    console.log('[PLANS] Selected plan:', selectedPlan);
    console.log('[PLANS] User logged in:', isLoggedIn);
    
    if (isLoggedIn) {
      // User is logged in, proceed to payment directly
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (plan) {
        console.log('[PLANS] User is logged in, navigating to payment with plan:', plan.name);
        navigate('/payment', { state: { plan } });
      }
    } else {
      // User is not logged in, show auth modal
      console.log('[PLANS] User not logged in, showing auth modal');
      setShowAuthModal(true);
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      setAuthError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // Initialize reCAPTCHA
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (!recaptchaContainer) {
        throw new Error('reCAPTCHA container not found');
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('[PLANS] reCAPTCHA solved');
        }
      });

      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
      setAuthError('');
    } catch (err: any) {
      console.error('[PLANS] Error sending OTP:', err);
      setAuthError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setAuthError('Please enter the 6-digit OTP');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (!confirmationResult) {
        throw new Error('Please request OTP first');
      }

      await confirmationResult.confirm(otp);
      
      // Store email in localStorage for payment tracking
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userPhone', `${countryCode}${phoneNumber}`);
      
      setShowAuthModal(false);
      
      // Navigate to payment
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (plan) {
        navigate('/payment', { state: { plan, email, phone: `${countryCode}${phoneNumber}` } });
      }
    } catch (err: any) {
      console.error('[PLANS] Error verifying OTP:', err);
      setAuthError('Invalid OTP. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestConsultation = () => {
    // Open consultation booking
    window.open('https://calendar.app.google/a9nJB8iRiUyDRcNi6', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-accent/10 to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4" style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            <i className="fas fa-sparkles"></i>
            <span className="font-medium">Select Your Perfect Plan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}>Care Plan</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the plan that best fits your mental wellness journey. Not sure? Book a free consultation with our team.
          </p>
        </div>

        {/* Process Steps - Show only for non-logged-in users */}
        {!isLoggedIn && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Select Your Plan</h4>
                <p className="text-sm text-slate-600">Choose the plan that fits you best</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Verify Phone Number</h4>
                <p className="text-sm text-slate-600">Quick OTP verification</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Make Payment</h4>
                <p className="text-sm text-slate-600">Secure payment gateway</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-white font-bold">4</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">We Contact You</h4>
                <p className="text-sm text-slate-600">Our team schedules your session</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanSelect(plan.id)}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                selectedPlan === plan.id
                  ? 'border-teal-500 shadow-2xl shadow-teal-500/30'
                  : plan.highlight
                  ? 'border-teal-200'
                  : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              {/* Selection Indicator */}
              {selectedPlan === plan.id && (
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <i className="fas fa-check text-white text-sm"></i>
                </div>
              )}

              {/* Most Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 text-white text-xs font-bold rounded-full shadow-lg" style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}>
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center ${
                  plan.highlight ? 'bg-gradient-to-br from-teal-500 to-blue-600' : 'bg-slate-100'
                }`}>
                  <i className={`fas ${plan.icon} text-2xl ${
                    plan.highlight ? 'text-white' : 'text-slate-600'
                  }`}></i>
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.oldPrice && (
                      <span className="text-lg text-slate-400 line-through">{plan.oldPrice}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 mb-6">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <i className="fas fa-check-circle mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }}></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className="w-full"
                  style={{
                    backgroundColor: selectedPlan === plan.id || plan.highlight ? 'var(--color-primary)' : undefined,
                    color: selectedPlan === plan.id || plan.highlight ? '#fff' : undefined
                  }}
                  variant={selectedPlan === plan.id || plan.highlight ? undefined : 'outline'}
                >
                  {selectedPlan === plan.id ? (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Selected
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleRequestConsultation}
            variant="outline"
            className="w-full sm:w-auto px-8 py-3 text-lg"
          >
            <i className="fas fa-calendar mr-2"></i>
            Need Help? Book Free Consultation
          </Button>

          <Button
            onClick={handleContinueToPayment}
            disabled={!selectedPlan}
            className={`w-full sm:w-auto px-12 py-3 text-lg ${
              !selectedPlan ? 'opacity-50 cursor-not-allowed' : 'shadow-xl shadow-teal-500/30'
            }`}
          >
            Continue to Payment <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-800 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Go Back
          </button>
        </div>
      </div>

      {/* Auth Modal for Non-Logged-In Users */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                <i className="fas fa-user-check text-2xl" style={{ color: 'var(--color-primary)' }}></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Details</h3>
              <p className="text-slate-600">
                {authStep === 'phone' 
                  ? 'Enter your phone number and email to continue'
                  : 'Enter the OTP sent to your phone'
                }
              </p>
            </div>

            {authStep === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      maxLength={10}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {authError}
                  </div>
                )}

                <Button
                  onClick={handleSendOtp}
                  disabled={authLoading || phoneNumber.length !== 10 || !email}
                  className="w-full"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  {authLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {authError}
                  </div>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={authLoading || otp.length !== 6}
                  className="w-full"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  {authLoading ? 'Verifying...' : 'Verify & Continue'}
                </Button>

                <button
                  onClick={() => setAuthStep('phone')}
                  className="w-full text-sm text-slate-600 hover:text-slate-800"
                >
                  ← Change Phone Number
                </button>
              </div>
            )}

            <div id="recaptcha-container"></div>
          </div>
        </div>
      )}
    </div>
  );
};
