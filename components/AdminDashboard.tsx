import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { UserProfile } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [editStatus, setEditStatus] = useState('pending_verification');

  // Check authentication
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    } else {
      fetchProfiles();
    }
  }, [navigate]);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-token': sessionStorage.getItem('adminToken') || ''
  });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin?action=profiles', { headers: getAdminHeaders() });
      if (!res.ok) { setProfiles([]); setLoading(false); return; }
      const data = await res.json();
      const profileList = data.profiles || [];
      setProfiles(profileList);
      if (selectedProfile) {
        const updatedSelected = profileList.find((p: UserProfile) => p._id === selectedProfile._id);
        if (updatedSelected) setSelectedProfile(updatedSelected);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?action=profiles&id=${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: 'approved' })
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedProfile?._id === id) setSelectedProfile(data.profile || data);
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Error approving:', err);
    }
    setLoading(false);
  };

  const handleReject = async (id: string) => {
    // Check if profile has any successful payments
    const profile = profiles.find(p => p._id === id);
    const hasPayments = profile?.payments?.some(p => p.status === 'success');
    
    if (hasPayments) {
      const confirmMessage = `⚠️ WARNING: This profile has made successful payments!\n\nAre you ABSOLUTELY SURE you want to reject this account?\n\nThis action may result in customer complaints and refund requests.`;
      if (!window.confirm(confirmMessage)) return;
      
      // Double confirmation for paid accounts
      const doubleConfirm = window.confirm('FINAL CONFIRMATION: Reject this paying customer account?');
      if (!doubleConfirm) return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?action=profiles&id=${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedProfile?._id === id) setSelectedProfile(data.profile || data);
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Error rejecting:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    // Check if profile has any successful payments
    const profile = profiles.find(p => p._id === id);
    const hasPayments = profile?.payments?.some(p => p.status === 'success');
    
    if (hasPayments) {
      const totalPaid = profile.payments
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const confirmMessage = `🚨 CRITICAL WARNING: This profile has made ${profile.payments.filter(p => p.status === 'success').length} successful payment(s) totaling ₹${totalPaid}!\n\nDeleting this account is a SERIOUS action that may result in:\n- Customer complaints\n- Refund requests\n- Legal issues\n\nAre you ABSOLUTELY SURE you want to DELETE this paying customer account?`;
      if (!window.confirm(confirmMessage)) return;
      
      // Double confirmation for paid accounts
      const doubleConfirm = window.confirm('FINAL CONFIRMATION: Type the amount to confirm deletion: ₹' + totalPaid);
      if (!doubleConfirm) return;
    } else {
      if (!window.confirm('Are you sure you want to delete this profile?')) return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?action=profiles&id=${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        setSelectedProfile(null);
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fetchProfiles()} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
              <i className="fas fa-sync-alt mr-2"></i> Refresh
            </Button>
            <Button variant="outline" onClick={() => {
              sessionStorage.removeItem('adminToken');
              localStorage.removeItem('adminAuth');
              navigate('/admin-login');
            }} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
              <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </Button>
          </div>
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
                  key={p._id}
                  onClick={() => {
                    setSelectedProfile(p);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedProfile?._id === p._id
                      ? 'bg-teal-50 border-teal-400'
                      : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{p.basicInfo.fullName}</p>
                        {p.role === 'client' && p.payments && p.payments.length > 0 && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                            <i className="fas fa-coins mr-1"></i>{p.payments.length}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{p.basicInfo.email}</p>
                      <p className="text-sm text-slate-600">{p.basicInfo.phone}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold capitalize">{p.role}</span>
                      </p>
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

                {/* Payment Information for Clients */}
                {(() => {
                  const isClient = selectedProfile.role === 'client';
                  const hasPayments = selectedProfile.payments && selectedProfile.payments.length > 0;
                  return isClient && hasPayments && (
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-lg font-bold mb-3 text-slate-900">
                      Payment History ({selectedProfile.payments.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProfile.payments.map((payment, index) => (
                        <div 
                          key={payment.razorpayPaymentId || index}
                          className={`p-3 rounded-lg border ${
                            payment.status === 'success'
                              ? 'bg-green-50 border-green-200'
                              : payment.status === 'failed'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-slate-900">{payment.planName}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              payment.status === 'success'
                                ? 'bg-green-500 text-white'
                                : payment.status === 'failed'
                                ? 'bg-red-500 text-white'
                                : 'bg-yellow-500 text-white'
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500">Amount:</span>
                              <span className="ml-1 font-bold text-slate-900">₹{payment.amount}</span>
                            </div>
                            {payment.paymentMethod && (
                              <div>
                                <span className="text-slate-500">Method:</span>
                                <span className="ml-1 font-medium text-slate-900 uppercase">{payment.paymentMethod}</span>
                              </div>
                            )}
                          </div>
                          {payment.paidAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(payment.paidAt).toLocaleString()}
                            </p>
                          )}
                          {payment.razorpayPaymentId && (
                            <p className="text-xs text-slate-500 font-mono mt-1 truncate" title={payment.razorpayPaymentId}>
                              ID: {payment.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Total Paid:</span>
                        <span className="text-lg font-bold text-teal-600">
                          ₹{selectedProfile.payments.reduce((sum, p) => p.status === 'success' ? sum + p.amount : sum, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => handleApprove(selectedProfile._id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={selectedProfile.status === 'approved'}
                  >
                    <i className="fas fa-check mr-2"></i> Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedProfile._id)}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    disabled={selectedProfile.status === 'rejected'}
                  >
                    <i className="fas fa-times mr-2"></i> Reject
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedProfile._id)}
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
