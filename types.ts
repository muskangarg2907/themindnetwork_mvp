
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
    bio?: string;
  };
  // Payment information (for clients)
  payment?: PaymentDetails;
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
