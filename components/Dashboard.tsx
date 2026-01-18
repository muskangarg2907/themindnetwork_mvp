import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { auth } from '../services/firebase';

interface SnapshotData {
  snapshotId: string;
  phoneNumber: string;
  snapshot: {
    summary: string;
  };
  createdAt: number;
}

interface UserProfile {
  name?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserSnapshots(currentUser.phoneNumber || '');
        checkUserProfile(currentUser.phoneNumber || '');
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const checkUserProfile = async (phone: string) => {
    setProfileLoading(true);
    try {
      const response = await fetch(`/api/profiles?action=lookup&phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Profile found:', data);
        setProfile(data);
      } else if (response.status === 404) {
        console.log('[Dashboard] No profile found for user');
        setProfile(null);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to check profile:', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadUserSnapshots = async (phone: string) => {
    try {
      const response = await fetch(`/api/user/snapshots?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Navbar */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user text-primary text-xl"></i>
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-medium text-slate-900 truncate">{user?.phoneNumber}</p>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => navigate('/profile')}
                className="flex-1 sm:flex-none bg-primary hover:bg-primaryHover text-sm"
              >
                <i className="fas fa-id-card mr-2"></i>
                <span className="hidden sm:inline">My Profile</span>
                <span className="sm:hidden">Profile</span>
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 sm:flex-none bg-slate-600 hover:bg-slate-700 text-sm"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/snapshot')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/30 transition-colors flex-shrink-0">
                <i className="fas fa-brain text-primary text-xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-1">Create Snapshot</h3>
                <p className="text-sm text-slate-600">Get your psychological insights</p>
              </div>
              <i className="fas fa-arrow-right text-primary group-hover:translate-x-1 transition-transform"></i>
            </div>
          </button>

          {profileLoading ? (
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : profile ? (
            <button
              onClick={() => navigate('/profile')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                  <i className="fas fa-user-check text-green-600 text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">View Profile</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{profile.name || 'Your profile'}</span>
                    {profile.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        profile.status === 'approved' ? 'bg-green-100 text-green-700' :
                        profile.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {profile.status}
                      </span>
                    )}
                  </div>
                </div>
                <i className="fas fa-arrow-right text-green-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/create')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group text-left border-2 border-dashed border-blue-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                  <i className="fas fa-user-plus text-blue-600 text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">Create Profile</h3>
                  <p className="text-sm text-slate-600">Set up your mental health profile</p>
                </div>
                <i className="fas fa-arrow-right text-blue-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </button>
          )}
        </div>

        {/* Snapshots Section */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-history text-primary"></i>
            Your Snapshots
          </h2>
          {snapshots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-folder-open text-slate-400 text-2xl"></i>
              </div>
              <p className="text-slate-600 mb-4">No snapshots yet</p>
              <Button
                onClick={() => navigate('/snapshot')}
                className="bg-primary hover:bg-primaryHover"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Your First Snapshot
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshots.map((snap, idx) => (
                <div
                  key={snap.snapshotId || idx}
                  className="border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/snapshot/${snap.snapshotId}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 mb-1">Snapshot #{snapshots.length - idx}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {new Date(snap.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <i className="fas fa-arrow-right text-primary flex-shrink-0"></i>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {snap.snapshot?.summary || 'Psychological snapshot'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
