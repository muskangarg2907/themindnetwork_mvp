import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, UserRole, WizardStep } from '../types';
import { StepBasicInfo } from './wizard/StepBasicInfo';
import { StepClinical } from './wizard/StepProfessional';
import { StepPreferences } from './wizard/StepPreferences';
import { StepRoleSelection } from './wizard/StepRoleSelection';
import { StepProviderProfessional } from './wizard/StepProviderProfessional';
import { StepProviderPractice } from './wizard/StepProviderPractice';
import { Button } from './ui/Button';
import { generateProfileSummary, generateProviderBio } from '../services/geminiService';
import { saveProfile } from '../services/api';

const INITIAL_PROFILE: UserProfile = {
  id: crypto.randomUUID(),
  status: 'draft',
  role: 'client', // Default, but will be set by user
  basicInfo: { fullName: '', email: '', phone: '', dob: '', location: '', gender: '' },
  clinical: { presentingProblem: '', currentMood: '', hasPriorTherapy: false, medications: '', riskFactors: [] },
  preferences: { communicationStyle: '', providerGenderPreference: '', insuranceProvider: '' },
  providerDetails: { 
      qualification: '', yearsExperience: '', specializations: [], mode: 'online', 
      languages: [], clientType: [], budgetRange: '', licenses: '', 
      therapeuticFocus: '', therapyStyle: '', resumeLink: '' 
  },
  createdAt: new Date().toISOString()
};

export const ProfileWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.ROLE_SELECTION);
  const [profileData, setProfileData] = useState<UserProfile>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showManualBioInput, setShowManualBioInput] = useState(false);
  const [manualBio, setManualBio] = useState('');

  // Add keyboard listener for Enter key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && currentStep !== WizardStep.ROLE_SELECTION) {
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
            nextStep = WizardStep.CLINICAL_INTAKE;
        } else {
            nextStep = WizardStep.PROVIDER_PROFESSIONAL;
        }
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
    let summary = '';
    
    // If manual bio input is shown, use it
    if (showManualBioInput && manualBio.trim()) {
      summary = manualBio.trim();
    } else {
      // Try AI generation
      if (profileData.role === 'client') {
        summary = await generateProfileSummary(profileData);
      } else {
        summary = await generateProviderBio(profileData);
      }
      
      // Check if AI generation failed
      if (!summary || summary.includes('failed') || summary.includes('unavailable') || summary.includes('not available')) {
        setIsGenerating(false);
        setShowManualBioInput(true);
        return; // Wait for user to enter manual bio
      }
    }
    
    const finalProfile: UserProfile = {
        ...profileData,
        status: 'pending_verification',
        aiSummary: summary
    };

        try {
                        const saved = await saveProfile(finalProfile);
                        // Optionally keep a local copy
                        localStorage.setItem('userProfile', JSON.stringify(saved));
                        // Ensure phone is available for lookup flows
                        try {
                            const phoneToStore = saved?.basicInfo?.phone;
                            if (phoneToStore) localStorage.setItem('userPhone', phoneToStore);
                        } catch (e) {
                            console.warn('Failed to persist userPhone locally', e);
                        }
                        // Notify admin interface that a new profile was created
                        try {
                            await fetch('/api/admin/notify', {
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
    } else if (currentStep === WizardStep.CLINICAL_INTAKE) {
        setCurrentStep(WizardStep.BASIC_INFO);
    } else if (currentStep === WizardStep.CLIENT_PREFERENCES) {
        setCurrentStep(WizardStep.CLINICAL_INTAKE);
    } else if (currentStep === WizardStep.PROVIDER_PROFESSIONAL) {
        setCurrentStep(WizardStep.BASIC_INFO);
    } else if (currentStep === WizardStep.PROVIDER_PRACTICE) {
        setCurrentStep(WizardStep.PROVIDER_PROFESSIONAL);
    }
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case WizardStep.ROLE_SELECTION:
        return <StepRoleSelection setRole={handleRoleSelect} />;
      case WizardStep.BASIC_INFO:
        return <StepBasicInfo data={profileData} updateData={updateData} />;
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
  const totalSteps = isClient ? 3 : 3; // Basic, Clinical, Prefs OR Basic, Prof, Practice
  
  let currentStepIndex = 0;
  if (currentStep === WizardStep.BASIC_INFO) currentStepIndex = 1;
  if (currentStep === WizardStep.CLINICAL_INTAKE || currentStep === WizardStep.PROVIDER_PROFESSIONAL) currentStepIndex = 2;
  if (currentStep === WizardStep.CLIENT_PREFERENCES || currentStep === WizardStep.PROVIDER_PRACTICE) currentStepIndex = 3;

  const progress = (currentStepIndex / totalSteps) * 100;

  const isFinalStep = currentStep === WizardStep.CLIENT_PREFERENCES || currentStep === WizardStep.PROVIDER_PRACTICE;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[800px]">
        
        {/* Header */}
        {currentStep !== WizardStep.ROLE_SELECTION && (
            <div className="bg-white p-6 border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold tracking-wider text-teal-600 uppercase">Step {currentStepIndex} of {totalSteps}</span>
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                        {isClient ? 'Client Intake' : 'Provider Onboarding'}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
            {showManualBioInput ? (
              <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    <i className="fas fa-pen"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Write Your {profileData.role === 'provider' ? 'Bio' : 'Summary'}</h2>
                  <p className="text-slate-500">AI generation is currently unavailable. Please write a brief professional {profileData.role === 'provider' ? 'bio' : 'summary'} about yourself.</p>
                </div>
                
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Professional {profileData.role === 'provider' ? 'Bio' : 'Summary'} *
                  </label>
                  <textarea
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
                    placeholder={profileData.role === 'provider' 
                      ? "Example: I am a licensed therapist specializing in anxiety and depression. I use evidence-based approaches to help clients achieve their goals. I work with individuals and couples in a supportive environment."
                      : "Example: I'm seeking support for managing stress and anxiety. I prefer online sessions and am looking for a therapist who specializes in cognitive behavioral therapy."
                    }
                    value={manualBio}
                    onChange={(e) => setManualBio(e.target.value)}
                    rows={6}
                    maxLength={500}
                  />
                  <div className="text-xs text-slate-500 ml-1">
                    {manualBio.length}/500 characters
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowManualBioInput(false);
                      setManualBio('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!manualBio.trim() || manualBio.trim().length < 50}
                    isLoading={isGenerating}
                    className="flex-1"
                  >
                    Continue with Manual {profileData.role === 'provider' ? 'Bio' : 'Summary'}
                  </Button>
                </div>
              </div>
            ) : (
              getStepComponent()
            )}
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
        {currentStep !== WizardStep.ROLE_SELECTION && !showManualBioInput && (
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