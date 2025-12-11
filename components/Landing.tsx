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
    <div className="min-h-screen bg-[#0f172a] overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="text-center max-w-4xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-xs mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Your Gateway to Mental Wellness
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Mental Health Care,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Done Right</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              TheMindNetwork connects you with verified mental health professionals who truly understand your needs. 
              Get matched with the right therapist and start your journey to wellness with care and confidence.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-check-circle text-teal-400"></i>
                <span>High-Quality Verified Professionals</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-check-circle text-teal-400"></i>
                <span>Unlimited Free Consultations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-check-circle text-teal-400"></i>
                <span>Try Different Therapists</span>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/login')}
              className="text-lg px-10 py-5 rounded-xl shadow-lg shadow-teal-500/20"
            >
              Get Started Today <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>

        {/* Plans Section */}
        <div className="px-4 py-20 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Path</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Select the plan that fits your journey to mental wellness
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div 
                  key={index}
                  className={`relative bg-slate-800/40 backdrop-blur border rounded-2xl p-8 hover:scale-105 transition-all duration-300 ${
                    plan.highlight 
                      ? 'border-teal-500 shadow-lg shadow-teal-500/20' 
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full text-white text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    plan.highlight ? 'bg-teal-500/20' : 'bg-slate-700/50'
                  }`}>
                    <i className={`fas ${plan.icon} text-2xl ${
                      plan.highlight ? 'text-teal-400' : 'text-slate-400'
                    }`}></i>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400 ml-2">for first 3 sessions</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <i className="fas fa-check text-teal-400 mt-1"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate('/login')}
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    className="w-full py-3 rounded-xl"
                  >
                    {plan.cta} <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands who found their perfect therapist match through TheMindNetwork
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/login')}
                className="text-lg px-10 py-5 rounded-xl"
              >
                Get Started Free <i className="fas fa-arrow-right ml-2"></i>
              </Button>
              {localStorage.getItem('userProfile') && (
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/profile')}
                  className="text-lg px-10 py-5 rounded-xl"
                >
                  Go to Profile <i className="fas fa-user ml-2"></i>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};