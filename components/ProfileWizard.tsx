import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, UserRole, WizardStep } from '../types';
import { StepBasicInfo } from './wizard/StepBasicInfo';
import { StepClinical } from './wizard/StepProfessional';
import { StepPreferences } from './wizard/StepPreferences';
import { StepRoleSelection } from './wizard/StepRoleSelection';
import { StepProviderProfessional } from './wizard/StepProviderProfessional';
import { StepProviderPractice } from './wizard/StepProviderPractice';
import { StepChatbotIntake } from './wizard/StepChatbotIntake';
import { sanitizeForStorage, secureLog } from '../services/security';
import { Button } from './ui/Button';
import { generateProfileSummary, generateProviderBio } from '../services/geminiService';
import { saveProfile } from '../services/api';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const INITIAL_PROFILE: UserProfile = {
  status: 'draft',
  role: 'client', // Default, but will be set by user
  basicInfo: { fullName: '', email: '', phone: '', dob: '', location: '', gender: '' },
  clinical: { presentingProblem: '', currentMood: '', hasPriorTherapy: false, medications: '', riskFactors: [] },
  preferences: { providerGenderPreference: '' },
  providerDetails: { 
      qualification: '', yearsExperience: '', specializations: [], mode: 'online', 
      languages: [], clientType: [], budgetRange: '', licenses: '', 
      therapeuticFocus: '', therapyStyle: '', resumeLink: '' 
  },
  createdAt: new Date().toISOString()
};

export const ProfileWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedRole = (location.state as any)?.preselectedRole as UserRole | undefined;
  const phoneFromAuth = (location.state as any)?.phone as string | undefined;
  
  // Determine initial step and role based on preselection
  const getInitialStep = () => {
    if (preselectedRole === 'client') {
      return WizardStep.BASIC_INFO;
    }
    return WizardStep.ROLE_SELECTION;
  };
  
  const getInitialProfile = () => {
    const baseProfile = { ...INITIAL_PROFILE };
    if (preselectedRole) {
      baseProfile.role = preselectedRole;
    }
    if (phoneFromAuth) {
      baseProfile.basicInfo.phone = phoneFromAuth;
    }
    return baseProfile;
  };
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(getInitialStep());
  const [profileData, setProfileData] = useState<UserProfile>(getInitialProfile());
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user already has a profile
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.phoneNumber) {
        try {
          const response = await fetch(`/api/profiles?action=lookup&phone=${encodeURIComponent(user.phoneNumber)}`);
          if (response.ok) {
            const profile = await response.json();
            console.log('[ProfileWizard] User already has profile:', profile);
            setExistingProfile(profile);
          }
        } catch (err) {
          console.error('[ProfileWizard] Error checking profile:', err);
        }
      }
      setCheckingProfile(false);
    });

    return () => unsubscribe();
  }, []);

  // Add keyboard listener for Enter key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Exclude role selection AND chatbot intake from Enter key handling
      // Chatbot has its own Enter key handler
      if (e.key === 'Enter' && currentStep !== WizardStep.ROLE_SELECTION && currentStep !== WizardStep.CHATBOT_INTAKE) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, profileData]);

  const updateData = (section: keyof UserProfile, payload: any) => {
    setProfileData(prev => ({
      ...prev,
      [section]: payload
    }));
    setErrorMsg(''); // Clear error on change
  };

  // Show loading while checking for existing profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--color-text-muted)' }}>Checking your profile...</p>
        </div>
      </div>
    );
  }

  // If user already has a profile, show message and redirect
  if (existingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center" style={{ borderWidth: '1px', borderColor: 'var(--color-secondary)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-accent)' }}>
            <i className="fas fa-user-check text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Profile Already Exists</h2>
          <p className="mb-2" style={{ color: 'var(--color-text-muted)' }}>You already have a profile with us.</p>
          {existingProfile.status && (
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                existingProfile.status === 'approved' ? 'bg-green-100 text-green-700' :
                existingProfile.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                Status: {existingProfile.status}
              </span>
            </div>
          )}
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {existingProfile.status === 'approved' && 'Your profile has been approved and is active.'}
            {existingProfile.status === 'pending' && 'Your profile is pending approval from our team.'}
            {existingProfile.status === 'rejected' && 'Your profile was not approved. Please contact support for details.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <i className="fas fa-eye mr-2"></i>
              View My Profile
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md"
              style={{ backgroundColor: 'var(--color-accent)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
            >
              <i className="fas fa-home mr-2"></i>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRoleSelect = (role: UserRole) => {
      setProfileData(prev => ({ ...prev, role }));
      setCurrentStep(WizardStep.BASIC_INFO);
  };

  const validateStep = (step: WizardStep): boolean => {
      if (step === WizardStep.BASIC_INFO) {
          const { fullName, email, phone, dob } = profileData.basicInfo;
          if (!fullName || !email || !phone || !dob) {
              setErrorMsg('Please fill in all mandatory fields (Name, DOB, Email, Phone).');
              return false;
          }
      }
      if (step === WizardStep.PROVIDER_PROFESSIONAL) {
          const { qualification, yearsExperience, specializations } = profileData.providerDetails || {};
          if (!qualification || !yearsExperience || !specializations?.length) {
              setErrorMsg('Please fill in all mandatory fields (Qualification, Experience, Specialization).');
              return false;
          }
      }
      if (step === WizardStep.PROVIDER_PRACTICE) {
          const { mode, budgetRange } = profileData.providerDetails || {};
          if (!mode || !budgetRange) {
              setErrorMsg('Please fill in all mandatory fields (Mode, Budget Range).');
              return false;
          }
      }
      return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Determine next step based on role
    let nextStep = currentStep;

    if (currentStep === WizardStep.BASIC_INFO) {
        if (profileData.role === 'client') {
            nextStep = WizardStep.CHATBOT_INTAKE;
        } else {
            nextStep = WizardStep.PROVIDER_PROFESSIONAL;
        }
    } else if (currentStep === WizardStep.CHATBOT_INTAKE) {
        // After chatbot, skip preferences and submit directly
        await handleSubmit();
        return;
    } else if (currentStep === WizardStep.CLINICAL_INTAKE) {
        nextStep = WizardStep.CLIENT_PREFERENCES;
    } else if (currentStep === WizardStep.PROVIDER_PROFESSIONAL) {
        nextStep = WizardStep.PROVIDER_PRACTICE;
    } else if (currentStep === WizardStep.CLIENT_PREFERENCES || currentStep === WizardStep.PROVIDER_PRACTICE) {
        // Final Submission
        await handleSubmit();
        return;
    } else {
        nextStep = nextStep + 1;
    }

    setCurrentStep(nextStep);
  };

  const handleSubmit = async () => {
    setIsGenerating(true);

    const finalProfile: UserProfile = {
      ...profileData,
      status: 'pending_verification',
      aiSummary: '' // Bio will be added later via profile editing
    };


    try {
      const saved = await saveProfile(finalProfile);
      // Sanitize before storing to protect health data
      localStorage.setItem('userProfile', JSON.stringify(sanitizeForStorage(saved)));
      // Ensure phone is available for lookup flows
      try {
        const phoneToStore = saved?.basicInfo?.phone;
        if (phoneToStore) localStorage.setItem('userPhone', phoneToStore);
                        } catch (e) {
                            console.warn('Failed to persist userPhone locally', e);
                        }
                        
                        secureLog('[WIZARD] Profile created successfully');
                        
                        // Notify admin interface that a new profile was created
                        try {
                            await fetch('/api/admin?action=notify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ source: 'profile_wizard' })
                            });
                        } catch (e) {
                            console.warn('Failed to notify admin:', e);
                        }
                        setIsGenerating(false);
                        // Pass flag to ProfileView to disable polling briefly after creation
                        navigate('/profile', { state: { isNewlyCreated: true } });
        } catch (err: any) {
            console.error('Save profile failed:', err);
            const msg = err?.message || 'Failed to save profile. Please try again later.';
            setErrorMsg(msg);
            setIsGenerating(false);
        }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep === WizardStep.BASIC_INFO) {
        setCurrentStep(WizardStep.ROLE_SELECTION);
    } else if (currentStep === WizardStep.CHATBOT_INTAKE) {
        setCurrentStep(WizardStep.BASIC_INFO);
    } else if (currentStep === WizardStep.CLINICAL_INTAKE) {
        setCurrentStep(WizardStep.BASIC_INFO);
    } else if (currentStep === WizardStep.CLIENT_PREFERENCES) {
        setCurrentStep(WizardStep.CLINICAL_INTAKE);
    } else if (currentStep === WizardStep.PROVIDER_PROFESSIONAL) {
        setCurrentStep(WizardStep.BASIC_INFO);
    } else if (currentStep === WizardStep.PROVIDER_PRACTICE) {
        setCurrentStep(WizardStep.PROVIDER_PROFESSIONAL);
    } else if (currentStep === WizardStep.ROLE_SELECTION) {
        // Go back to login page
        navigate('/login');
    }
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case WizardStep.ROLE_SELECTION:
        return <StepRoleSelection setRole={handleRoleSelect} />;
      case WizardStep.BASIC_INFO:
        return <StepBasicInfo data={profileData} updateData={updateData} />;
      case WizardStep.CHATBOT_INTAKE:
        return <StepChatbotIntake data={profileData} updateData={updateData} onComplete={handleNext} />;
      case WizardStep.CLINICAL_INTAKE:
        return <StepClinical data={profileData} updateData={updateData} />;
      case WizardStep.CLIENT_PREFERENCES:
        return <StepPreferences data={profileData} updateData={updateData} />;
      case WizardStep.PROVIDER_PROFESSIONAL:
        return <StepProviderProfessional data={profileData} updateData={updateData} />;
      case WizardStep.PROVIDER_PRACTICE:
        return <StepProviderPractice data={profileData} updateData={updateData} />;
      default:
        return null;
    }
  };

  // Progress Bar logic
  const isClient = profileData.role === 'client';
  const totalSteps = isClient ? 2 : 3; // For clients: Basic + Chatbot. For providers: Basic, Prof, Practice
  
  let currentStepIndex = 0;
  if (currentStep === WizardStep.BASIC_INFO) currentStepIndex = 1;
  if (currentStep === WizardStep.CHATBOT_INTAKE) currentStepIndex = 2;
  if (currentStep === WizardStep.CLINICAL_INTAKE || currentStep === WizardStep.PROVIDER_PROFESSIONAL) currentStepIndex = 2;
  if (currentStep === WizardStep.CLIENT_PREFERENCES || currentStep === WizardStep.PROVIDER_PRACTICE) currentStepIndex = 3;

  const progress = (currentStepIndex / totalSteps) * 100;

  const isFinalStep = currentStep === WizardStep.CLIENT_PREFERENCES || currentStep === WizardStep.PROVIDER_PRACTICE;
  const isChatbotStep = currentStep === WizardStep.CHATBOT_INTAKE;
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[800px]" style={{ borderWidth: '1px', borderColor: 'var(--color-secondary)' }}>
        
        {/* Header */}
        {currentStep !== WizardStep.ROLE_SELECTION && (
            <div className="bg-white p-6" style={{ borderBottomWidth: '1px', borderBottomColor: 'var(--color-secondary)' }}>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--color-primary)' }}>Step {currentStepIndex} of {totalSteps}</span>
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--color-text-muted)' }}>
                        {isClient ? 'Client Intake' : 'Provider Onboarding'}
                    </span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-secondary)' }}>
                    <div 
                        className="h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }}
                    ></div>
                </div>
            </div>
        )}

        {/* Role Selection Header with Back Button */}
        {currentStep === WizardStep.ROLE_SELECTION && (
            <div className="bg-white p-6" style={{ borderBottomWidth: '1px', borderBottomColor: 'var(--color-secondary)' }}>
                <button 
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                >
                    <i className="fas fa-arrow-left"></i> Back to Login
                </button>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
            {getStepComponent()}
        </div>

        {/* Error Message */}
        {errorMsg && (
            <div className="px-8 pb-2">
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {errorMsg}
                </div>
            </div>
        )}

        {/* Footer */}
        {currentStep !== WizardStep.ROLE_SELECTION && !isChatbotStep && (
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                <Button 
                    variant="outline" 
                    onClick={handleBack} 
                >
                    Back
                </Button>
                
                <Button 
                    onClick={handleNext}
                    isLoading={isGenerating}
                >
                    {isFinalStep ? 'Submit Profile' : 'Next Step'}
                    {!isFinalStep && <i className="fas fa-arrow-right ml-2 text-xs"></i>}
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};