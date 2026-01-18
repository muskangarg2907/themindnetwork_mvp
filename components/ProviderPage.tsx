import React from 'react';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

const benefits = [
  {
    icon: 'fa-user-edit',
    title: 'Easy Setup',
    desc: 'Get started quickly with a simple onboarding process.'
  },
  {
    icon: 'fa-users',
    title: 'Get Right Clients',
    desc: 'Connect with clients who match your expertise and interests.'
  },
  {
    icon: 'fa-network-wired',
    title: 'Build Your Network',
    desc: 'Expand your professional network and collaborate with peers.'
  },
  {
    icon: 'fa-bullseye',
    title: 'Outcome Based Incentives',
    desc: 'Earn rewards and incentives based on client outcomes.'
  }
];

const ProviderPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Navigation Bar (copied from Landing) */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomColor: 'var(--color-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>TheMindNetwork</span>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 justify-end w-full">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-primary)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
            >
              For Seekers
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-base font-semibold shadow-md rounded-lg transition-all text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <i className="fas fa-sign-in-alt mr-2"></i>Login
            </button>
          </div>
          {/* Mobile Login Button */}
          <div className="md:hidden">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              Login <i className="fas fa-sign-in-alt ml-1"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-8 px-2 sm:px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          {/* First fold: Title and Benefits */}
          <div className="w-full flex flex-col items-center mb-16">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true">
              <i className="fas fa-user-md text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-center" style={{ color: 'var(--color-primary)' }}>
              Join TheMindNetwork
            </h1>
            <p className="mb-10 text-center text-lg md:text-xl" style={{ color: 'var(--color-text-muted)' }}>Grow your practice, connect with clients, and build your professional network.</p>
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
              {benefits.map((b, idx) => (
                <article key={idx} className="bg-white rounded-3xl shadow-xl p-8 border-2 flex flex-col items-center justify-center min-h-[180px]" style={{ borderColor: 'var(--color-secondary)' }}>
                  <h2 className="font-semibold text-2xl mb-3 text-center" style={{ color: 'var(--color-text-primary)' }}>{b.title}</h2>
                  <p className="text-base text-center" style={{ color: 'var(--color-text-muted)' }}>{b.desc}</p>
                </article>
              ))}
            </div>
          </div>
          {/* Second fold: Ready to get started - improved design */}
          <section className="w-full max-w-2xl mt-2 flex flex-col items-center">
            <div className="text-center py-10 px-4 md:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Ready to get started?</h2>
              <p className="mb-8 text-lg" style={{ color: 'var(--color-text-muted)' }}>Join a growing network of professionals and make a difference. Start your journey now!</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
                <button
                  className="px-8 py-4 text-lg font-semibold shadow-md rounded-lg transition-all text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                  onClick={() => navigate('/login', { state: { role: 'provider' } })}
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>Login as Therapist
                </button>
                <button
                  className="px-8 py-4 text-lg font-semibold shadow-md rounded-lg transition-all text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
                  onClick={() => window.open('https://calendar.app.google/qR3Yam6CNs3KcSVr5', '_blank')}
                >
                  <i className="fas fa-calendar-alt mr-2"></i>Book Consultation
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer with Internal Links */}
      <footer className="py-12 px-6" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
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
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
                Connecting you with verified mental health professionals for your wellness journey.
              </p>
            </div>

            {/* Quick Links */}
            <nav aria-label="Quick links">
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
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
                    href="/#plans" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                      setTimeout(() => {
                        document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
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
                    href="/#testimonials" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                      setTimeout(() => {
                        document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="text-sm hover:text-teal-400 transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a 
                    href="/#contact" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                      setTimeout(() => {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="text-sm hover:text-teal-400 transition-colors"
                  >
                    Contact Us
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
          <div className="pt-8 text-center" style={{ borderTopWidth: '1px', borderTopColor: 'rgba(163, 177, 138, 0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
              © {new Date().getFullYear()} TheMindNetwork. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProviderPage;
