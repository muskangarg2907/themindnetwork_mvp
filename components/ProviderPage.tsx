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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Navigation Bar (copied from Landing) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">TheMindNetwork</span>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 justify-end w-full">
            <Button 
              onClick={() => navigate('/')}
              variant="secondary"
              className="px-4 py-1.5 text-sm"
            >
              For Seekers
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="primary"
              className="px-6 py-2 text-base font-semibold shadow-md"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>Login
            </Button>
          </div>
          {/* Mobile Login Button */}
          <div className="md:hidden">
            <Button 
              onClick={() => navigate('/login')}
              variant="secondary"
              className="px-4 py-2 text-sm"
            >
              Login <i className="fas fa-sign-in-alt ml-1"></i>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-8 px-2 sm:px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          {/* First fold: Title and Benefits */}
          <div className="w-full flex flex-col items-center mb-16">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mb-6" aria-hidden="true">
              <i className="fas fa-user-md text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-center">
              Join TheMindNetwork
            </h1>
            <p className="text-slate-600 mb-10 text-center text-lg md:text-xl">Grow your practice, connect with clients, and build your professional network.</p>
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
              {benefits.map((b, idx) => (
                <article key={idx} className="bg-white rounded-3xl shadow-xl p-8 border-2 border-teal-100 flex flex-col items-center justify-center min-h-[180px]">
                  <h2 className="font-semibold text-slate-900 text-2xl mb-3 text-center">{b.title}</h2>
                  <p className="text-slate-600 text-base text-center">{b.desc}</p>
                </article>
              ))}
            </div>
          </div>
          {/* Second fold: Ready to get started - improved design */}
          <section className="w-full max-w-2xl mt-2 flex flex-col items-center">
            <div className="text-center py-10 px-4 md:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-teal-700 mb-4">Ready to get started?</h2>
              <p className="text-slate-600 mb-8 text-lg">Join a growing network of professionals and make a difference. Start your journey now!</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
                <Button
                  variant="primary"
                  className="px-8 py-4 text-lg font-semibold shadow-md"
                  onClick={() => navigate('/login', { state: { role: 'provider' } })}
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>Login as Therapist
                </Button>
                <Button variant="secondary" className="px-8 py-4 text-lg font-semibold shadow-md" as="a" href="https://calendar.app.google/qR3Yam6CNs3KcSVr5" target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-calendar-alt mr-2"></i>Book Consultation
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer with Internal Links */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                  <i className="fas fa-brain text-white text-sm"></i>
                </div>
                <span className="text-lg font-bold text-white">TheMindNetwork</span>
              </div>
              <p className="text-sm text-slate-400">
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
                    className="text-sm hover:text-teal-400 transition-colors"
                  >
                    Find a Therapist
                  </a>
                </li>
                <li>
                  <a 
                    href="/#/provider"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-teal-400 transition-colors"
                  >
                    For Providers
                  </a>
                </li>
                <li>
                  <a 
                    href="/#/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-teal-400 transition-colors"
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
                    className="text-sm hover:text-teal-400 transition-colors"
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
                  <i className="fas fa-shield-alt text-teal-400" aria-hidden="true"></i>
                  <span className="text-sm">100% Confidential</span>
                </li>
              </ul>
            </nav>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} TheMindNetwork. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProviderPage;
