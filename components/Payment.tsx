import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
}

export const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = (location.state as any)?.plan as Plan | null;

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!plan) {
      navigate('/plans');
    }
  }, [plan, navigate]);

  if (!plan) return null;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Get user profile for customer details
      const storedProfile = localStorage.getItem('userProfile');
      const userProfile = storedProfile ? JSON.parse(storedProfile) : null;

      // Extract amount from plan price (remove ₹ and commas)
      const amount = parseInt(plan.price.replace(/[^\d]/g, ''));

      // Create Razorpay order
      const orderResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          planId: plan.id,
          planName: plan.name,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Razorpay checkout options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TheMindNetwork',
        description: `${plan.name} Plan`,
        order_id: orderData.orderId,
        prefill: {
          name: userProfile?.basicInfo?.fullName || '',
          email: userProfile?.basicInfo?.email || '',
          contact: userProfile?.basicInfo?.phone || '',
        },
        theme: {
          color: '#14b8a6',
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI',
                instruments: [
                  {
                    method: 'upi',
                  },
                ],
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: function (response: any) {
          console.log('[RAZORPAY] Payment successful:', response);
          
          // Update user profile with payment details
          updateProfileWithPayment(response);
        },
        modal: {
          ondismiss: function () {
            console.log('[RAZORPAY] Payment cancelled');
            setIsProcessing(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('[PAYMENT] Error:', err);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const updateProfileWithPayment = async (razorpayResponse: any) => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (!storedProfile) {
        throw new Error('No user profile found');
      }

      const userProfile = JSON.parse(storedProfile);
      const amount = parseInt(plan.price.replace(/[^\d]/g, ''));

      // Create payment details object
      const paymentDetails = {
        planId: plan.id,
        planName: plan.name,
        amount: amount,
        currency: 'INR',
        status: 'success' as const,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Add to payments array (maintain history)
      const existingPayments = userProfile.payments || [];
      const updatedProfile = {
        ...userProfile,
        payments: [...existingPayments, paymentDetails],
      };

      // Save to backend
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile with payment');
      }

      const savedProfile = await response.json();
      
      // Update localStorage
      localStorage.setItem('userProfile', JSON.stringify(savedProfile));

      // Navigate to profile with success message
      navigate('/profile', {
        state: {
          paymentSuccess: true,
          plan: plan.name,
        },
      });
    } catch (err) {
      console.error('[PAYMENT] Failed to update profile:', err);
      // Still navigate but show a warning
      navigate('/profile', {
        state: {
          paymentSuccess: true,
          plan: plan.name,
          warning: 'Payment successful but profile update failed. Please contact support.',
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Payment</span>
          </h1>
          <p className="text-slate-600">Secure payment powered by Razorpay</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-teal-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.name} Plan</p>
                    <p className="text-sm text-slate-600">{plan.description}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Plan Price (GST Inclusive)</span>
                    <span className="text-slate-900">{plan.price}</span>
                  </div>
                  <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total Amount</span>
                    <span className="text-2xl font-bold text-teal-600">{plan.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">* All prices include 18% GST</p>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <i className="fas fa-shield-check"></i>
                  <span className="text-sm font-medium">100% Secure Payment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Secure Payment via Razorpay</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                        <span>Click the pay button below to open Razorpay's secure checkout</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                        <span>Choose from UPI, Cards, Net Banking, or Wallets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                        <span>Complete your payment securely on Razorpay's platform</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Accepted Payment Methods */}
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Accepted Payment Methods:</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <i className="fas fa-mobile-alt text-slate-600"></i>
                    <span className="text-sm text-slate-700">UPI</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <i className="fas fa-credit-card text-slate-600"></i>
                    <span className="text-sm text-slate-700">Cards</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <i className="fas fa-building-columns text-slate-600"></i>
                    <span className="text-sm text-slate-700">Net Banking</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <i className="fas fa-wallet text-slate-600"></i>
                    <span className="text-sm text-slate-700">Wallets</span>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <div className="mt-8">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full py-4 text-lg shadow-xl shadow-teal-500/30"
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Opening Razorpay...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock mr-2"></i>
                      Pay {plan.price}
                    </>
                  )}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <i className="fas fa-shield-check text-green-600"></i>
                  <span>Powered by Razorpay</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className="fas fa-lock text-green-600"></i>
                  <span>256-bit SSL Encryption</span>
                </div>
              </div>
            </div>

            {/* Cancel */}
            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/plans')}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
