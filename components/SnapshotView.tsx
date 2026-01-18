import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from './ui/Button';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, onAuthStateChanged } from 'firebase/auth';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+65', country: 'SG' },
  { code: '+971', country: 'AE' },
];

interface SnapshotData {
  userId: string;
  phoneNumber: string;
  snapshot: {
    emotionalPatterns: {
      currentState: string;
      stressTriggers: string[];
      stressResponse: string;
      regulation: string[];
    };
    relationshipPatterns: {
      connectionStyle: string;
      uncertaintyResponse: string;
      conflictStyle: string;
      attachmentNotes: string;
    };
    whatHelps: string[];
    whatHurts: string[];
    personalityTendencies: {
      bigFive: any;
      cognitiveStyle: string;
      naturalRhythm: string;
    };
    meaningfulExperiences: string;
    summary: string;
  };
  createdAt: number;
}

export const SnapshotView: React.FC = () => {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // User's snapshots
  const [userSnapshots, setUserSnapshots] = useState<SnapshotData[]>([]);
  
  // Check if user is already logged in and listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[SnapshotView] User authenticated:', user.phoneNumber);
        setIsAuthenticated(true);
        loadUserSnapshots(user.phoneNumber || '');
      } else {
        console.log('[SnapshotView] User not authenticated');
        setIsAuthenticated(false);
        setUserSnapshots([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!snapshotId) {
        console.log('[SNAPSHOT] No snapshot ID');
        setIsLoading(false);
        return;
      }

      console.log('[SNAPSHOT] Fetching snapshot:', snapshotId);
      setIsLoading(true);
      
      try {
        // Strategy: localStorage is primary source during development
        // 1. Check localStorage first (most reliable for dev)
        // 2. Try backend as backup
        // 3. Show helpful error if neither works
        
        const localSnapshotData = localStorage.getItem('psychSnapshot_data');
        const localSnapshotUrl = localStorage.getItem('psychSnapshot_url');
        
        console.log('[SNAPSHOT] localStorage check:', {
          hasData: !!localSnapshotData,
          storedUrl: localSnapshotUrl,
          requestedUrl: snapshotId,
          isMatch: localSnapshotUrl === snapshotId
        });
        
        // If this is the user's own snapshot from this browser, use localStorage
        if (localSnapshotData && localSnapshotUrl === snapshotId) {
          console.log('[SNAPSHOT] ✓ Loading from localStorage (exact match)');
          const snapshotData = JSON.parse(localSnapshotData);
          setSnapshot(snapshotData);
          setError('');
          setIsLoading(false);
          return;
        }
        
        // If no match in localStorage, try backend (for shared snapshots)
        console.log('[SNAPSHOT] No localStorage match, trying backend...');
        const response = await fetch(`/api/snapshot/${snapshotId}`);
        console.log('[SNAPSHOT] Backend response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Snapshot not found in backend');
        }
        
        const data = await response.json();
        console.log('[SNAPSHOT] ✓ Loaded from backend');
        setSnapshot(data);
        setError('');
        
      } catch (err: any) {
        console.error('[SNAPSHOT] Failed to load from backend:', err.message);
        
        // Last resort: use any localStorage data if available
        const localSnapshotData = localStorage.getItem('psychSnapshot_data');
        if (localSnapshotData) {
          console.log('[SNAPSHOT] ⚠ Using localStorage fallback (URL mismatch)');
          const snapshotData = JSON.parse(localSnapshotData);
          setSnapshot(snapshotData);
          setError('');
        } else {
          console.error('[SNAPSHOT] ✗ No snapshot found anywhere');
          setError('Snapshot not available. Create a new one or use the same browser where you created it.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, [snapshotId]);

  // Load user's snapshots from backend
  const loadUserSnapshots = async (phone: string) => {
    try {
      const response = await fetch(`/api/user/snapshots?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        setUserSnapshots(data.snapshots || []);
      }
    } catch (err) {
      console.error('Failed to load user snapshots:', err);
    }
  };

  // Auth handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhoneNumber(val);
      if (authError) setAuthError('');
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    
    const fullPhone = `${countryCode}${phoneNumber}`;
    
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved')
        });
      }
      
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setAuthStep('otp');
      setAuthError('');
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setAuthError(err.message || 'Failed to send OTP. Please try again.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setAuthError('Please enter a valid 6-digit OTP.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result. Please request OTP again.');
      }
      
      await confirmationResult.confirm(otp);
      setIsAuthenticated(true);
      const fullPhone = `${countryCode}${phoneNumber}`;
      
      // Link current snapshot to user's phone number
      if (snapshotId) {
        try {
          await fetch('/api/snapshot/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              snapshotId,
              phoneNumber: fullPhone
            })
          });
          console.log('[SNAPSHOT] Linked to user:', fullPhone);
        } catch (linkErr) {
          console.error('[SNAPSHOT] Failed to link:', linkErr);
        }
      }
      
      await loadUserSnapshots(fullPhone);
      setAuthError('');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setAuthError('Invalid OTP. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      setUserSnapshots([]);
      setPhoneNumber('');
      setOtp('');
      setAuthStep('phone');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const copySnapshotUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Snapshot URL copied to clipboard!');
  };

  const shareOnWhatsApp = () => {
    const text = `Check out my psychological snapshot on TheMindNetwork`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Check out my psychological snapshot on @TheMindNetwork`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading snapshot...</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <i className="fas fa-info-circle text-amber-600 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Snapshot Not Available</h1>
            <p className="text-slate-600">{error || 'This snapshot could not be loaded.'}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              <i className="fas fa-lightbulb mr-2"></i>
              Development Note:
            </p>
            <p className="text-sm text-blue-800">
              Snapshots are currently stored in browser memory. To view your snapshot:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
              <li>• Use the same browser where you created it</li>
              <li>• Don't clear your browser data</li>
              <li>• Create a new snapshot if this one is lost</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={() => window.location.href = '/#/snapshot'} className="w-full">
              <i className="fas fa-plus mr-2"></i>
              Create New Snapshot
            </Button>
            <Button 
              onClick={() => window.location.href = '/#/'} 
              variant="outline" 
              className="w-full"
            >
              <i className="fas fa-home mr-2"></i>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for snapshot data structure
  if (!snapshot.snapshot) {
    console.error('[SNAPSHOT] Invalid snapshot structure. Full data:', JSON.stringify(snapshot, null, 2));
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Snapshot Data</h1>
          <p className="text-slate-600 mb-6">The snapshot data is incomplete or invalid. Please create a new snapshot.</p>
          <Button onClick={() => window.location.href = '/#/snapshot'}>
            Create Your Own Snapshot
          </Button>
        </div>
      </div>
    );
  }

  const { emotionalPatterns = {}, relationshipPatterns = {}, whatHelps = [], whatHurts = [], personalityTendencies = {}, meaningfulExperiences = '', summary = '' } = snapshot.snapshot || {};
  const createdDate = snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Recently';

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10">
      {/* Info Banner */}
      <div className="bg-green-50 border-b border-green-200 py-2 px-2 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs sm:text-sm text-green-800 text-center">
            <i className="fas fa-share-alt mr-1 sm:mr-2"></i>
            This snapshot is publicly viewable. Anyone with this link can see it.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white mb-4 sm:mb-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Psychological Snapshot</h1>
              <p className="text-xs sm:text-sm text-white/80">Created on {createdDate}</p>
            </div>
            <div className="hidden sm:block flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-brain text-4xl sm:text-5xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Login/User Section */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fas fa-user-lock text-primary text-xl sm:text-2xl"></i>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Login to Save Your Snapshots</h2>
              <p className="text-sm sm:text-base text-slate-600">Create an account to access your snapshots anytime, anywhere</p>
            </div>

            {authStep === 'phone' ? (
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 sm:w-28 px-2 sm:px-3 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="10-digit number"
                      maxLength={10}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                
                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                    {authError}
                  </div>
                )}
                
                <Button
                  onClick={handleSendOtp}
                  disabled={authLoading || phoneNumber.length !== 10}
                  className="w-full bg-primary hover:bg-primaryHover text-sm sm:text-base h-11 sm:h-auto"
                >
                  {authLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="tel"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-xl sm:text-2xl tracking-widest"
                  />
                </div>
                
                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                    {authError}
                  </div>
                )}
                
                <Button
                  onClick={handleVerifyOtp}
                  disabled={authLoading || otp.length !== 6}
                  className="w-full bg-primary hover:bg-primaryHover mb-3 text-sm sm:text-base h-11 sm:h-auto"
                >
                  {authLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                
                <button
                  onClick={() => {
                    setAuthStep('phone');
                    setOtp('');
                    setAuthError('');
                  }}
                  className="w-full text-sm text-slate-600 hover:text-slate-900"
                >
                  ← Change Phone Number
                </button>
              </div>
            )}
            
            <div id="recaptcha-container"></div>
          </div>
        ) : (
          <>
            {/* Navbar */}
            <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-primary"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{countryCode}{phoneNumber}</p>
                    <p className="text-xs text-slate-500">Logged in</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  className="bg-slate-600 hover:bg-slate-700 text-sm"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </Button>
              </div>
            </div>

            {/* User's Snapshots Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-history text-primary"></i>
                Your Snapshots
              </h2>
              {userSnapshots.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <i className="fas fa-folder-open text-4xl mb-3 opacity-50"></i>
                  <p>No snapshots yet. Create your first one!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {userSnapshots.map((snap, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                      onClick={() => window.location.href = `#/snapshot/${snap.userId}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 mb-1">Snapshot #{idx + 1}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(snap.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <i className="fas fa-arrow-right text-primary"></i>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {snap.snapshot.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Summary Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <i className="fas fa-file-alt text-primary text-xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Profile Summary</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        </div>

        {/* Mental History Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-teal-600 text-xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Emotional Patterns</h2>
              
              {emotionalPatterns.currentState && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Current State</h3>
                  <p className="text-slate-700 leading-relaxed">{emotionalPatterns.currentState}</p>
                </div>
              )}

              {emotionalPatterns.stressTriggers && emotionalPatterns.stressTriggers.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Stress Triggers</h3>
                  <div className="flex flex-wrap gap-2">
                    {emotionalPatterns.stressTriggers.map((trigger, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200"
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {emotionalPatterns.stressResponse && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Stress Response</h3>
                  <p className="text-slate-700 leading-relaxed">{emotionalPatterns.stressResponse}</p>
                </div>
              )}

              {emotionalPatterns.regulation && emotionalPatterns.regulation.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Regulation Strategies</h3>
                  <div className="flex flex-wrap gap-2">
                    {emotionalPatterns.regulation.map((strategy, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200"
                      >
                        {strategy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relationship Patterns Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <i className="fas fa-users text-pink-600 text-xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Relationship Patterns</h2>
              
              {relationshipPatterns.connectionStyle && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Connection Style</h3>
                  <p className="text-slate-700 leading-relaxed">{relationshipPatterns.connectionStyle}</p>
                </div>
              )}

              {relationshipPatterns.uncertaintyResponse && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Response to Uncertainty</h3>
                  <p className="text-slate-700 leading-relaxed">{relationshipPatterns.uncertaintyResponse}</p>
                </div>
              )}

              {relationshipPatterns.conflictStyle && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Conflict Style</h3>
                  <p className="text-slate-700 leading-relaxed">{relationshipPatterns.conflictStyle}</p>
                </div>
              )}

              {relationshipPatterns.attachmentNotes && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Attachment Notes</h3>
                  <p className="text-slate-700 leading-relaxed">{relationshipPatterns.attachmentNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* What Helps Section */}
        {whatHelps && whatHelps.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-4">What Helps</h2>
                <div className="space-y-2">
                  {whatHelps.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <i className="fas fa-plus-circle text-green-600 mt-1"></i>
                      <p className="text-slate-700 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What Hurts Section */}
        {whatHurts && whatHurts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600 text-xl"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-4">What Hurts</h2>
                <div className="space-y-2">
                  {whatHurts.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <i className="fas fa-minus-circle text-red-600 mt-1"></i>
                      <p className="text-slate-700 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personality Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <i className="fas fa-user-circle text-primary text-xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Personality Tendencies</h2>
              
              {personalityTendencies.bigFive && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Big Five Traits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(personalityTendencies.bigFive).map(([trait, value], idx) => (
                      <div key={idx} className="px-3 py-2 bg-accent/10 text-primary rounded-lg text-sm border border-accent">
                        <span className="font-semibold capitalize">{trait}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {personalityTendencies.cognitiveStyle && (
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Cognitive Style</h3>
                  <p className="text-slate-700 leading-relaxed">{personalityTendencies.cognitiveStyle}</p>
                </div>
              )}

              {personalityTendencies.naturalRhythm && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Natural Rhythm</h3>
                  <p className="text-slate-700 leading-relaxed">{personalityTendencies.naturalRhythm}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meaningful Experiences Section */}
        {meaningfulExperiences && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-star text-yellow-600 text-xl"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Meaningful Experiences</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{meaningfulExperiences}</p>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary to-primary rounded-2xl p-8 text-white text-center shadow-xl">
          <h2 className="text-2xl font-bold mb-3">Want to create your own snapshot?</h2>
          <p className="text-white/80 mb-6">
            Build your psychological profile and share it with others
          </p>
          <button
            onClick={() => window.location.href = '/#/snapshot'}
            className="bg-white text-primary hover:bg-accent/10 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            <i className="fas fa-plus-circle"></i>
            Create My Snapshot
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          <p>
            <i className="fas fa-shield-alt mr-1"></i>
            This is a psychological snapshot created on TheMindNetwork
          </p>
          <p className="mt-2">
            <a href="/#/" className="text-primary hover:text-primary">
              Visit TheMindNetwork
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

