import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { UserProfile, ReferralRequest } from '../types';

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
  read?: boolean;
  readAt?: string;
  status?: 'open' | 'closed';
  notes?: string;
  updatedAt?: string;
  closedAt?: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [referrals, setReferrals] = useState<ReferralRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [editStatus, setEditStatus] = useState('pending_verification');
  const [resumeData, setResumeData] = useState<{ fileData: string; fileName: string } | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'providers' | 'referrals' | 'queries'>('clients');
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [refNotes, setRefNotes] = useState<{ [key: string]: string }>({});
  const [refPage, setRefPage] = useState(1);
  const [refPagination, setRefPagination] = useState<{ total: number; pages: number; hasMore: boolean }>({ total: 0, pages: 0, hasMore: false });
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([]);
  const [queryPage, setQueryPage] = useState(1);
  const [queryPagination, setQueryPagination] = useState<{ total: number; pages: number; hasMore: boolean }>({ total: 0, pages: 0, hasMore: false });
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryNotesDraft, setQueryNotesDraft] = useState('');
  const [queryActionLoading, setQueryActionLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    } else {
      fetchProfiles();
      fetchReferrals(1);
      fetchContactQueries(1);
    }
  }, [navigate]);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-token': sessionStorage.getItem('adminToken') || ''
  });

  const fetchResume = async (id: string) => {
    setResumeData(null);
    setResumeError(null);
    setResumeLoading(true);
    try {
      const res = await fetch(`/api/admin?action=resume&id=${id}`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.resumeFileData) {
          setResumeData({ fileData: data.resumeFileData, fileName: data.resumeFileName || 'resume' });
        } else {
          setResumeError(data.resumeFileName ? `File recorded ("${data.resumeFileName}") but file data was not saved — provider must re-upload.` : 'No resume data in database.');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setResumeError(`Failed to load resume (${res.status}): ${err.error || res.statusText}`);
      }
    } catch (err: any) {
      setResumeError(`Network error: ${err?.message || 'unknown'}`);
    }
    setResumeLoading(false);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin?action=profiles', { headers: getAdminHeaders() });
      if (!res.ok) {
        console.error(`Error fetching profiles: ${res.status} ${res.statusText}`);
        setProfiles([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const profileList = data.profiles || [];
      setProfiles(profileList);
      if (selectedProfile) {
        const updatedSelected = profileList.find((p: UserProfile) => p._id === selectedProfile._id);
        if (updatedSelected) setSelectedProfile(updatedSelected);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setProfiles([]);
    }
    setLoading(false);
  };

  const fetchReferrals = async (page: number = 1) => {
    try {
      const res = await fetch(`/api/admin?action=referrals&page=${page}&limit=20`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        // Handle both formats: direct array (legacy) or new paginated format
        if (Array.isArray(data)) {
          setReferrals(data);
          setRefPagination({ total: data.length, pages: 1, hasMore: false });
        } else {
          const refList = data.referrals || [];
          setReferrals(refList);
          setRefPagination(data.pagination || { total: refList.length, pages: 1, hasMore: false });
        }
        // Load notes if they exist
        const savedNotes = localStorage.getItem('adminRefNotes');
        if (savedNotes) {
          setRefNotes(JSON.parse(savedNotes));
        }
      } else {
        console.error(`Error fetching referrals: ${res.status} ${res.statusText}`);
        setReferrals([]);
        setRefPagination({ total: 0, pages: 0, hasMore: false });
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setReferrals([]);
      setRefPagination({ total: 0, pages: 0, hasMore: false });
    }
  };

  const fetchContactQueries = async (page: number = 1) => {
    setQueryLoading(true);
    try {
      const res = await fetch(`/api/admin?action=contact-queries&page=${page}&limit=25`, { headers: getAdminHeaders() });
      if (!res.ok) {
        console.error(`Error fetching contact queries: ${res.status} ${res.statusText}`);
        setContactQueries([]);
        setQueryPagination({ total: 0, pages: 0, hasMore: false });
        setSelectedQuery(null);
        return;
      }

      const data = await res.json();
      const list = (data.queries || []).map((q: ContactQuery) => ({ ...q, status: q.status || 'open' }));
      setContactQueries(list);
      setQueryPagination(data.pagination || { total: list.length, pages: 1, hasMore: false });

      // Keep selected query in sync with refreshed list.
      if (selectedQuery?._id) {
        const updated = list.find((q: ContactQuery) => q._id === selectedQuery._id);
        if (updated) {
          setSelectedQuery(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching contact queries:', err);
      setContactQueries([]);
      setQueryPagination({ total: 0, pages: 0, hasMore: false });
      setSelectedQuery(null);
    } finally {
      setQueryLoading(false);
    }
  };

  const markQueryRead = async (queryId: string) => {
    try {
      await fetch(`/api/admin?action=contact-queries&id=${queryId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ read: true }),
      });
      setContactQueries((prev) => prev.map((q) => (q._id === queryId ? { ...q, read: true } : q)));
      setSelectedQuery((prev) => (prev && prev._id === queryId ? { ...prev, read: true } : prev));
    } catch (err) {
      console.error('Error marking query as read:', err);
    }
  };

  const updateQuery = async (queryId: string, updates: { read?: boolean; status?: 'open' | 'closed'; notes?: string }) => {
    setQueryActionLoading(true);
    try {
      const res = await fetch(`/api/admin?action=contact-queries&id=${queryId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update query');
      }

      const payload = await res.json();
      const updated = payload.query as ContactQuery;
      const normalized = { ...updated, status: updated.status || 'open' };
      setContactQueries((prev) => prev.map((q) => (q._id === queryId ? normalized : q)));
      setSelectedQuery((prev) => (prev && prev._id === queryId ? normalized : prev));
      if (typeof updates.notes === 'string') {
        setQueryNotesDraft(updates.notes);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update query');
    } finally {
      setQueryActionLoading(false);
    }
  };

  const deleteQuery = async (queryId: string) => {
    if (!window.confirm('Delete this query permanently?')) return;
    setQueryActionLoading(true);
    try {
      const res = await fetch(`/api/admin?action=contact-queries&id=${queryId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete query');
      }

      setContactQueries((prev) => prev.filter((q) => q._id !== queryId));
      setSelectedQuery((prev) => (prev && prev._id === queryId ? null : prev));
      setQueryNotesDraft('');
      fetchContactQueries(queryPage);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete query');
    } finally {
      setQueryActionLoading(false);
    }
  };

  const saveRefNote = (refId: string, note: string) => {
    const updated = { ...refNotes, [refId]: note };
    setRefNotes(updated);
    localStorage.setItem('adminRefNotes', JSON.stringify(updated));
    setEditingRefId(null);
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => { fetchProfiles(); fetchReferrals(refPage); fetchContactQueries(queryPage); }} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'clients'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Clients ({profiles.filter(p => p.role === 'client').length})
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'providers'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Providers ({profiles.filter(p => p.role === 'provider').length})
          </button>
          <button
            onClick={() => { setActiveTab('referrals'); setRefPage(1); fetchReferrals(1); }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'referrals'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Referrals ({refPagination.total})
          </button>
          <button
            onClick={() => { setActiveTab('queries'); setQueryPage(1); fetchContactQueries(1); }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'queries'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Queries ({queryPagination.total})
          </button>
        </div>

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Clients</h2>
              {loading && <p className="text-slate-500">Loading...</p>}
              {!loading && profiles.filter(p => p.role === 'client').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                  <p className="text-slate-500 text-center">No clients to show!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {profiles.filter(p => p.role === 'client').map((p) => {
                    const clientReferrals = referrals.filter(ref => ref.creatorPhone === p.basicInfo.phone);
                    const topChoiceReferrals = clientReferrals.filter(ref => ref.selectedProviderId);
                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedProfile(p)}
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
                              {p.payments && p.payments.length > 0 && (
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                                  <i className="fas fa-coins mr-1"></i>{p.payments.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{p.basicInfo.email}</p>
                            <p className="text-sm text-slate-600">{p.basicInfo.phone}</p>
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                Referrals Created: {clientReferrals.length}
                              </span>
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                Top Choices: {topChoiceReferrals.length}
                              </span>
                            </div>
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
                    );
                  })}
                </div>
              )}
            </div>
            {/* Profile Details - Clients */}
            {renderProfileDetails()}
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Providers</h2>
              {loading && <p className="text-slate-500">Loading...</p>}
              {!loading && profiles.filter(p => p.role === 'provider').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                  <p className="text-slate-500 text-center">No providers to show!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {profiles.filter(p => p.role === 'provider').map((p) => {
                    const providerApplications = referrals.reduce((count: number, ref: ReferralRequest) => {
                      const applicantCount = ref.applicants?.filter(app => app.phoneNumber === p.basicInfo.phone).length || 0;
                      return count + applicantCount;
                    }, 0);
                    return (
                      <div
                        key={p._id}
                        onClick={() => { setSelectedProfile(p); setResumeData(null); setResumeError(null); if (p._id) fetchResume(p._id); }}
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
                            </div>
                            <p className="text-sm text-slate-600">{p.basicInfo.email}</p>
                            <p className="text-sm text-slate-600">{p.basicInfo.phone}</p>
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                Applied To: {providerApplications}
                              </span>
                            </div>
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
                    );
                  })}
                </div>
              )}
            </div>
            {/* Profile Details - Providers */}
            {renderProfileDetails()}
          </div>
        )}

        {/* Queries Tab */}
        {activeTab === 'queries' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Contact Queries</h2>
              {queryLoading ? (
                <p className="text-slate-500">Loading queries...</p>
              ) : contactQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                  <p className="text-slate-500 text-center">No queries to show!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {contactQueries.map((query) => (
                    <div
                      key={query._id}
                      onClick={() => {
                        setSelectedQuery(query);
                        setQueryNotesDraft(query.notes || '');
                        if (!query.read) markQueryRead(query._id);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedQuery?._id === query._id
                          ? 'bg-teal-50 border-teal-400'
                          : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{query.name}</p>
                          <p className="text-sm text-slate-600 truncate">{query.email}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{query.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(query.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${query.read ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                            {query.read ? 'Read' : 'New'}
                          </span>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${query.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {query.status === 'closed' ? 'Closed' : 'Open'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {queryPagination.total > 0 && queryPagination.pages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Page <span className="font-bold">{queryPage}</span> of <span className="font-bold">{queryPagination.pages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(1, queryPage - 1);
                        setQueryPage(next);
                        fetchContactQueries(next);
                      }}
                      disabled={queryPage === 1}
                      className="px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-chevron-left mr-1"></i> Previous
                    </button>
                    <button
                      onClick={() => {
                        const next = Math.min(queryPagination.pages, queryPage + 1);
                        setQueryPage(next);
                        fetchContactQueries(next);
                      }}
                      disabled={!queryPagination.hasMore}
                      className="px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <i className="fas fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-6 overflow-y-auto max-h-[85vh]">
              <h2 className="text-xl font-bold mb-4">Query Details</h2>
              {selectedQuery ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</p>
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Name</label>
                      <p className="text-slate-800 text-sm">{selectedQuery.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Email</label>
                      <p className="text-slate-800 text-sm break-all">{selectedQuery.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Submitted At</label>
                      <p className="text-slate-800 text-sm">{new Date(selectedQuery.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Query</p>
                    <p className="text-slate-800 text-sm whitespace-pre-wrap">{selectedQuery.message}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Notes</p>
                    <textarea
                      value={queryNotesDraft}
                      onChange={(e) => setQueryNotesDraft(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
                      placeholder="Add manual notes for this query..."
                    />
                    <Button
                      onClick={() => updateQuery(selectedQuery._id, { notes: queryNotesDraft })}
                      disabled={queryActionLoading}
                      className="w-full"
                    >
                      Save Notes
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateQuery(selectedQuery._id, { status: selectedQuery.status === 'closed' ? 'open' : 'closed' })}
                      disabled={queryActionLoading}
                      className={selectedQuery.status === 'closed' ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
                    >
                      {selectedQuery.status === 'closed' ? 'Reopen Query' : 'Close Query'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteQuery(selectedQuery._id)}
                      disabled={queryActionLoading}
                      className="border-red-400 text-red-700 hover:bg-red-50"
                    >
                      Delete Query
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Select a query to view details</p>
              )}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Referral Management</h2>
            {referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                <p className="text-slate-500 text-center">No referrals to show!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Ref Details</th>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Creator</th>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Selected Provider</th>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref, idx) => {
                      const creator = profiles.find(p => p.basicInfo.phone === ref.creatorPhone);
                      const selectedProvider = ref.selectedProviderId ? profiles.find(p => p._id === ref.selectedProviderId) : null;
                      return (
                        <tr key={ref.requestId || idx} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="text-xs space-y-1">
                              <p><strong>{ref.clientInitials}</strong> | {ref.clientType}</p>
                              <p>{ref.clientAge ? `${ref.clientAge} yrs` : '—'} | {Array.isArray(ref.mode) ? ref.mode.join(', ') : ref.mode}</p>
                              <p>₹{ref.budgetRange} | {ref.urgency}</p>
                              <p className="text-slate-500">{ref.languages}</p>
                              <p className="text-slate-500 max-w-xs truncate" title={ref.concerns}>{ref.concerns}</p>
                              <p className="text-blue-600 font-mono text-xs">{new Date(ref.createdAt).toLocaleDateString('en-IN')}</p>
                              <p className="text-slate-600">Applicants: {ref.applicants?.length || 0} | <a href={window.location.origin + '/#/referral/' + ref.requestId} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a></p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {creator && (
                              <div className="text-xs space-y-0.5">
                                <p><strong>{creator.basicInfo.fullName}</strong></p>
                                <p className="text-slate-600">{creator.basicInfo.phone}</p>
                                <p className="text-slate-600 truncate">{creator.basicInfo.email}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {selectedProvider ? (
                              <div className="text-xs space-y-0.5">
                                <p><strong>{selectedProvider.basicInfo.fullName}</strong></p>
                                <p className="text-slate-600">{selectedProvider.basicInfo.phone}</p>
                                <p className="text-slate-600 truncate">{selectedProvider.basicInfo.email}</p>
                                {selectedProvider.providerDetails && (
                                  <>
                                    <p className="text-slate-600">{selectedProvider.providerDetails.specializations?.join(', ')}</p>
                                    <p className="text-slate-600">{selectedProvider.providerDetails.offlineLocation || selectedProvider.providerDetails.mode}</p>
                                    <p className="text-slate-600">₹{selectedProvider.providerDetails.budgetRange}</p>
                                    <p className="text-slate-600 line-clamp-2">{selectedProvider.providerDetails.therapyStyle}</p>
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-xs italic">Not selected</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRefId === ref.requestId ? (
                              <div className="space-y-2">
                                <textarea
                                  value={refNotes[ref.requestId] || ''}
                                  onChange={(e) => setRefNotes({ ...refNotes, [ref.requestId]: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs resize-none"
                                  rows={3}
                                  placeholder="Add notes..."
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveRefNote(ref.requestId, refNotes[ref.requestId] || '')}
                                    className="px-2 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRefId(null)}
                                    className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => setEditingRefId(ref.requestId)}
                                className="text-xs text-slate-600 p-2 bg-slate-50 rounded cursor-pointer hover:bg-slate-100 min-h-12 max-w-xs whitespace-pre-wrap"
                              >
                                {refNotes[ref.requestId] || <span className="text-slate-400 italic">Click to add notes...</span>}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination Controls */}
            {refPagination.total > 0 && refPagination.pages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  Page <span className="font-bold">{refPage}</span> of <span className="font-bold">{refPagination.pages}</span> • Showing {referrals.length} of {refPagination.total} referrals
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setRefPage(Math.max(1, refPage - 1)); fetchReferrals(Math.max(1, refPage - 1)); }}
                    disabled={refPage === 1}
                    className="px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-left mr-1"></i> Previous
                  </button>
                  {Array.from({ length: refPagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setRefPage(p); fetchReferrals(p); }}
                      className={`px-2 py-1 text-sm font-medium rounded ${
                        refPage === p
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => { setRefPage(Math.min(refPagination.pages, refPage + 1)); fetchReferrals(Math.min(refPagination.pages, refPage + 1)); }}
                    disabled={!refPagination.hasMore}
                    className="px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  function renderProfileDetails() {
    return (
      <div className="bg-white rounded-xl shadow p-6 overflow-y-auto max-h-[85vh]">
            <h2 className="text-xl font-bold mb-4">Details</h2>
            {selectedProfile ? (
              <div className="space-y-4">

                {/* ── Basic Info ── */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Basic Info</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Name</label>
                      <p className="text-slate-800 font-medium text-sm">{selectedProfile.basicInfo.fullName || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Role</label>
                      <p className="text-slate-800 font-medium text-sm capitalize">{selectedProfile.role}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Email</label>
                      <p className="text-slate-800 text-xs break-all">{selectedProfile.basicInfo.email || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold">Phone</label>
                      <p className="text-slate-800 text-sm">{selectedProfile.basicInfo.phone || '—'}</p>
                    </div>
                    {selectedProfile.basicInfo.dob && (
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Date of Birth</label>
                        <p className="text-slate-800 text-sm">{selectedProfile.basicInfo.dob}</p>
                      </div>
                    )}
                    {selectedProfile.basicInfo.gender && (
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Gender</label>
                        <p className="text-slate-800 text-sm capitalize">{selectedProfile.basicInfo.gender}</p>
                      </div>
                    )}
                    {selectedProfile.basicInfo.location && (
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500 font-bold">Location</label>
                        <p className="text-slate-800 text-sm">{selectedProfile.basicInfo.location}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    <label className="text-xs text-slate-500 font-bold">Registered</label>
                    <p className="text-slate-800 text-xs">{new Date(selectedProfile.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                  </div>
                </div>

                {/* ── Provider Details ── */}
                {selectedProfile.role === 'provider' && selectedProfile.providerDetails && (() => {
                  const pd = selectedProfile.providerDetails;
                  return (
                    <div className="bg-teal-50 rounded-lg p-3 space-y-3 border border-teal-100">
                      <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Provider Intake</p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Qualification</label>
                          <p className="text-slate-800 text-sm">{pd.qualification || '—'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Experience</label>
                          <p className="text-slate-800 text-sm">{pd.yearsExperience ? `${pd.yearsExperience} yrs` : '—'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Mode</label>
                          <p className="text-slate-800 text-sm capitalize">{pd.mode || '—'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Budget Range</label>
                          <p className="text-slate-800 text-sm">{pd.budgetRange || '—'}</p>
                        </div>
                      </div>

                      {pd.offlineLocation && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Offline Location</label>
                          <p className="text-slate-800 text-sm">{pd.offlineLocation}</p>
                        </div>
                      )}

                      {pd.licenses && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Licenses & Certifications</label>
                          <p className="text-slate-800 text-sm">{pd.licenses}</p>
                        </div>
                      )}

                      {pd.specializations && pd.specializations.length > 0 && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Specializations</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pd.specializations.map((s, i) => (
                              <span key={i} className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pd.languages && pd.languages.length > 0 && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Languages</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pd.languages.map((l, i) => (
                              <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{l}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pd.clientType && pd.clientType.length > 0 && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Client Types</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pd.clientType.map((c, i) => (
                              <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full capitalize">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pd.therapeuticFocus && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Therapeutic Focus</label>
                          <p className="text-slate-800 text-sm">{pd.therapeuticFocus}</p>
                        </div>
                      )}

                      {pd.therapyStyle && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Therapy Style</label>
                          <p className="text-slate-800 text-sm">{pd.therapyStyle}</p>
                        </div>
                      )}

                      {pd.website && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Website / LinkedIn</label>
                          <p className="text-slate-800 text-sm break-all">{pd.website}</p>
                        </div>
                      )}

                      {/* Resume */}
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Resume / CV</label>
                        {/* Show filename from profile metadata immediately (available from bulk fetch) */}
                        {pd.resumeFileName && !resumeData && (
                          <p className="text-xs text-slate-500 mt-0.5 italic" title={pd.resumeFileName}>
                            <i className="fas fa-paperclip mr-1"></i>{pd.resumeFileName}
                          </p>
                        )}
                        {resumeLoading ? (
                          <p className="text-slate-400 text-xs mt-1"><i className="fas fa-spinner fa-spin mr-1"></i>Loading file...</p>
                        ) : resumeData ? (
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <i className="fas fa-file-alt text-teal-600 text-sm"></i>
                            <span className="text-xs text-slate-700 truncate max-w-[120px]" title={resumeData.fileName}>
                              {resumeData.fileName}
                            </span>
                            <a
                              href={resumeData.fileData}
                              download={resumeData.fileName}
                              className="px-2 py-0.5 text-xs font-semibold bg-teal-600 text-white rounded hover:bg-teal-700"
                            >
                              <i className="fas fa-download mr-1"></i>Download
                            </a>
                            <a
                              href={resumeData.fileData}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                              <i className="fas fa-eye mr-1"></i>View
                            </a>
                          </div>
                        ) : resumeError ? (
                          <p className="text-orange-600 text-xs mt-1"><i className="fas fa-exclamation-triangle mr-1"></i>{resumeError}</p>
                        ) : !pd.resumeFileName ? (
                          <p className="text-slate-400 text-xs mt-1">No resume uploaded</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Payment History (Clients) ── */}
                {(() => {
                  const isClient = selectedProfile.role === 'client';
                  const hasPayments = selectedProfile.payments && selectedProfile.payments.length > 0;
                  return isClient && hasPayments && (
                  <div className="pt-2 border-t border-slate-200">
                    <h3 className="text-sm font-bold mb-3 text-slate-900">
                      Payment History ({selectedProfile.payments.length})
                    </h3>
                    <div className="space-y-3 max-h-72 overflow-y-auto">
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
                            <p className="text-xs text-slate-500 mt-1">{new Date(payment.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                          )}
                          {payment.razorpayPaymentId && (
                            <p className="text-xs text-slate-500 font-mono mt-1 truncate" title={payment.razorpayPaymentId}>
                              ID: {payment.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">Total Paid:</span>
                      <span className="text-lg font-bold text-teal-600">
                        ₹{selectedProfile.payments.reduce((sum, p) => p.status === 'success' ? sum + p.amount : sum, 0)}
                      </span>
                    </div>
                  </div>
                  );
                })()}

                {/* ── Actions ── */}
                <div className="pt-4 space-y-2 border-t border-slate-100">
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
      );
    }
};
