
export type UserRole = 'client' | 'provider';

export interface UserProfile {
  _id?: string;
  role: UserRole; 
  status: 'draft' | 'pending_verification' | 'verified';
  basicInfo: {
    fullName: string;
    email: string;
    phone: string;
    dob?: string;   
    location: string;
    gender?: string; // Added for both
  };
  // Client specific data
  clinical?: {
    presentingProblem: string;
    currentMood: string;
    hasPriorTherapy: boolean;
    medications: string;
    riskFactors: string[]; 
  };
  preferences?: {
    providerGenderPreference: string;
  };
  // Provider specific data
  providerDetails?: {
    qualification: string;
    yearsExperience: string;
    specializations: string[]; // Certifications/Specializations
    mode: 'online' | 'offline' | 'both';
    offlineLocation?: string; // City and area
    languages: string[];
    clientType: string[]; // individuals/family/couples/group
    budgetRange: string;
    website?: string; // or LinkedIn
    licenses: string;
    therapeuticFocus: string;
    therapyStyle: string;
    resumeLink?: string;
    resumeFileName?: string; // Added for file upload
    resumeFileData?: string; // Base64 data
  };
  aiSummary?: string; 
  createdAt: string;
}

export enum WizardStep {
  ROLE_SELECTION = 0,
  BASIC_INFO = 1,
  // Client Path
  CLINICAL_INTAKE = 2,
  CLIENT_PREFERENCES = 3,
  // Provider Path
  PROVIDER_PROFESSIONAL = 4,
  PROVIDER_PRACTICE = 5,
  
  COMPLETED = 99
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}
