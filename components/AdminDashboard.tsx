import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface Profile {
  id: string;
  basicInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  status: 'pending_verification' | 'approved' | 'rejected';
  role: 'provider' | 'client';
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [editStatus, setEditStatus] = useState('pending_verification');

  useEffect(() => {
    fetchProfiles();
    // Auto-refresh every 2 seconds to show real-time updates
    const interval = setInterval(fetchProfiles, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/profiles');
      const data = await res.json();
      const profileList = data.profiles || [];
      setProfiles(profileList);
      
      // If a profile is selected, update it with fresh data from the list
      if (selectedProfile) {
        const updatedSelected = profileList.find((p: Profile) => p.id === selectedProfile.id);
        if (updatedSelected) {
          setSelectedProfile(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/profiles?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        // Update selectedProfile immediately with response data
        if (selectedProfile?.id === id) {
          setSelectedProfile(updatedProfile.profile || updatedProfile);
        }
        // Then refresh the full list
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Error approving:', err);
    }
    setLoading(false);
  };

  const handleReject = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/profiles?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        // Update selectedProfile immediately with response data
        if (selectedProfile?.id === id) {
          setSelectedProfile(updatedProfile.profile || updatedProfile);
        }
        // Then refresh the full list
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Error rejecting:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/profiles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedProfile(null);
        await fetchProfiles();
        setSelectedProfile(null);
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
    setLoading(false);
  };

  const handleResetAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL profiles? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        fetchProfiles();
      }
    } catch (err) {
      console.error('Error resetting:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleResetAll} className="bg-red-100 text-red-700 hover:bg-red-200">
            <i className="fas fa-trash mr-2"></i> Reset All Profiles
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profiles List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Profiles ({profiles.length})</h2>
            {loading && <p className="text-slate-500">Loading...</p>}
            {!loading && profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                <p className="text-slate-500 text-center">No profiles to show!</p>
                <p className="text-xs text-slate-400 mt-1">Create a new profile or import data</p>
              </div>
            ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProfile(p)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedProfile?.id === p.id
                      ? 'bg-teal-50 border-teal-400'
                      : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{p.basicInfo.fullName}</p>
                      <p className="text-sm text-slate-600">{p.basicInfo.email}</p>
                      <p className="text-sm text-slate-600">{p.basicInfo.phone}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                        p.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Details</h2>
            {selectedProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-500 font-bold">Name</label>
                  <p className="text-slate-800 font-medium">{selectedProfile.basicInfo.fullName}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 font-bold">Email</label>
                  <p className="text-slate-800 font-medium text-sm">{selectedProfile.basicInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 font-bold">Phone</label>
                  <p className="text-slate-800 font-medium">{selectedProfile.basicInfo.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 font-bold">Role</label>
                  <p className="text-slate-800 font-medium capitalize">{selectedProfile.role}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 font-bold">Created</label>
                  <p className="text-slate-800 font-medium text-xs">
                    {new Date(selectedProfile.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => handleApprove(selectedProfile.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={selectedProfile.status === 'approved'}
                  >
                    <i className="fas fa-check mr-2"></i> Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedProfile.id)}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    disabled={selectedProfile.status === 'rejected'}
                  >
                    <i className="fas fa-times mr-2"></i> Reject
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedProfile.id)}
                    variant="outline"
                    className="w-full border-red-500 text-red-700 hover:bg-red-50"
                  >
                    <i className="fas fa-trash mr-2"></i> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Select a profile to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
