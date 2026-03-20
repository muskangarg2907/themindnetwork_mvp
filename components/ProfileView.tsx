import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { TagInput } from './ui/TagInput';
import { sanitizeForStorage, secureLog } from '../services/security';
import { apiClient } from '../services/apiClient';
import { StatusBadge } from './ui/StatusBadge';
import { ReferralTab } from './ReferralTab';
import { ProviderReferralDiscover } from './ProviderReferralDiscover';
// auth handled via useAuth hook
import { useAuth, signOutUser } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

export const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(!(location.state as any)?.isNewlyCreated);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const [paymentWarning, setPaymentWarning] = useState<string>('');
    const [resumeDownloading, setResumeDownloading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
    const [providerSection, setProviderSection] = useState<'contact' | 'practice' | 'discover' | 'create'>('contact');
    const [clientSection, setClientSection] = useState<'basic' | 'personal' | 'payments' | 'assessments' | 'therapists'>('basic');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Check if URL contains #referrals
    return window.location.hash.includes('referrals') ? 'referrals' : 'overview';
  });
    // Deprecated local auth loading; replaced by useAuth/useProfile

    // Centralized auth + profile loading
    const { phoneNumber, isLoading: isAuthLoading } = useAuth();
    const { profile: hookProfile, isLoading: isProfileLoading, error: profileError, refreshProfile, updateProfile } = useProfile(phoneNumber);

    // Sync hook profile into local state for existing UI paths
    useEffect(() => {
        if (hookProfile) {
            setProfile(hookProfile);
            setEditData(hookProfile);
        }
    }, [hookProfile]);

  useEffect(() => {
    // Check for payment success message
    if ((location.state as any)?.paymentSuccess) {
      setShowPaymentSuccess(true);
      setSelectedPlanName((location.state as any)?.plan || '');
      setPaymentWarning((location.state as any)?.warning || '');
      
      // CRITICAL: Reload profile from localStorage after payment
      // The profile was updated by Payment.tsx before navigation
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
        setEditData(parsed);
        secureLog('[PROFILE] Reloaded profile after payment. Payments count:', parsed?.payments?.length || 0);
      }
      
      // Scroll to top to show the banner
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Auto-hide success message after 10 seconds
      const timer = setTimeout(() => {
        setShowPaymentSuccess(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

    // Redirect unauthenticated users
    useEffect(() => {
        if (!isAuthLoading) {
            const isAuthed = localStorage.getItem('user_authenticated') === 'true';
            if (!isAuthed) {
                console.log('[PROFILE] No authenticated user, redirecting to login');
                navigate('/login');
            }
        }
    }, [isAuthLoading, navigate]);

    // Load snapshots when profile is available
    useEffect(() => {
        const run = async () => {
            if (!profile?.basicInfo?.phone) return;
            const normalizedPhone = profile.basicInfo.phone.replace(/\s+/g, '');
            const localSnapshots: any[] = [];
      
            const localSnapshotUrl = localStorage.getItem('psychSnapshot_url');
            const localSnapshotData = localStorage.getItem('psychSnapshot_data');
            const localSnapshotPhone = localStorage.getItem('psychSnapshot_phone');
      
            if (localSnapshotUrl && localSnapshotData && localSnapshotPhone === normalizedPhone) {
                try {
                    const data = JSON.parse(localSnapshotData);
                    localSnapshots.push({
                        snapshotId: localSnapshotUrl,
                        phoneNumber: normalizedPhone,
                        snapshot: data.snapshot || { summary: 'Psychological snapshot' },
                        createdAt: data.createdAt || Date.now()
                    });
                } catch (e) {
                    console.error('[PROFILE] Failed to parse local snapshot:', e);
                }
            } else if (localSnapshotUrl && localSnapshotData && localSnapshotPhone && localSnapshotPhone !== normalizedPhone) {
                console.log('[PROFILE] Clearing localStorage snapshot from different user');
                localStorage.removeItem('psychSnapshot_url');
                localStorage.removeItem('psychSnapshot_data');
                localStorage.removeItem('psychSnapshot_phone');
            }
      
            // Placeholder: merge with API snapshots when endpoint exists
            const allSnapshots = [...localSnapshots];
            allSnapshots.sort((a, b) => b.createdAt - a.createdAt);
            setSnapshots(allSnapshots);
        };
        run();
    }, [profile]);

  // If profile was just created, delay polling to avoid race conditions (10s grace period)
  useEffect(() => {
    if ((location.state as any)?.isNewlyCreated && !pollingEnabled) {
      const timer = setTimeout(() => {
        console.log('[PROFILE] Grace period ended, enabling polling');
        setPollingEnabled(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.state, pollingEnabled]);

  // Removed constant polling - status updates are managed by admin portal
  // Profile changes are reflected when user refreshes or logs in again

    // Show loading state while hooks are loading
    if (isAuthLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

    if (!profile || !editData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to load profile</h2>
                    <p className="text-sm text-slate-600 mb-4">
                        {profileError || 'We could not fetch your profile right now.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={() => refreshProfile()}>
                            Try Again
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/login')}>
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

  const isClient = profile.role === 'client';
  const isProvider = profile.role === 'provider';
  
  // Additional safety check for basicInfo
  if (!profile.basicInfo) {
    console.error('[PROFILE] basicInfo is missing from profile:', profile);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Profile data is incomplete. Please log in again.</p>
          <Button onClick={() => navigate('/login')} className="mt-4">Back to Login</Button>
        </div>
      </div>
    );
  }

    const handleSave = async () => {
        try {
            console.log('[PROFILE] Saving profile');
            if (!editData) return;
            setSaveError('');
            await updateProfile(editData);
            secureLog('[PROFILE] Save successful');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving profile:', err);
            setSaveError('Failed to save your profile. Please check your connection and try again.');
        }
    };

  // Helper for array updates in edit mode
  const handleArrayChange = (section: 'clinical' | 'providerDetails', key: string, value: string) => {
     if (section === 'providerDetails' && editData.providerDetails) {
         setEditData({
             ...editData,
             providerDetails: {
                 ...editData.providerDetails,
                 [key]: value.split(',').map(s => s.trim())
             }
         });
     }
  };

  const handleDetailChange = (key: string, value: string) => {
      if (editData.providerDetails) {
          setEditData({
              ...editData,
              providerDetails: {
                  ...editData.providerDetails,
                  [key]: value
              }
          });
      }
  };

  const handleDownloadResume = async () => {
        setResumeDownloading(true);
        try {
            // resumeFileData is stripped from localStorage cache (too large) but present in API response.
            // Use cached value if available; otherwise fetch fresh from API.
            let resumeFileData = profile?.providerDetails?.resumeFileData;
            let resumeFileName = profile?.providerDetails?.resumeFileName;

            if (!resumeFileData && resumeFileName && phoneNumber) {
                // Fetch full profile directly from API, bypassing localStorage cache
                const norm = phoneNumber.replace(/\D/g, '').slice(-10);
                const res = await fetch(`/api/profiles?action=lookup&phone=${encodeURIComponent(norm)}`);
                if (res.ok) {
                    const full = await res.json();
                    resumeFileData = full?.providerDetails?.resumeFileData;
                    resumeFileName = full?.providerDetails?.resumeFileName || resumeFileName;
                }
            }

            if (resumeFileData && resumeFileName) {
                const link = document.createElement('a');
                link.href = resumeFileData;
                link.download = resumeFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            setResumeError('No resume has been uploaded yet.');
            setTimeout(() => setResumeError(''), 4000);
        } finally {
            setResumeDownloading(false);
        }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 2MB — Vercel has a 4.5MB request body limit; base64 adds ~33% overhead
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('File is too large. Please keep it under 2MB (compress the PDF if needed).');
        setTimeout(() => setUploadError(''), 5000);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (editData.providerDetails) {
          setEditData({
            ...editData,
            providerDetails: {
              ...editData.providerDetails,
              resumeFileData: base64,
              resumeFileName: file.name
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-row items-center justify-between animate-fade-in gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                 <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-lg shrink-0" style={{ backgroundColor: isProvider ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                    {(() => {
                      const parts = profile.basicInfo.fullName.trim().split(/\s+/);
                      return parts.length >= 2
                        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                        : parts[0][0].toUpperCase();
                    })()}
                 </div>
                 <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold flex items-center gap-2 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                        <span className="truncate">{profile.basicInfo.fullName}</span>
                        {/* Status badge for provider/client */}
                        <span className="shrink-0">
                            <StatusBadge status={profile.status} />
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                         <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>ID: {profile._id?.slice(0,8)}</span>
                         <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide" style={{ 
                            backgroundColor: isProvider ? 'var(--color-accent)' : 'var(--color-primary)', 
                            color: '#fff'
                         }}>
                             {isProvider ? 'Provider' : 'Client'}
                         </span>
                    </div>
                 </div>
            </div>
            <div className="flex gap-2 shrink-0">
                {/* Logout button: visible on desktop, hidden on mobile (shown in hamburger) */}
                <Button variant="outline" onClick={async () => {
                    try {
                        await signOutUser();
                        navigate('/');
                    } catch (error) {
                        console.error('[PROFILE] Logout error:', error);
                    }
                }} className="hidden md:flex">
                    <i className="fas fa-sign-out-alt mr-2"></i> Log Out
                </Button>
                {/* Hamburger toggle for mobile */}
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    aria-label="Toggle menu"
                >
                    <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>
        </div>

        {/* Payment Success Banner - Shown immediately after payment */}
        {showPaymentSuccess && (
            <div className="border-2 p-6 rounded-2xl flex items-start gap-4 animate-slide-up shadow-2xl mb-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-primary)' }}>
                {/* Celebration background effect */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(163, 177, 138, 0.5), transparent)' }}></div>
                
                <div className="text-3xl mt-1 z-10 animate-bounce" style={{ color: 'var(--color-primary)' }}>
                    <i className="fas fa-check-circle"></i>
                </div>
                <div className="flex-1 z-10">
                    <h3 className="font-bold text-xl flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <i className="fas fa-party-horn" style={{ color: 'var(--color-primary)' }}></i>
                        Payment Successful!
                    </h3>
                    <p className="mt-2 text-base" style={{ color: 'var(--color-text-primary)' }}>
                        You've successfully subscribed to the <strong>{selectedPlanName}</strong> plan. 🎉
                    </p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        Our team will reach out to you shortly to schedule your first session. Check your payment history below for details.
                    </p>
                    {paymentWarning && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                            <p className="text-yellow-800 text-sm flex items-start gap-2">
                                <i className="fas fa-exclamation-triangle mt-0.5"></i>
                                <span>{paymentWarning}</span>
                            </p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => setShowPaymentSuccess(false)}
                    className="text-green-700 hover:text-green-900 text-xl z-10 transition-colors"
                    title="Dismiss"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
        )}
        
        {/* Provider Pending Approval Banner */}
        {isProvider && profile.status === 'pending_verification' && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl shadow-md p-6 mb-6 animate-slide-up">
                <div className="flex items-start gap-4">
                    <div className="text-3xl text-yellow-600">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-xl text-yellow-900 flex items-center gap-2 mb-2">
                            <i className="fas fa-hourglass-half"></i>
                            Pending Approval
                        </h3>
                        <p className="text-yellow-800 text-base leading-relaxed">
                            Thank you for registering as a provider! Your profile is currently under review by our team. 
                            We'll notify you via email and phone once your profile has been approved.
                        </p>
                        <p className="text-yellow-700 text-sm mt-3">
                            <i className="fas fa-info-circle mr-1"></i>
                            This process typically takes 1-2 business days. You'll be able to start accepting clients once approved.
                        </p>
                    </div>
                </div>
            </div>
        )}
        
        {/* Edit Profile Bar */}

                {isProvider && (
                    <>
                    {/* Mobile hamburger dropdown */}
                    {mobileMenuOpen && (
                        <div className="md:hidden bg-white border border-slate-200 rounded-2xl shadow-lg p-4 animate-slide-up">
                            <div className="space-y-1">
                                {[
                                    { key: 'contact' as const, icon: 'fa-address-card', label: 'Contact Info' },
                                    { key: 'practice' as const, icon: 'fa-briefcase-medical', label: 'Practice Details' },
                                    { key: 'discover' as const, icon: 'fa-search', label: 'Discover Referrals' },
                                    { key: 'create' as const, icon: 'fa-plus-circle', label: 'Create Referrals' },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => { setProviderSection(item.key); setMobileMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${providerSection === item.key ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <i className={`fas ${item.icon} mr-2`}></i>
                                        {item.label}
                                    </button>
                                ))}
                                <div className="border-t border-slate-200 mt-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await signOutUser();
                                                navigate('/');
                                            } catch (error) {
                                                console.error('[PROFILE] Logout error:', error);
                                            }
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-transparent transition-colors"
                                    >
                                        <i className="fas fa-sign-out-alt mr-2"></i>
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 animate-slide-up items-start" style={{ animationDelay: '0.1s' }}>
                        {/* Desktop sidebar - hidden on mobile */}
                        <div className="hidden md:block md:col-span-1">
                            <div className="bg-white border border-slate-200 rounded-2xl md:rounded-r-none shadow-sm p-4 sticky top-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dashboard Sections</h3>
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setProviderSection('contact')}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${providerSection === 'contact' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <i className="fas fa-address-card mr-2"></i>
                                        Contact Info
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProviderSection('practice')}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${providerSection === 'practice' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <i className="fas fa-briefcase-medical mr-2"></i>
                                        Practice Details
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProviderSection('discover')}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${providerSection === 'discover' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <i className="fas fa-search mr-2"></i>
                                        Discover Referrals
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProviderSection('create')}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${providerSection === 'create' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <i className="fas fa-plus-circle mr-2"></i>
                                        Create Referrals
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            {providerSection === 'contact' && (
                                <div className="bg-white border border-slate-200 md:border-l-0 p-6 rounded-2xl md:rounded-l-none shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Contact Info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                                            <p className="text-slate-900 font-semibold">{profile.basicInfo.fullName}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                                            <p className="text-slate-900 font-semibold break-words">{profile.basicInfo.email || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:col-span-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                                            <p className="text-slate-900 font-semibold">{profile.basicInfo.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {providerSection === 'practice' && profile.providerDetails && editData.providerDetails && (
                                <div className="bg-white border border-slate-200 md:border-l-0 p-6 rounded-2xl md:rounded-l-none shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Practice Details</h3>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="text-xs px-3 py-1 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 font-medium">
                                                <i className="fas fa-edit mr-1.5"></i>Edit
                                            </button>
                                        ) : (
                                            <div className="flex flex-col items-end gap-2">
                                                {saveError && (
                                                    <p className="text-xs text-red-600 text-right">{saveError}</p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setIsEditing(false); setSaveError(''); }} className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 font-medium">
                                                        Cancel
                                                    </button>
                                                    <button onClick={handleSave} className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium">
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {isEditing ? (
                                            <div className="space-y-3 text-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                                                        <input
                                                            value={editData.providerDetails.qualification}
                                                            onChange={(e) => handleDetailChange('qualification', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Years Experience</label>
                                                        <input
                                                            value={editData.providerDetails.yearsExperience}
                                                            onChange={(e) => handleDetailChange('yearsExperience', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Mode</label>
                                                        <select
                                                            value={editData.providerDetails.mode}
                                                            onChange={(e) => handleDetailChange('mode', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        >
                                                            <option value="online">Online Only</option>
                                                            <option value="offline">In-Person Only</option>
                                                            <option value="both">Hybrid</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <TagInput
                                                    label="Specializations"
                                                    tags={editData.providerDetails.specializations}
                                                    onChange={(tags) => setEditData(prev => ({ ...prev, providerDetails: { ...prev.providerDetails!, specializations: tags } }))}
                                                    placeholder="e.g. Trauma, Anxiety, CBT..."
                                                    hint="Press Enter or comma to add"
                                                />
                                                <TagInput
                                                    label="Languages Spoken"
                                                    tags={editData.providerDetails.languages}
                                                    onChange={(tags) => setEditData(prev => ({ ...prev, providerDetails: { ...prev.providerDetails!, languages: tags } }))}
                                                    placeholder="e.g. English, Hindi, Marathi..."
                                                    hint="Press Enter or comma to add"
                                                />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Range (INR)</label>
                                                        <input
                                                            value={editData.providerDetails.budgetRange}
                                                            onChange={(e) => handleDetailChange('budgetRange', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Therapeutic Focus</label>
                                                        <input
                                                            value={editData.providerDetails.therapeuticFocus}
                                                            onChange={(e) => handleDetailChange('therapeuticFocus', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Licenses / Certifications</label>
                                                        <input
                                                            value={editData.providerDetails.licenses}
                                                            onChange={(e) => handleDetailChange('licenses', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                                                        <input
                                                            value={editData.providerDetails.website || ''}
                                                            onChange={(e) => handleDetailChange('website', e.target.value)}
                                                            placeholder="https://..."
                                                            className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Resume/CV</label>
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx"
                                                                onChange={handleResumeUpload}
                                                                className="hidden"
                                                                id="resume-edit-upload"
                                                            />
                                                            <label
                                                                htmlFor="resume-edit-upload"
                                                                className="flex items-center justify-between gap-2 bg-white border border-dashed border-slate-300 text-slate-600 rounded px-3 py-2 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all text-sm"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <i className="fas fa-cloud-upload-alt"></i>
                                                                    <span className="text-xs">
                                                                        {editData.providerDetails.resumeFileName || 'Upload PDF/DOC (max 5MB)'}
                                                                    </span>
                                                                </div>
                                                                {editData.providerDetails.resumeFileName && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setEditData({
                                                                                ...editData,
                                                                                providerDetails: {
                                                                                    ...editData.providerDetails!,
                                                                                    resumeFileData: '',
                                                                                    resumeFileName: ''
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-200"
                                                                    >
                                                                        <i className="fas fa-times text-xs"></i>
                                                                    </button>
                                                                )}
                                                            </label>
                                                        </div>
                                                        {uploadError && (
                                                            <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Therapy Style / Bio</label>
                                                    <textarea
                                                        rows={3}
                                                        value={editData.providerDetails.therapyStyle}
                                                        onChange={(e) => handleDetailChange('therapyStyle', e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <h5 className="text-sm text-slate-400 mb-1">Qualification</h5>
                                                        <p className="font-semibold text-slate-800">{profile.providerDetails.qualification}</p>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm text-slate-400 mb-1">Experience</h5>
                                                        <p className="font-semibold text-slate-800">{profile.providerDetails.yearsExperience} Years</p>
                                                    </div>
                                                </div>

                                                <div className="mb-6">
                                                    <h5 className="text-sm text-slate-400 mb-2">Specializations</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {profile.providerDetails.specializations.map((spec, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <h5 className="text-sm text-slate-400 mb-2">Practice Info</h5>
                                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                                        <div className="text-slate-600">Mode: <span className="text-slate-900 font-medium capitalize">{profile.providerDetails.mode}</span></div>
                                                        <div className="text-slate-600">Budget: <span className="text-slate-900 font-medium">{profile.providerDetails.budgetRange}</span></div>

                                                        {profile.providerDetails.therapeuticFocus && (
                                                            <div className="col-span-2 text-slate-600">Focus: <span className="text-slate-900 font-medium">{profile.providerDetails.therapeuticFocus}</span></div>
                                                        )}

                                                        {profile.providerDetails.languages && profile.providerDetails.languages.length > 0 && (
                                                            <div className="col-span-2 text-slate-600">
                                                                Languages: <span className="text-slate-900 font-medium">{profile.providerDetails.languages.join(', ')}</span>
                                                            </div>
                                                        )}

                                                        {profile.providerDetails.clientType && profile.providerDetails.clientType.length > 0 && (
                                                            <div className="col-span-2">
                                                                <p className="text-slate-600 mb-1">Client Types:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {profile.providerDetails.clientType.map((type, idx) => (
                                                                        <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                                                                            {type}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {profile.providerDetails.licenses && (
                                                            <div className="col-span-2 text-slate-600">
                                                                Licenses: <span className="text-slate-900 font-medium">{profile.providerDetails.licenses}</span>
                                                            </div>
                                                        )}

                                                        {profile.providerDetails.resumeFileName && (
                                                            <div className="col-span-2 mt-2">
                                                                <button
                                                                    onClick={handleDownloadResume}
                                                                    disabled={resumeDownloading}
                                                                    className="text-teal-600 hover:underline flex items-center disabled:opacity-60"
                                                                >
                                                                    {resumeDownloading
                                                                        ? <><i className="fas fa-spinner fa-spin mr-1"></i> Loading resume...</>
                                                                        : <><i className="fas fa-file-pdf mr-1"></i> Download Resume ({profile.providerDetails.resumeFileName})</>}
                                                                </button>
                                                                {resumeError && (
                                                                    <p className="text-xs text-red-600 mt-1">{resumeError}</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {profile.providerDetails.website && (() => {
                                                            let url = profile.providerDetails.website;
                                                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                                                url = 'https://' + url;
                                                            }
                                                            return (
                                                                <div className="col-span-2 mt-2">
                                                                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                                        <i className="fas fa-link mr-1"></i> Visit Website
                                                                    </a>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {providerSection === 'discover' && phoneNumber && (
                                <div className="bg-white border border-slate-200 md:border-l-0 rounded-2xl md:rounded-l-none shadow-sm overflow-hidden">
                                    <ProviderReferralDiscover phoneNumber={phoneNumber} profile={profile} />
                                </div>
                            )}

                            {providerSection === 'create' && phoneNumber && (
                                <div className="bg-white border border-slate-200 md:border-l-0 rounded-2xl md:rounded-l-none shadow-sm">
                                    <div className="p-6">
                                        <ReferralTab phoneNumber={phoneNumber} role={profile.role} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                )}

                {/* Client Dashboard */}
                {!isProvider && (
                    <>
                    {/* Mobile hamburger dropdown for clients */}
                    {mobileMenuOpen && (
                        <div className="md:hidden bg-white border border-slate-200 rounded-2xl shadow-lg p-4 animate-slide-up">
                            <div className="space-y-1">
                                {[
                                    { key: 'basic' as const, icon: 'fa-address-card', label: 'Basic Info' },
                                    { key: 'personal' as const, icon: 'fa-user', label: 'Personal Info' },
                                    { key: 'payments' as const, icon: 'fa-receipt', label: 'Payments' },
                                    { key: 'assessments' as const, icon: 'fa-brain', label: 'Assessments' },
                                    { key: 'therapists' as const, icon: 'fa-search', label: 'Find Therapists' },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => { setClientSection(item.key); setMobileMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${clientSection === item.key ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <i className={`fas ${item.icon} mr-2`}></i>
                                        {item.label}
                                    </button>
                                ))}
                                <div className="border-t border-slate-200 mt-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await signOutUser();
                                                navigate('/');
                                            } catch (error) {
                                                console.error('[PROFILE] Logout error:', error);
                                            }
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-transparent transition-colors"
                                    >
                                        <i className="fas fa-sign-out-alt mr-2"></i>
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 animate-slide-up items-start" style={{ animationDelay: '0.1s' }}>
                        {/* Desktop sidebar - hidden on mobile */}
                        <div className="hidden md:block md:col-span-1">
                            <div className="bg-white border border-slate-200 rounded-2xl md:rounded-r-none shadow-sm p-4 sticky top-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dashboard Sections</h3>
                                <div className="space-y-2">
                                    {[
                                        { key: 'basic' as const, icon: 'fa-address-card', label: 'Basic Info' },
                                        { key: 'personal' as const, icon: 'fa-user', label: 'Personal Info' },
                                        { key: 'payments' as const, icon: 'fa-receipt', label: 'Payments' },
                                        { key: 'assessments' as const, icon: 'fa-brain', label: 'Assessments' },
                                        { key: 'therapists' as const, icon: 'fa-search', label: 'Find Therapists' },
                                    ].map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setClientSection(item.key)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${clientSection === item.key ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            <i className={`fas ${item.icon} mr-2`}></i>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right content panel */}
                        <div className="md:col-span-3">
                            {/* Basic Info Section */}
                            {clientSection === 'basic' && (
                                <div className="bg-white border border-slate-200 md:border-l-0 p-6 rounded-2xl md:rounded-l-none shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Basic Info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                                            <p className="text-slate-900 font-semibold">{profile.basicInfo.fullName}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                                            <p className="text-slate-900 font-semibold break-words">{profile.basicInfo.email || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:col-span-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                                            <p className="text-slate-900 font-semibold">{profile.basicInfo.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Personal Info Section */}
                            {clientSection === 'personal' && (
                                <div className="bg-white border border-slate-200 md:border-l-0 p-6 rounded-2xl md:rounded-l-none shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Personal Info</h3>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="text-xs px-3 py-1 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 font-medium">
                                                <i className="fas fa-edit mr-1.5"></i>Edit
                                            </button>
                                        ) : (
                                            <div className="flex flex-col items-end gap-2">
                                                {saveError && (
                                                    <p className="text-xs text-red-600 text-right">{saveError}</p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setIsEditing(false); setEditData(profile); setSaveError(''); }} className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 font-medium">
                                                        Cancel
                                                    </button>
                                                    <button onClick={handleSave} className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium">
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    value={editData.basicInfo?.location || ''}
                                                    onChange={(e) => setEditData({
                                                        ...editData,
                                                        basicInfo: { ...editData.basicInfo!, location: e.target.value }
                                                    })}
                                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                    placeholder="Your city or area"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">What brings you here?</label>
                                                <textarea
                                                    rows={3}
                                                    value={editData.clinical?.presentingProblem || ''}
                                                    onChange={(e) => setEditData({
                                                        ...editData,
                                                        clinical: { ...editData.clinical, presentingProblem: e.target.value }
                                                    })}
                                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 resize-none"
                                                    placeholder="Describe what you're looking for help with..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Medications (if any)</label>
                                                <input
                                                    value={editData.clinical?.medications || ''}
                                                    onChange={(e) => setEditData({
                                                        ...editData,
                                                        clinical: { ...editData.clinical, medications: e.target.value }
                                                    })}
                                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                    placeholder="List any medications..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Mode</label>
                                                    <select
                                                        value={editData.preferences?.mode || ''}
                                                        onChange={(e) => setEditData({
                                                            ...editData,
                                                            preferences: { ...editData.preferences, mode: e.target.value }
                                                        })}
                                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="online">Online Only</option>
                                                        <option value="offline">In-Person Only</option>
                                                        <option value="both">Hybrid</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (INR)</label>
                                                    <input
                                                        value={editData.preferences?.budget || ''}
                                                        onChange={(e) => setEditData({
                                                            ...editData,
                                                            preferences: { ...editData.preferences, budget: e.target.value }
                                                        })}
                                                        className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                                                        placeholder="e.g., 500-1000"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Location</p>
                                                <p className="text-slate-900 font-semibold">{profile.basicInfo.location || '-'}</p>
                                            </div>
                                            {profile.clinical?.presentingProblem && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wide">What brings you here?</p>
                                                        <button
                                                            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                                                            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                                            title={showSensitiveInfo ? "Hide sensitive information" : "Show sensitive information"}
                                                        >
                                                            <i className={`fas ${showSensitiveInfo ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                                        </button>
                                                    </div>
                                                    {showSensitiveInfo ? (
                                                        <p className="text-slate-900 italic">"{profile.clinical.presentingProblem}"</p>
                                                    ) : (
                                                        <p className="text-slate-400 italic select-none">••••••••••••••••</p>
                                                    )}
                                                </div>
                                            )}
                                            {profile.clinical?.medications && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Medications</p>
                                                    <p className="text-slate-900">{profile.clinical.medications}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {profile.preferences?.mode && (
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Preferred Mode</p>
                                                        <p className="text-slate-900 font-semibold capitalize">{profile.preferences.mode}</p>
                                                    </div>
                                                )}
                                                {profile.preferences?.budget && (
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Budget (INR)</p>
                                                        <p className="text-slate-900 font-semibold">{profile.preferences.budget}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {!profile.clinical?.presentingProblem && !profile.clinical?.medications && !profile.preferences?.mode && !profile.preferences?.budget && !profile.basicInfo.location && (
                                                <p className="text-slate-400 italic">No personal information added yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payments Section */}
                            {clientSection === 'payments' && (
                                <div className="bg-white border border-slate-200 md:border-l-0 p-6 rounded-2xl md:rounded-l-none shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Payment History</h3>
                                    {profile.payments && profile.payments.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="border-b border-slate-200">
                                                        <tr className="text-left text-xs text-slate-500 uppercase">
                                                            <th className="pb-2 font-semibold">Plan</th>
                                                            <th className="pb-2 font-semibold">Date</th>
                                                            <th className="pb-2 font-semibold">Amount</th>
                                                            <th className="pb-2 font-semibold">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {profile.payments.map((payment, index) => (
                                                            <tr key={`${payment.planId}-${index}`} className="hover:bg-slate-50">
                                                                <td className="py-3">
                                                                    <span className="font-medium text-slate-900">{payment.planName}</span>
                                                                </td>
                                                                <td className="py-3 text-slate-600">
                                                                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                                                                </td>
                                                                <td className="py-3 font-semibold text-slate-900">
                                                                    ₹{payment.amount}
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                                        payment.status === 'success'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : payment.status === 'failed'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                        {payment.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                                                <Button 
                                                    onClick={() => navigate('/plans')}
                                                    className="shadow-sm"
                                                    style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                                                >
                                                    Buy Plan
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                                <i className="fas fa-receipt text-slate-400 text-lg"></i>
                                            </div>
                                            <p className="text-slate-500 mb-4">No payments yet</p>
                                            <Button 
                                                onClick={() => navigate('/plans')}
                                                className="shadow-sm"
                                                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                                            >
                                                <i className="fas fa-search mr-2"></i>
                                                Explore Plans
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Assessments Section */}
                            {clientSection === 'assessments' && (
                                <div className="bg-white border border-slate-200 md:border-l-0 p-6 rounded-2xl md:rounded-l-none shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Assessments</h3>
                                    <div className="space-y-4">
                                        {/* Therapy Guide Card */}
                                        <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group" onClick={() => window.open('/therapy-guide', '_blank', 'noopener,noreferrer')}>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(163, 177, 138, 0.15)' }}>
                                                <i className="fas fa-brain text-xl" style={{ color: 'var(--color-primary)' }}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-primary transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                                                    What kind of therapy should you use?
                                                </h4>
                                                <p className="text-sm text-slate-500 leading-relaxed">
                                                    Answer a few quick questions to find which therapy approach fits your needs — CBT, ACT, DBT, psychodynamic, and more.
                                                </p>
                                                <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                                                    Take the questionnaire
                                                    <i className="fas fa-arrow-right text-xs"></i>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Snapshot Feature Card */}
                                        <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50 opacity-75">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                                                <i className="fas fa-camera text-xl text-slate-400"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-slate-600">Psychological Snapshot</h4>
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">Coming Soon</span>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed">
                                                    Get an AI-generated snapshot of your psychological profile and personality patterns.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Find Therapists Section */}
                            {clientSection === 'therapists' && (
                                <div className="bg-white border border-slate-200 md:border-l-0 rounded-2xl md:rounded-l-none shadow-sm">
                                    {(!profile.payments || profile.payments.length === 0) && (
                                        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-slate-200 p-5 rounded-t-2xl md:rounded-tl-none flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                                                    <i className="fas fa-heart text-lg" style={{ color: 'var(--color-primary)' }}></i>
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-800">
                                                    Find a Therapist meant for you
                                                </h3>
                                            </div>
                                            <Button 
                                                onClick={() => navigate('/plans')}
                                                className="shadow-sm whitespace-nowrap"
                                                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                                            >
                                                <i className="fas fa-search mr-2"></i>
                                                Explore Plans
                                            </Button>
                                        </div>
                                    )}
                                    {phoneNumber && (
                                        <div className="p-6">
                                            <ReferralTab phoneNumber={phoneNumber} role={profile.role} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                )}

                {/* Chat support removed as requested */}
      </div>
    </div>
  );
};