import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { auth } from '../services/firebase';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    
    try {
      const res = await fetch('/api/utils?action=contact', {
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
        price: '₹249',
      description: 'Start your mental wellness journey with complete confidence',
      features: [
        'An exploration call with our team',
        '10% discount on your first 3 sessions',
        'Try different therapists to find your match',
        'Refund anytime, no questions asked'
      ],
      cta: 'Get Started',
      highlight: true
    }
  ];

  const toggleFAQ = (index: number) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFAQs(newExpanded);
  };

  const faqs = [
    {
      question: 'What is TheMindNetwork?',
      answer: 'TheMindNetwork is a digital platform connecting clients with verified mental health professionals for online and offline therapy sessions. We offer personalized matching based on specializations, location, and client preferences across major Indian cities.'
    },
    {
      question: 'How much does therapy cost?',
      answer: 'Individual therapy sessions range from ₹1,000 to ₹4,000 depending on the therapist\'s expertise and session type. We also offer a ₹249 exploration call to help you find the right therapist before committing to a full session.'
    },
    {
      question: 'Are the therapists verified and qualified?',
      answer: 'Yes. All therapists on TheMindNetwork are verified mental health professionals with relevant credentials in psychology, psychiatry, or counseling.'
    },
    {
      question: 'How do I book a therapy session?',
      answer: 'Sign up, complete your profile and our team will get in touch. Chose a plan, schedule your first session and start therapy. Try different therapists until you find the right one.'
    },
    {
      question: 'Is my information confidential?',
      answer: 'Absolutely. We maintain strict confidentiality and follow Indian mental health privacy regulations. All therapists are bound by professional confidentiality agreements and ethical codes. Your personal information and session details are encrypted and secure.'
    },
    {
      question: 'What therapy modalities are offered?',
      answer: 'Our network of therapists specializes in multiple approaches including Cognitive Behavioral Therapy (CBT), psychodynamic therapy, mindfulness-based therapy, couples counseling, and specialized treatments for anxiety, depression, trauma, and relationship issues.'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomColor: 'var(--color-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <span className="text-base sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>TheMindNetwork</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 justify-end w-full">
            <button
              onClick={() => window.open(`${window.location.origin}/#/referrals`, '_blank', 'noopener,noreferrer')}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-primary)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
            >
              Referrals
            </button>
            <a
              href={`${window.location.origin}/#/provider`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-primary)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
            >
              For Providers
            </a>
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2 text-base font-semibold shadow-md rounded-lg transition-all text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                <i className="fas fa-user-circle mr-2"></i>Go to Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-base font-semibold shadow-md rounded-lg transition-all text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>Login
              </button>
            )}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`${window.location.origin}/#/referrals`, '_blank', 'noopener,noreferrer')}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all"
                style={{ backgroundColor: 'white', color: 'var(--color-primary)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
              >
                Referrals
              </button>
              {isLoggedIn ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                >
                  Profile <i className="fas fa-user-circle ml-1"></i>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                >
                  Login <i className="fas fa-sign-in-alt ml-1"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm mb-8 shadow-sm" style={{ backgroundColor: 'var(--color-secondary)', borderWidth: '1px', borderColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>
            <i className="fas fa-shield-heart" style={{ color: 'var(--color-primary)' }}></i>
            <span className="font-semibold">Trusted by thousands across India</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            <span style={{ color: 'var(--color-primary)' }}>Find the therapist</span><br/>
            <span style={{ color: 'var(--color-text-primary)' }}>meant for you</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light" style={{ color: 'var(--color-text-muted)' }}>
            Personalized matching with trained professionals who understand your unique needs.
          </p>

          <div className="flex flex-col items-center gap-6 mb-12">
            <button 
              onClick={() => navigate(isLoggedIn ? '/profile' : '/login', { state: { role: 'client' } })}
              className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-14 py-4 sm:py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 text-white font-semibold"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              Begin Your Journey <i className="fas fa-arrow-right ml-3"></i>
            </button>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Premium care • Confidential • Personalized</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true">
                <i className="fas fa-user-doctor text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>Verified Professionals</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Trained & experienced therapists</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg" style={{ backgroundColor: 'var(--color-accent)' }} aria-hidden="true">
                <i className="fas fa-comments text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>Personalized Matching</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>AI-powered compatibility analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true">
                <i className="fas fa-shield-halved text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>Complete Privacy</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>100% confidential sessions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider CTA Section */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(163, 177, 138, 0.05)' }}></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm mb-6 shadow-lg" style={{ backgroundColor: 'rgba(163, 177, 138, 0.2)', borderWidth: '1px', borderColor: 'var(--color-accent)', color: 'var(--color-secondary)' }}>
            <i className="fas fa-star"></i>
            <span className="font-semibold">Join Our Professional Network</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Are you a provider who wants to join us?
          </h2>
          <p className="text-lg sm:text-xl mb-10 font-light" style={{ color: 'var(--color-secondary)' }}>
            Connect with clients who need your expertise. Grow your practice with TheMindNetwork.
          </p>
          <div className="flex flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={() => navigate('/provider')}
              className="text-base sm:text-lg px-8 sm:px-14 py-4 sm:py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto text-white font-semibold transform hover:scale-105"
              style={{ backgroundColor: 'var(--color-accent)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
            >
              Start Now <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          <p className="text-sm mt-6 font-medium" style={{ color: 'var(--color-accent)' }}>✨ Expand your reach and help more people</p>
        </div>
      </div>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: 'var(--color-secondary)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            What our customers say
          </h2>
          <p className="text-base sm:text-xl mb-10" style={{ color: 'var(--color-text-muted)' }}>
            Join thousands who found their perfect therapist match through TheMindNetwork
          </p>

          {/* Testimonials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Client testimonial avatar" className="w-10 h-10 rounded-full blur-md" loading="lazy" />
                <span className="text-xs text-gray-500">j*** s****</span>
                <div className="text-left">
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
                "I was nervous to start, but my therapist made it so easy to talk. I actually look forward to our sessions now!"
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Client testimonial avatar" className="w-10 h-10 rounded-full blur-md" loading="lazy" />
                <span className="text-xs text-gray-500">a*** k****</span>
                <div className="text-left">
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
                "Honestly, I didn't expect much, but this has been a game changer. My anxiety is way more manageable now."
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="Client testimonial avatar" className="w-10 h-10 rounded-full blur-md" loading="lazy" />
                <span className="text-xs text-gray-500">r*** p****</span>
                <div className="text-left">
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
                "Super friendly team, and my therapist really listens. Feels like chatting with a friend who actually helps!"
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500 mt-6">🔒 Your privacy and data are 100% secure</p>
        </div>
      </section>

      {/* Answer Engine Optimization (AEO) - Collapsible FAQs */}
      <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>
            FAQs
          </h2>
          <p className="text-center text-base sm:text-lg mb-10 sm:mb-16" style={{ color: 'var(--color-text-secondary)' }}>
            Find direct answers to questions about our therapy platform, pricing, and how we work.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: 'white' }}>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  style={{ backgroundColor: expandedFAQs.has(index) ? 'rgba(163, 177, 138, 0.05)' : 'white' }}
                >
                  <h3 className="text-base sm:text-lg font-bold pr-4" style={{ color: 'var(--color-text-primary)' }}>
                    {faq.question}
                  </h3>
                  <i 
                    className={`fas fa-chevron-down transition-transform duration-300 flex-shrink-0`}
                    style={{
                      color: 'var(--color-accent)',
                      transform: expandedFAQs.has(index) ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  ></i>
                </button>

                {expandedFAQs.has(index) && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-gray-200" style={{ borderTopColor: 'rgba(163, 177, 138, 0.2)' }}>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 p-5 sm:p-8 rounded-2xl" style={{ backgroundColor: 'rgba(163, 177, 138, 0.1)', border: '2px solid var(--color-secondary)' }}>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <i className="fas fa-lightbulb mr-2" style={{ color: 'var(--color-accent)' }}></i>
              For Therapists & Counselors
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              TheMindNetwork helps mental health professionals expand their practice by connecting them with clients seeking specialized care. Create a profile, showcase your expertise, and manage your schedule. Join hundreds of verified therapists already on our platform.
            </p>
            <a 
              href="#/provider" 
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              Become a Provider <i className="fas fa-arrow-right ml-2"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Get in <span style={{ color: 'var(--color-primary)' }}>Touch</span>
            </h2>
            <p className="text-base sm:text-xl font-light" style={{ color: 'var(--color-text-muted)' }}>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl" style={{ borderWidth: '1px', borderColor: 'var(--color-secondary)' }}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Name <span style={{ color: 'var(--color-accent)' }}>*</span>
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
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Email <span style={{ color: 'var(--color-accent)' }}>*</span>
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
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Message <span style={{ color: 'var(--color-accent)' }}>*</span>
                </label>
                <textarea
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors resize-none"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-secondary)'}
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

              <button
                type="submit"
                className="w-full py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all text-white font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
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
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer with Internal Links */}
      <footer className="py-10 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <i className="fas fa-brain text-white text-sm"></i>
                </div>
                <span className="text-lg font-bold text-white">TheMindNetwork</span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-secondary)' }}>
                Connecting you with verified mental health professionals for your wellness journey.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.linkedin.com/company/themindnetwork/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: 'rgba(163, 177, 138, 0.2)', color: 'var(--color-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(163, 177, 138, 0.2)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
                  aria-label="Visit our LinkedIn page"
                >
                  <i className="fab fa-linkedin"></i>
                </a>
                <a
                  href="mailto:muskangarg.official@gmail.com"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: 'rgba(163, 177, 138, 0.2)', color: 'var(--color-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(163, 177, 138, 0.2)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
                  aria-label="Send us an email"
                >
                  <i className="fas fa-envelope"></i>
                </a>
                <a
                  href="https://calendar.app.google/tcTjSbY4A2fcoWQW8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: 'rgba(163, 177, 138, 0.2)', color: 'var(--color-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(163, 177, 138, 0.2)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
                  aria-label="Book a consultation slot"
                >
                  <i className="fas fa-calendar-check"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <nav aria-label="Quick links">
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Find a Therapist
                  </a>
                </li>
                <li>
                  <a 
                    href="/#/provider"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    For Providers
                  </a>
                </li>
                <li>
                  <a 
                    href="/#/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a
                    href={`${window.location.origin}/#/referrals`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Referrals
                  </a>
                </li>
                <li>
                  <a 
                    href="#plans" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Pricing Plans
                  </a>
                </li>
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Resources">
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#testimonials" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a 
                    href="#contact" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href={`${window.location.origin}/#/therapy-guide`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    Which Therapy Is Right for Me?
                  </a>
                </li>
                <li className="flex items-center gap-2 mt-4">
                  <i className="fas fa-shield-alt" style={{ color: 'var(--color-accent)' }} aria-hidden="true"></i>
                  <span className="text-sm">100% Confidential</span>
                </li>
              </ul>
            </nav>
          </div>

          {/* Bottom Bar */}
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
              © {new Date().getFullYear()} TheMindNetwork. All rights reserved.
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(163, 177, 138, 0.6)' }}>
              Last updated: March 12, 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};