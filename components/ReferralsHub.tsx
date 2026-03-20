import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { ReferralTab } from './ReferralTab';
import { ProviderReferralDiscover } from './ProviderReferralDiscover';

const referralChunks = [
  {
    icon: 'fa-user-plus',
    title: 'Register',
    detail: 'Create your account and submit your profile details.',
  },
  {
    icon: 'fa-file-circle-plus',
    title: 'Create Request',
    detail: 'Enter client details, publish your request, and share the unique link.',
  },
  {
    icon: 'fa-scale-balanced',
    title: 'Select Best Option',
    detail: 'Compare applicants in one place and choose the strongest match.',
  },
  {
    icon: 'fa-headset',
    title: 'Get Started',
    detail: 'Our team contacts you so the selected referral can move forward quickly.',
  },
];

const referralPros = [
  {
    icon: 'fa-network-wired',
    title: 'Go beyond your network',
    desc: 'Access a wider pool of verified professionals across specializations and geographies.',
  },
  {
    icon: 'fa-table-columns',
    title: 'Compare profiles in one place',
    desc: 'Side-by-side applicant view makes choosing the right fit fast and effortless.',
  },
  {
    icon: 'fa-check',
    title: 'Verified professionals only',
    desc: 'Every provider is manually reviewed and credentialed before going live.',
  },
  {
    icon: 'fa-clock',
    title: 'Save significant time',
    desc: 'Streamlined workflows eliminate back-and-forth so you can focus on your clients.',
  },
];

export const ReferralsHub: React.FC = () => {
  const navigate = useNavigate();
  const { phoneNumber, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile(phoneNumber);

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = Boolean(profile);
  const isProvider = profile?.role === 'provider';
  const normalizedPhone = (profile?.basicInfo.phone || '').replace(/\D/g, '').slice(-10);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomColor: 'var(--color-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <span className="text-base sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>TheMindNetwork</span>
          </button>

          <div className="flex items-center gap-3">
            <a
              href="/provider"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-primary)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
            >
              For Providers
            </a>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 text-sm sm:text-base font-semibold shadow-md rounded-lg transition-all text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <i className="fas fa-user-circle mr-2"></i>Go to Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm sm:text-base font-semibold shadow-md rounded-lg transition-all text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-36 sm:pt-40 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="rounded-2xl p-10 sm:p-14 shadow-xl relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full" style={{ backgroundColor: 'rgba(163, 177, 138, 0.25)' }}></div>
          <div className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full" style={{ backgroundColor: 'rgba(214, 212, 202, 0.2)' }}></div>
          <div className="relative z-10">
            <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>Client Referral</p>
            <h1 className="text-4xl sm:text-5xl font-bold mt-3 leading-tight text-white">Find the right referrals for you and your clients</h1>
            <p className="mt-4 max-w-3xl text-lg sm:text-xl font-light leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
              A structured referral flow designed for speed, transparency, and better-fit outcomes.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                  style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-secondary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white'; }}
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {referralPros.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl p-7 cursor-default transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-[#2E3A2F]"
              style={{ backgroundColor: 'white', borderWidth: '1.5px', borderColor: 'var(--color-secondary)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-[#2E3A2F] group-hover:scale-110"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                <i
                  className={`fas ${item.icon} text-lg transition-colors duration-300 group-hover:text-white`}
                  style={{ color: 'var(--color-primary)' }}
                ></i>
              </div>
              <h3 className="font-semibold text-base leading-snug mb-2" style={{ color: 'var(--color-text-primary)' }}>{item.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="px-2 sm:px-4 py-10 sm:py-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center" style={{ color: 'var(--color-text-primary)' }}>How It Works</h2>

          <div className="relative max-w-2xl mx-auto">
            {/* vertical line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-0.5 hidden sm:block"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            ></div>

            <div className="flex flex-col gap-10">
              {referralChunks.map((step, index) => (
                <div key={step.title} className="group flex items-start gap-6 sm:gap-8">
                  {/* step node */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md z-10 relative transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <i className={`fas ${step.icon} text-sm`}></i>
                    </div>
                    {/* connector dot on the line */}
                    <div
                      className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full hidden sm:block"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    ></div>
                  </div>

                  {/* content card */}
                  <div
                    className="flex-1 rounded-xl p-5 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5"
                    style={{ backgroundColor: 'var(--color-background)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}
                      >
                        Step 0{index + 1}
                      </span>
                      <h3 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>{step.title}</h3>
                    </div>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <>
            {isProvider && profile && (
              <div className="bg-white rounded-xl shadow p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Discover Open Referrals</h2>
                <ProviderReferralDiscover phoneNumber={normalizedPhone} profile={profile} />
              </div>
            )}

            {profile && (
              <div className="bg-white rounded-xl shadow p-8">
                <ReferralTab phoneNumber={normalizedPhone} role={profile.role} />
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Ready to create your first referral?</h3>
            <p className="text-lg font-light leading-relaxed mt-3 max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Log in to start creating requests, sharing links, and comparing applicants in one dashboard.
            </p>
            <div className="flex justify-center mt-5">
              <Button onClick={() => navigate('/login')}>Login</Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};