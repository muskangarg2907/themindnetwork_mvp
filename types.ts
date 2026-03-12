
export type UserRole = 'client' | 'provider';

export interface PaymentDetails {
  planId: string;
  planName: string;
  amount: number; // Amount in rupees
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMethod?: string; // upi, card, netbanking, wallet
  paidAt?: string;
  createdAt: string;
  errorMessage?: string;
}

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
    priorExperience?: string;
    medications: string;
    riskFactors: string[]; 
  };
  preferences?: {
    providerGenderPreference: string;
    mode?: string; // online, offline, both
    budget?: string;
    bio?: string; // User's self-description
  };
  // Payment history (for clients) - stores all payments made
  payments?: PaymentDetails[];
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
  CHATBOT_INTAKE = 2,
  CLINICAL_INTAKE = 3,
  CLIENT_PREFERENCES = 4,
  // Provider Path
  PROVIDER_PROFESSIONAL = 5,
  PROVIDER_PRACTICE = 6,
  
  COMPLETED = 99
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

// REFERRAL SYSTEM TYPES
export interface ReferralRequest {
  _id?: string;
  requestId: string; // 8-char random ID for public sharing
  userId: string; // Phone number of the client creating the request
  clientInitials?: string;
  clientType: 'individual' | 'couple' | 'group';
  clientAge?: number;
  concerns: string;
  genderPreference: string[]; // ["Female", "Male", "Non-Binary", "Any"]
  languages: string;
  mode: string[]; // ["Online", "Offline", "Hybrid"]
  location?: string; // Required if offline/hybrid
  budgetRange: string;
  urgency: 'Low' | 'Medium' | 'High';
  notes?: string;
  status: 'active' | 'closed';
  applicantCount?: number;
  selectedProviderId?: string;
  selectedAt?: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

export interface ReferralApplication {
  _id?: string;
  requestId: string;
  applicantId: string; // Provider phone number
  applicantName?: string;
  applicantExp?: string;
  applicantDegrees?: string;
  applicantModalities?: string[];
  applicantFee?: string;
  applicantLanguages?: string[];
  applicantLocation?: string;
  appliedAt: string;
}

export interface ReferralShortlist {
  _id?: string;
  requestId: string;
  userId: string; // Client phone number
  applicantId: string; // Provider phone number
  rank: number; // 1-4 (user can save up to 4)
  addedAt: string;
}
