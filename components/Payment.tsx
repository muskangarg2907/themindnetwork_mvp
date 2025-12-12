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

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!plan) {
      navigate('/plans');
    }
  }, [plan, navigate]);

  if (!plan) return null;

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Navigate to success page or back to profile with success message
      navigate('/profile', { 
        state: { 
          paymentSuccess: true, 
          plan: plan.name 
        } 
      });
    }, 2000);
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
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900">{plan.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">GST (18%)</span>
                    <span className="text-slate-900">₹{(parseInt(plan.price.replace(/[^\d]/g, '')) * 0.18).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-teal-600">
                      ₹{(parseInt(plan.price.replace(/[^\d]/g, '')) * 1.18).toFixed(0)}
                    </span>
                  </div>
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
              <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Method</h2>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <i className="fas fa-mobile-alt text-2xl mb-2 text-slate-700"></i>
                  <p className="text-sm font-medium text-slate-900">UPI</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <i className="fas fa-credit-card text-2xl mb-2 text-slate-700"></i>
                  <p className="text-sm font-medium text-slate-900">Card</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <i className="fas fa-building-columns text-2xl mb-2 text-slate-700"></i>
                  <p className="text-sm font-medium text-slate-900">Net Banking</p>
                </button>
              </div>

              {/* Payment Form Based on Method */}
              <div className="space-y-4">
                {paymentMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      UPI ID
                    </label>
                    <Input
                      type="text"
                      placeholder="yourname@upi"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
                    </p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Card Number
                      </label>
                      <Input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Expiry Date
                        </label>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CVV
                        </label>
                        <Input
                          type="text"
                          placeholder="123"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cardholder Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Name on card"
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'netbanking' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Your Bank
                    </label>
                    <select className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all">
                      <option value="">Choose your bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                      <option value="other">Other Banks</option>
                    </select>
                  </div>
                )}
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
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock mr-2"></i>
                      Pay ₹{(parseInt(plan.price.replace(/[^\d]/g, '')) * 1.18).toFixed(0)}
                    </>
                  )}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <i className="fas fa-shield-check text-green-600"></i>
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className="fas fa-lock text-green-600"></i>
                  <span>PCI Compliant</span>
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
