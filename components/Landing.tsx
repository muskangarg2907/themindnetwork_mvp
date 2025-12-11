import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
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
      cta: 'Start Exploring',
      highlight: false
    },
    {
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
      cta: 'Get Matched',
      highlight: true
    },
    {
      name: 'Connect',
      icon: 'fa-handshake',
      price: '₹199',
      oldPrice: '₹499',
      noSessionText: true,
      description: 'Quick connection with the right therapist',
      features: [
        'Free consultation',
        'Direct therapist connection',
        'Expert guidance',
        'Fast onboarding'
      ],
      cta: 'Connect Now',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <span className="text-2xl font-bold text-slate-800">TheMindNetwork</span>
          </div>
          <Button 
            onClick={() => navigate('/login')}
            variant="secondary"
            className="px-6 py-2"
          >
            Login <i className="fas fa-sign-in-alt ml-2"></i>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm mb-8">
            <i className="fas fa-shield-heart"></i>
            <span className="font-medium">Trusted by thousands across India</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Your Journey to<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Mental Wellness</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with verified mental health professionals who understand your needs. 
            Experience personalized care with unlimited consultations and find your perfect therapist match.
          </p>

          <div className="flex flex-col items-center gap-6 mb-12">
            <Button 
              onClick={() => navigate('/login')}
              className="text-lg px-12 py-6 rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
            >
              Get Started Free <i className="fas fa-arrow-right ml-3"></i>
            </Button>
            <p className="text-sm text-slate-500">No credit card required • Start in 2 minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-user-doctor text-teal-600"></i>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Verified Professionals</p>
                <p className="text-sm text-slate-600">High-quality certified therapists</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-comments text-blue-600"></i>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Unlimited Consultations</p>
                <p className="text-sm text-slate-600">Free guidance to find your match</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-heart text-purple-600"></i>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Flexible Options</p>
                <p className="text-sm text-slate-600">Try different therapists risk-free</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Care Plan</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Flexible options designed for your mental health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white border-2 rounded-3xl p-8 hover:scale-105 transition-all duration-300 ${
                  plan.highlight 
                    ? 'border-teal-500 shadow-2xl shadow-teal-500/20' 
                    : 'border-slate-200 hover:border-slate-300 shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full text-white text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.highlight ? 'bg-gradient-to-br from-teal-500 to-blue-600' : 'bg-slate-100'
                }`}>
                  <i className={`fas ${plan.icon} text-2xl ${
                    plan.highlight ? 'text-white' : 'text-slate-600'
                  }`}></i>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3">{plan.name}</h3>
                <p className="text-slate-600 mb-6">{plan.description}</p>

                <div className="mb-8">
                  {plan.oldPrice && (
                    <div className="mb-2">
                      <span className="text-2xl text-slate-400 line-through">{plan.oldPrice}</span>
                    </div>
                  )}
                  <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                  {!plan.noSessionText && (
                    <p className="text-sm text-slate-500 mt-2">for your first 3 sessions</p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700">
                      <i className="fas fa-check-circle text-teal-600 mt-1 flex-shrink-0"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate('/login')}
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  className="w-full py-4 rounded-xl text-lg font-semibold"
                >
                  {plan.cta} <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-6 bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Join thousands who found their perfect therapist match through TheMindNetwork
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/login')}
              className="text-lg px-12 py-5 rounded-2xl shadow-lg shadow-teal-500/30"
            >
              Get Started Free <i className="fas fa-arrow-right ml-2"></i>
            </Button>
            {localStorage.getItem('userProfile') && (
              <Button 
                variant="secondary"
                onClick={() => navigate('/profile')}
                className="text-lg px-12 py-5 rounded-2xl"
              >
                Go to Profile <i className="fas fa-user ml-2"></i>
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-6">🔒 Your privacy and data are 100% secure</p>
        </div>
      </div>
    </div>
  );
};