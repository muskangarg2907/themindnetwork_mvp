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
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mb-6">
              <i className="fas fa-user-md text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-center">
              Join TheMindNetwork
            </h1>
            <p className="text-slate-600 mb-10 text-center text-lg md:text-xl">Grow your practice, connect with clients, and build your professional network.</p>
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
              {benefits.map((b, idx) => (
                <div key={idx} className="bg-white rounded-3xl shadow-xl p-8 border-2 border-teal-100 flex flex-col items-center justify-center min-h-[180px]">
                  <h3 className="font-semibold text-slate-900 text-2xl mb-3 text-center">{b.title}</h3>
                  <p className="text-slate-600 text-base text-center">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Second fold: Ready to get started - improved design */}
          <div className="w-full max-w-2xl mt-2 flex flex-col items-center">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProviderPage;
