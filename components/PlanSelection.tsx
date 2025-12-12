import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';

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
    price: '₹1,549',
    oldPrice: '₹1,999',
    description: 'Try different therapists and find your perfect match',
    features: [
      'Unlimited consultations with our team',
      'Try different therapists',
      'First 3 therapy sessions included',
      'Personalized recommendations'
    ],
    highlight: false
  },
  {
    id: 'align',
    name: 'Align',
    icon: 'fa-wand-magic-sparkles',
    price: '₹1,249',
    description: 'AI-powered matching for the best fit',
    features: [
      'AI-powered therapist matching',
      'Best match guarantee',
      'First 3 sessions included',
      'Smart preference analysis'
    ],
    highlight: true
  },
  {
    id: 'connect',
    name: 'Connect',
    icon: 'fa-handshake',
    price: '₹199',
    oldPrice: '₹499',
    description: 'Quick connection with the right therapist',
    features: [
      'Free consultation',
      'Direct therapist connection',
      'Expert guidance',
      'Fast onboarding'
    ],
    highlight: false
  }
];

export const PlanSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinueToPayment = () => {
    if (!selectedPlan) return;
    const plan = PLANS.find(p => p.id === selectedPlan);
    if (plan) {
      navigate('/payment', { state: { plan } });
    }
  };

  const handleRequestConsultation = () => {
    // Open consultation booking
    window.open('https://calendar.app.google/a9nJB8iRiUyDRcNi6', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm mb-4">
            <i className="fas fa-sparkles"></i>
            <span className="font-medium">Select Your Perfect Plan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Care Plan</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the plan that best fits your mental wellness journey. Not sure? Book a free consultation with our team.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <i className="fas fa-check text-white text-sm"></i>
                </div>
              )}

              {/* Most Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
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
                      <i className="fas fa-check-circle text-teal-500 mt-0.5 flex-shrink-0"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full ${
                    selectedPlan === plan.id
                      ? 'bg-teal-500 hover:bg-teal-600'
                      : plan.highlight
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                      : ''
                  }`}
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

        {/* Back to Profile */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/profile')}
            className="text-slate-600 hover:text-slate-800 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};
