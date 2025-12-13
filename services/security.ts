// Security utility functions for handling sensitive data

/**
 * Sanitizes a user profile before storing in localStorage
 * Removes sensitive health/clinical data to prevent exposure in browser storage
 * 
 * @param profile - Full user profile
 * @returns Sanitized profile safe for localStorage
 */
export function sanitizeForStorage(profile: any) {
  if (!profile) return null;

  const sanitized = {
    id: profile.id || profile._id,
    status: profile.status,
    role: profile.role,
    basicInfo: {
      fullName: profile.basicInfo?.fullName,
      email: profile.basicInfo?.email,
      phone: profile.basicInfo?.phone,
      location: profile.basicInfo?.location,
      gender: profile.basicInfo?.gender,
      // Removed: dob (can be used for identity theft)
    },
    preferences: {
      mode: profile.preferences?.mode,
      providerGenderPreference: profile.preferences?.providerGenderPreference,
      budget: profile.preferences?.budget,
      // Removed: bio (may contain sensitive personal info)
    },
    // REMOVED ENTIRELY: clinical data (presentingProblem, medications, riskFactors, etc.)
    // This data should only be fetched from backend when needed
    
    // Keep payment summary (non-sensitive) for UI display
    payments: profile.payments?.map((p: any) => ({
      planId: p.planId,
      planName: p.planName,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
      // Removed: razorpayOrderId, razorpayPaymentId, razorpaySignature
    })),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  return sanitized;
}

/**
 * Mask phone number for display
 * Shows only last 4 digits
 */
export function maskPhone(phone: string | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return '****' + cleaned.slice(-4);
}

/**
 * Mask email for display
 * Shows first 2 chars + domain
 */
export function maskEmail(email: string | undefined): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '****';
  const maskedLocal = local.substring(0, 2) + '****';
  return maskedLocal + '@' + domain;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || window.location.hostname === 'localhost';
}

/**
 * Secure console.log wrapper
 * Only logs in development mode
 */
export function secureLog(...args: any[]): void {
  if (isDevelopment()) {
    console.log(...args);
  }
}

/**
 * Sanitize data for console logging
 * Masks sensitive fields
 */
export function sanitizeForLog(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };

  // Mask sensitive fields
  if (sanitized.basicInfo?.phone) {
    sanitized.basicInfo.phone = maskPhone(sanitized.basicInfo.phone);
  }
  if (sanitized.basicInfo?.email) {
    sanitized.basicInfo.email = maskEmail(sanitized.basicInfo.email);
  }
  if (sanitized.basicInfo?.dob) {
    sanitized.basicInfo.dob = '****-**-**';
  }

  // Remove clinical data entirely from logs
  if (sanitized.clinical) {
    sanitized.clinical = '[REDACTED]';
  }

  // Remove payment sensitive data
  if (sanitized.payments) {
    sanitized.payments = sanitized.payments.map((p: any) => ({
      planName: p.planName,
      amount: p.amount,
      status: p.status,
    }));
  }

  return sanitized;
}
