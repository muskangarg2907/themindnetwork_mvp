import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      
      if (res.ok) {
        setContactStatus('success');
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setContactStatus('idle'), 5000);
      } else {
        setContactStatus('error');
        setTimeout(() => setContactStatus('idle'), 5000);
      }
    } catch (error) {
      setContactStatus('error');
      setTimeout(() => setContactStatus('idle'), 5000);
    }
  };

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
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/login', { state: { role: 'provider' } })}
              variant="outline"
              className="px-6 py-2 border-2 border-teal-500 text-teal-600 hover:bg-teal-50"
            >
              For Providers <i className="fas fa-user-doctor ml-2"></i>
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="secondary"
              className="px-6 py-2"
            >
              Login <i className="fas fa-sign-in-alt ml-2"></i>
            </Button>
          </div>
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
            Find your perfect therapist match with personalized care and unlimited consultations.
          </p>

          <div className="flex flex-col items-center gap-6 mb-12">
            <Button 
              onClick={() => navigate('/login', { state: { role: 'client' } })}
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
                  onClick={() => navigate('/login', { state: { role: 'client' } })}
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

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-600 font-semibold">PS</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Priya Sharma</p>
                  <div className="flex text-yellow-500 text-sm">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm text-left">
                "Finally found someone who gets me. The matching was spot on and my therapist genuinely cares. Feeling so much lighter now!"
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">RK</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Rohan Kapoor</p>
                  <div className="flex text-yellow-500 text-sm">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm text-left">
                "Was skeptical at first but this changed everything. My therapist helped me work through anxiety I'd been ignoring for years."
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">AM</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Ananya Mehta</p>
                  <div className="flex text-yellow-500 text-sm">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm text-left">
                "Best decision I made this year. The whole process was smooth and I connected with an amazing therapist on my first try."
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/login', { state: { role: 'client' } })}
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

      {/* Provider CTA Section */}
      <div className="py-24 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm mb-6">
            <i className="fas fa-star"></i>
            <span>Join Our Professional Network</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Want to Join Our Network of Professionals?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Connect with clients who need your expertise. Grow your practice with TheMindNetwork.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate('/login', { state: { role: 'provider' } })}
              className="text-lg px-12 py-5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/30"
            >
              Get in Touch <i className="fas fa-user-doctor ml-2"></i>
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-6">✨ Expand your reach and help more people</p>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Touch</span>
            </h2>
            <p className="text-xl text-slate-600">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 shadow-xl border-2 border-slate-100">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full"
                  disabled={contactStatus === 'sending'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full"
                  disabled={contactStatus === 'sending'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none transition-colors resize-none"
                  disabled={contactStatus === 'sending'}
                />
              </div>

              {contactStatus === 'success' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                  <p className="text-green-700 font-medium">Thanks for reaching out! We'll get back to you soon.</p>
                </div>
              )}

              {contactStatus === 'error' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-600 text-xl"></i>
                  <p className="text-red-700 font-medium">Oops! Something went wrong. Please try again.</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-4 text-lg rounded-xl"
                disabled={contactStatus === 'sending'}
              >
                {contactStatus === 'sending' ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message <i className="fas fa-paper-plane ml-2"></i>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};