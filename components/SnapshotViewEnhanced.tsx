import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Button } from './ui/Button';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, onAuthStateChanged } from 'firebase/auth';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
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

// Helper to parse Big Five traits into chart data
const parseBigFiveForChart = (bigFive: any) => {
  if (!bigFive) return [];
  
  const scoreMap: {[key: string]: number} = {
    'very low': 20, 'low': 40, 'moderate': 60, 'moderately': 60,
    'high': 80, 'very high': 100, 'balanced': 50, 'average': 50
  };
  
  return Object.entries(bigFive).map(([trait, description]) => {
    const desc = String(description).toLowerCase();
    let value = 60; // default
    
    // Extract score from description
    for (const [key, score] of Object.entries(scoreMap)) {
      if (desc.includes(key)) {
        value = score;
        break;
      }
    }
    
    return {
      trait: trait.charAt(0).toUpperCase() + trait.slice(1),
      value,
      description: String(description)
    };
  });
};

export const SnapshotViewEnhanced: React.FC = () => {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Auth states (keeping original logic)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!snapshotId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const localSnapshotData = localStorage.getItem('psychSnapshot_data');
        const localSnapshotUrl = localStorage.getItem('psychSnapshot_url');
        
        console.log('[SNAPSHOT_VIEW] Loading snapshot:', snapshotId);
        console.log('[SNAPSHOT_VIEW] localStorage URL:', localSnapshotUrl);
        console.log('[SNAPSHOT_VIEW] localStorage data:', localSnapshotData);
        
        if (localSnapshotData && localSnapshotUrl === snapshotId) {
          const parsedData = JSON.parse(localSnapshotData);
          console.log('[SNAPSHOT_VIEW] Parsed data:', parsedData);
          
          // The backend returns the full SnapshotData object which includes a nested 'snapshot' field
          // Structure: { snapshot: { userId, phoneNumber, messages, snapshot: {...actual data...}, snapshotUrl, createdAt }, createdAt }
          let snapshotData;
          
          if (parsedData.snapshot) {
            // New format: Extract the SnapshotData from the wrapper
            const innerData = parsedData.snapshot;
            if (innerData.snapshot) {
              // innerData is the full SnapshotData object with the psychological data nested inside
              snapshotData = innerData;
            } else {
              // Old format compatibility
              snapshotData = {
                userId: '',
                phoneNumber: localStorage.getItem('psychSnapshot_phone') || '',
                snapshot: innerData,
                createdAt: parsedData.createdAt || Date.now()
              };
            }
          } else {
            // Fallback: parsedData is already in correct format
            snapshotData = parsedData;
          }
          
          console.log('[SNAPSHOT_VIEW] Final snapshot data:', snapshotData);
          setSnapshot(snapshotData);
          setError('');
          setIsLoading(false);
          return;
        }
        
        console.log('[SNAPSHOT_VIEW] Fetching from API:', `/api/snapshot/${snapshotId}`);
        const response = await fetch(`/api/snapshot/${snapshotId}`);
        
        if (!response.ok) {
          console.error('[SNAPSHOT_VIEW] API response not ok:', response.status);
          throw new Error('Snapshot not found');
        }
        
        const data = await response.json();
        console.log('[SNAPSHOT_VIEW] API response data:', data);
        setSnapshot(data);
        setError('');
        
      } catch (err: any) {
        console.error('[SNAPSHOT_VIEW] Error fetching snapshot:', err);
        const localSnapshotData = localStorage.getItem('psychSnapshot_data');
        if (localSnapshotData) {
          console.log('[SNAPSHOT_VIEW] Using fallback localStorage data');
          const parsedData = JSON.parse(localSnapshotData);
          
          // Handle the same nested structure in error case
          let snapshotData;
          
          if (parsedData.snapshot) {
            const innerData = parsedData.snapshot;
            if (innerData.snapshot) {
              snapshotData = innerData;
            } else {
              snapshotData = {
                userId: '',
                phoneNumber: localStorage.getItem('psychSnapshot_phone') || '',
                snapshot: innerData,
                createdAt: parsedData.createdAt || Date.now()
              };
            }
          } else {
            snapshotData = parsedData;
          }
          
          console.log('[SNAPSHOT_VIEW] Fallback snapshot data:', snapshotData);
          setSnapshot(snapshotData);
          setError('');
        } else {
          console.error('[SNAPSHOT_VIEW] No localStorage data available');
          setError('Snapshot not available. Create a new one or use the same browser where you created it.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, [snapshotId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-white to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your snapshot...</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-white to-accent/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Snapshot Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/#/snapshot'} className="bg-primary hover:bg-primaryHover">
            Create Your Snapshot
          </Button>
        </div>
      </div>
    );
  }

  console.log('[SNAPSHOT_VIEW] Rendering with snapshot:', snapshot);
  console.log('[SNAPSHOT_VIEW] Snapshot.snapshot:', snapshot.snapshot);
  
  // Safety check - ensure snapshot.snapshot exists
  if (!snapshot.snapshot) {
    console.error('[SNAPSHOT_VIEW] No snapshot.snapshot field found!');
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-white to-accent/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Snapshot Data Error</h2>
          <p className="text-slate-600 mb-6">The snapshot data is incomplete. Please create a new snapshot.</p>
          <Button onClick={() => window.location.href = '/#/snapshot'} className="bg-primary hover:bg-primaryHover">
            Create New Snapshot
          </Button>
        </div>
      </div>
    );
  }
  
  const { emotionalPatterns, relationshipPatterns, whatHelps, whatHurts, personalityTendencies, meaningfulExperiences, summary } = snapshot.snapshot;
  
  console.log('[SNAPSHOT_VIEW] Destructured data:', {
    emotionalPatterns,
    relationshipPatterns,
    whatHelps,
    whatHurts,
    personalityTendencies,
    meaningfulExperiences,
    summary
  });
  
  // Prepare chart data with null checks
  const bigFiveData = personalityTendencies?.bigFive ? parseBigFiveForChart(personalityTendencies.bigFive) : [];
  
  // Coping mechanisms data
  const copingData = [
    { name: 'Helps', value: whatHelps?.length || 0, color: '#10b981' },
    { name: 'Hurts', value: whatHurts?.length || 0, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Back to Profile Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-primary hover:text-primaryHover mb-4 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span className="font-medium">Back to Profile</span>
        </button>
        
        {/* Hero Header - Mind at a Glance */}
        <div className="relative rounded-2xl shadow-lg p-6 mb-6 overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full mb-2">
                  <i className="fas fa-brain text-white text-sm"></i>
                  <span className="text-white text-xs font-medium">Psychological Snapshot</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Mind Profile</h1>
              </div>
              <div className="text-white/80 text-sm text-right">
                <div className="bg-white/10 rounded-lg px-3 py-1">
                  <i className="fas fa-calendar mr-1"></i>
                  {new Date(snapshot.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
            
            {/* Profile Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
              <p className="text-base leading-relaxed text-white whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        </div>

        {/* Personality Radar Chart */}
        {bigFiveData.length > 0 && (
          <div className="rounded-xl shadow-md p-5 mb-5" style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb, 20, 184, 166), 0.02), white, rgba(var(--color-secondary-rgb, 16, 185, 129), 0.02))' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <i className="fas fa-chart-pie text-white text-sm"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Personality Dimensions</h2>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div className="flex items-center justify-center rounded-xl p-4" style={{ background: 'linear-gradient(to bottom right, var(--color-primary), rgba(var(--color-primary-rgb), 0.05))' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={bigFiveData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="trait" 
                      tick={(props) => {
                        const { x, y, payload, index } = props;
                        const trait = bigFiveData[index];
                        return (
                          <g>
                            <text x={x} y={y} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="500">
                              <tspan x={x} dy="0">{payload.value}</tspan>
                              <tspan x={x} dy="16" fill="var(--color-primary)" fontWeight="bold">{trait.value}%</tspan>
                            </text>
                          </g>
                        );
                      }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name="Traits" dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {/* Current State */}
                {emotionalPatterns && (
                <div className="rounded-lg p-3 border-l-4" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-heart text-sm" style={{ color: 'var(--color-primary)' }}></i>
                    <h3 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>Current State</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{emotionalPatterns.currentState || 'Not specified'}</p>
                </div>
                )}

                {/* Stress Triggers */}
                {emotionalPatterns && emotionalPatterns.stressTriggers && emotionalPatterns.stressTriggers.length > 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-exclamation-triangle text-sm" style={{ color: 'var(--color-primary)' }}></i>
                      <h3 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>Stress Triggers</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {emotionalPatterns.stressTriggers.map((trigger, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)', color: 'var(--color-primary)' }}
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stress Response */}
                {emotionalPatterns && emotionalPatterns.stressResponse && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-bolt text-sm" style={{ color: 'var(--color-primary)' }}></i>
                      <h3 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>Stress Response</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{emotionalPatterns.stressResponse}</p>
                  </div>
                )}

                {/* Coping Strategies */}
                {emotionalPatterns && emotionalPatterns.regulation && emotionalPatterns.regulation.length > 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-shield-alt text-sm" style={{ color: 'var(--color-primary)' }}></i>
                      <h3 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>Coping Strategies</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {emotionalPatterns.regulation.map((strategy, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)', color: 'var(--color-primary)' }}
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
        )}

        {/* Emotional Landscape - REMOVED, content moved to Personality section */}

        {/* Triggers & Coping Grid - REMOVED, content moved to Personality section */}

        {/* Support vs Risk Factors - REMOVED as redundant */}

        {/* Relationship Patterns */}
        {relationshipPatterns && (relationshipPatterns.connectionStyle || relationshipPatterns.uncertaintyResponse || relationshipPatterns.conflictStyle || relationshipPatterns.attachmentNotes) && (
          <div className="rounded-xl shadow-md p-5 mb-5" style={{ background: 'linear-gradient(135deg, rgba(var(--color-accent-rgb, 251, 146, 60), 0.02), white)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
              <i className="fas fa-users text-white text-sm"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>Relationship Patterns</h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3">
            {relationshipPatterns.connectionStyle && (
              <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)', borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
                <h4 className="font-semibold mb-1 flex items-center gap-2 text-base" style={{ color: 'var(--color-primary)' }}>
                  <i className="fas fa-link text-sm" style={{ color: 'var(--color-primary)' }}></i>
                  Connection Style
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{relationshipPatterns.connectionStyle}</p>
              </div>
            )}

            {relationshipPatterns.uncertaintyResponse && (
              <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)', borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
                <h4 className="font-semibold mb-1 flex items-center gap-2 text-base" style={{ color: 'var(--color-primary)' }}>
                  <i className="fas fa-question-circle text-sm" style={{ color: 'var(--color-primary)' }}></i>
                  Uncertainty Response
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{relationshipPatterns.uncertaintyResponse}</p>
              </div>
            )}

            {relationshipPatterns.conflictStyle && (
              <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)', borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
                <h4 className="font-semibold mb-1 flex items-center gap-2 text-base" style={{ color: 'var(--color-primary)' }}>
                  <i className="fas fa-hand-paper text-sm" style={{ color: 'var(--color-primary)' }}></i>
                  Conflict Style
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{relationshipPatterns.conflictStyle}</p>
              </div>
            )}

            {relationshipPatterns.attachmentNotes && (
              <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)', borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
                <h4 className="font-semibold mb-1 flex items-center gap-2 text-base" style={{ color: 'var(--color-primary)' }}>
                  <i className="fas fa-heart text-sm" style={{ color: 'var(--color-primary)' }}></i>
                  Attachment
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{relationshipPatterns.attachmentNotes}</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Cognitive Style & Rhythm */}
        {personalityTendencies && (personalityTendencies.cognitiveStyle || personalityTendencies.naturalRhythm) && (
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {personalityTendencies.cognitiveStyle && (
              <div className="rounded-xl shadow-md p-4 border-l-4" style={{ borderColor: 'var(--color-accent)', background: 'linear-gradient(to right, rgba(var(--color-accent-rgb, 251, 146, 60), 0.05), white)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
                    <i className="fas fa-brain text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>Cognitive Style</h3>
                </div>
                <p className="text-base leading-relaxed" style={{ color: '#1e293b' }}>{personalityTendencies.cognitiveStyle}</p>
              </div>
            )}

            {personalityTendencies.naturalRhythm && (
              <div className="rounded-xl shadow-md p-4 border-l-4" style={{ borderColor: 'var(--color-accent)', background: 'linear-gradient(to right, rgba(var(--color-accent-rgb, 251, 146, 60), 0.05), white)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
                    <i className="fas fa-clock text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>Natural Rhythm</h3>
                </div>
                <p className="text-base leading-relaxed" style={{ color: '#1e293b' }}>{personalityTendencies.naturalRhythm}</p>
              </div>
            )}
          </div>
        )}

        {/* Meaningful Experiences */}
        {meaningfulExperiences && (
          <div className="rounded-xl shadow-md p-5 mb-5 border-l-4" style={{ borderColor: 'var(--color-primary)', background: 'linear-gradient(to right, rgba(var(--color-primary-rgb, 20, 184, 166), 0.03), white)' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <i className="fas fa-star text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>Meaningful Experiences</h2>
              </div>
            </div>
            <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#1e293b' }}>{meaningfulExperiences}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm space-y-2">
          <div className="flex items-center justify-center gap-2">
            <i className="fas fa-shield-alt text-primary"></i>
            <span>Created on TheMindNetwork • Confidential & Secure</span>
          </div>
          <div>
            <a href="/#/" className="text-primary hover:text-primaryHover font-medium">
              Visit TheMindNetwork →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
