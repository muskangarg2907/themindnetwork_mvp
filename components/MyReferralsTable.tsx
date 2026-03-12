import * as React from 'react';
import { useState, useEffect } from 'react';
import { ReferralApplication, ReferralRequest, ReferralShortlist } from '../types';

interface ProviderProfile {
  fullName: string;
  email: string;
  qualification: string;
  yearsExperience: string;
  specializations: string[];
  languages: string[];
  mode: string;
  budgetRange: string;
  therapeuticFocus: string;
  therapyStyle: string;
  licenses: string;
  website: string;
  clientType: string[];
  offlineLocation: string;
  resumeFileName: string;
}

interface MyReferralsTableProps {
  phoneNumber: string;
  refreshTrigger?: number;
}

export const MyReferralsTable: React.FC<MyReferralsTableProps> = ({
  phoneNumber,
  refreshTrigger
}) => {
  const [requests, setRequests] = useState<(ReferralRequest & { applicantCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [applicantsByRequest, setApplicantsByRequest] = useState<Record<string, ReferralApplication[]>>({});
  const [shortlistByRequest, setShortlistByRequest] = useState<Record<string, ReferralShortlist[]>>({});
  const [loadingApplicantsByRequest, setLoadingApplicantsByRequest] = useState<Record<string, boolean>>({});
  const [applicantErrorByRequest, setApplicantErrorByRequest] = useState<Record<string, string>>({});
  const [shortlisting, setShortlisting] = useState<Record<string, boolean>>({});
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [providerProfiles, setProviderProfiles] = useState<Record<string, ProviderProfile>>({});
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [selectingProvider, setSelectingProvider] = useState<string | null>(null);
  const [selectedSuccess, setSelectedSuccess] = useState<Record<string, string>>({});
  const [inlineForm, setInlineForm] = useState({
    clientInitials: '',
    clientType: 'individual' as 'individual' | 'couple' | 'group',
    clientAge: '',
    concerns: '',
    genderPreference: [] as string[],
    languages: '',
    mode: [] as string[],
    location: '',
    budgetRange: '',
    urgency: 'Medium' as 'Low' | 'Medium' | 'High',
    notes: ''
  });

  const genderOptions = ['Female', 'Male', 'Non-Binary', 'Any'];
  const modeOptions = ['Online', 'Offline', 'Hybrid'];

  const getRequestIdentifier = (req: any) => String(req?.requestId || req?._id || req?.id || '');

  const getApplicants = (requestId: string) => applicantsByRequest[requestId] || [];
  const getShortlist = (requestId: string) => shortlistByRequest[requestId] || [];

  const isShortlisted = (requestId: string, applicantId: string) => {
    return getShortlist(requestId).some(s => s.applicantId === applicantId);
  };

  const getShortlistRank = (requestId: string, applicantId: string) => {
    return getShortlist(requestId).find(s => s.applicantId === applicantId)?.rank;
  };

  const buildReferralLink = (requestId: string) => {
    if (!requestId) return '';
    return `${window.location.origin}/#/referral/${requestId}`;
  };

  const handleShareLink = async (requestId: string) => {
    if (!requestId) {
      return;
    }

    const shareUrl = buildReferralLink(requestId);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinkFor(requestId);
      setTimeout(() => {
        setCopiedLinkFor(prev => (prev === requestId ? null : prev));
      }, 1800);
    } catch (err) {
      console.error('Failed to copy referral link:', err);
    }
  };

  const fetchApplicantsForRequest = async (requestId: string) => {
    if (!requestId) return;

    setLoadingApplicantsByRequest(prev => ({ ...prev, [requestId]: true }));
    setApplicantErrorByRequest(prev => ({ ...prev, [requestId]: '' }));

    try {
      const [appRes, shortRes] = await Promise.all([
        fetch(`/api/referrals?action=applicants&requestId=${encodeURIComponent(requestId)}`, {
          headers: { 'X-User-Phone': phoneNumber }
        }),
        fetch(`/api/referrals?action=shortlist&requestId=${encodeURIComponent(requestId)}`, {
          headers: { 'X-User-Phone': phoneNumber }
        })
      ]);

      if (!appRes.ok) {
        const err = await appRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch applicants');
      }

      const applicants = await appRes.json();
      setApplicantsByRequest(prev => ({ ...prev, [requestId]: applicants || [] }));

      if (shortRes.ok) {
        const shortlist = await shortRes.json();
        setShortlistByRequest(prev => ({ ...prev, [requestId]: shortlist || [] }));
      }
    } catch (err: any) {
      setApplicantErrorByRequest(prev => ({ ...prev, [requestId]: err.message || 'Failed to load applicants' }));
    } finally {
      setLoadingApplicantsByRequest(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleShortlist = async (requestId: string, applicantId: string, rank: number) => {
    const key = `${requestId}:${applicantId}`;
    setShortlisting(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/referrals?action=shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({ requestId, applicantId, rank })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || 'Failed to shortlist applicant');
        return;
      }

      await fetchApplicantsForRequest(requestId);
    } catch (err) {
      console.error('Error shortlisting applicant:', err);
      alert('Failed to shortlist applicant');
    } finally {
      setShortlisting(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveShortlist = async (requestId: string, applicantId: string) => {
    try {
      const response = await fetch('/api/referrals?action=shortlist-remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({ requestId, applicantId })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || 'Failed to remove from shortlist');
        return;
      }

      await fetchApplicantsForRequest(requestId);
    } catch (err) {
      console.error('Error removing shortlist:', err);
      alert('Failed to remove from shortlist');
    }
  };

  const fetchProviderProfile = async (applicantId: string) => {
    if (providerProfiles[applicantId]) {
      setExpandedProfileId(expandedProfileId === applicantId ? null : applicantId);
      return;
    }
    setLoadingProfileId(applicantId);
    try {
      const res = await fetch(`/api/referrals?action=provider-profile&phone=${encodeURIComponent(applicantId)}`, {
        headers: { 'X-User-Phone': phoneNumber }
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const profile = await res.json();
      setProviderProfiles(prev => ({ ...prev, [applicantId]: profile }));
      setExpandedProfileId(applicantId);
    } catch (err) {
      console.error('Error fetching provider profile:', err);
      alert('Could not load provider profile');
    } finally {
      setLoadingProfileId(null);
    }
  };

  const handleSelectProvider = async (requestId: string, applicantId: string) => {
    const key = `${requestId}:${applicantId}`;
    setSelectingProvider(key);
    try {
      const res = await fetch('/api/referrals?action=select-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({ requestId, applicantId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to select provider');
      }
      setSelectedSuccess(prev => ({ ...prev, [requestId]: applicantId }));
      // Update local request data
      setRequests(prev => prev.map(r =>
        r.requestId === requestId ? { ...r, selectedProviderId: applicantId, selectedAt: new Date().toISOString() } : r
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to select provider');
    } finally {
      setSelectingProvider(null);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/referrals?action=my-requests', {
        headers: {
          'X-User-Phone': phoneNumber
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data || []);
    } catch (err: any) {
      // Only show error if it's a real network/server error, not empty results
      console.error('[REFERRALS] Fetch error:', err);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [phoneNumber, refreshTrigger]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/referrals?action=update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({
          requestId,
          status: newStatus === 'active' ? 'closed' : 'active'
        })
      });

      if (response.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm(`Are you sure you want to delete referral request ${requestId}? This action cannot be undone.`)) return;

    try {
      const response = await fetch('/api/referrals?action=delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({ requestId })
      });

      if (response.ok) {
        fetchRequests();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete request');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete request');
    }
  };

  const startInlineEdit = (req: ReferralRequest) => {
    setEditingRequestId(getRequestIdentifier(req));
    setInlineForm({
      clientInitials: req.clientInitials || '',
      clientType: req.clientType,
      clientAge: req.clientAge ? String(req.clientAge) : '',
      concerns: req.concerns || '',
      genderPreference: req.genderPreference || [],
      languages: req.languages || '',
      mode: req.mode || [],
      location: req.location || '',
      budgetRange: req.budgetRange || '',
      urgency: req.urgency,
      notes: req.notes || ''
    });
  };

  const toggleGender = (option: string) => {
    setInlineForm(prev => ({
      ...prev,
      genderPreference: prev.genderPreference.includes(option)
        ? prev.genderPreference.filter(g => g !== option)
        : [...prev.genderPreference, option]
    }));
  };

  const toggleMode = (option: string) => {
    setInlineForm(prev => ({
      ...prev,
      mode: prev.mode.includes(option)
        ? prev.mode.filter(m => m !== option)
        : [...prev.mode, option]
    }));
  };

  const saveInlineEdit = async (req: any) => {
    const requestId = req?.requestId || '';
    const referralId = req?._id || req?.id || '';

    if (!requestId && !referralId) {
      alert('Unable to edit this request: missing request identifier. Please create a new referral request.');
      return;
    }

    if (!inlineForm.concerns.trim()) {
      alert('Please describe the client concerns');
      return;
    }
    if (inlineForm.mode.length === 0) {
      alert('Please select at least one mode');
      return;
    }
    if ((inlineForm.mode.includes('Offline') || inlineForm.mode.includes('Hybrid')) && !inlineForm.location.trim()) {
      alert('Please specify location for offline/hybrid sessions');
      return;
    }
    if (!inlineForm.budgetRange.trim()) {
      alert('Please specify budget range');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch('/api/referrals?action=update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({
          requestId: requestId || referralId,
          referralId,
          clientInitials: inlineForm.clientInitials,
          clientType: inlineForm.clientType,
          clientAge: inlineForm.clientAge ? parseInt(inlineForm.clientAge, 10) : undefined,
          concerns: inlineForm.concerns,
          genderPreference: inlineForm.genderPreference.length > 0 ? inlineForm.genderPreference : ['Any'],
          languages: inlineForm.languages || 'Any',
          mode: inlineForm.mode,
          location: inlineForm.location,
          budgetRange: inlineForm.budgetRange,
          urgency: inlineForm.urgency,
          notes: inlineForm.notes
        })
      });

      if (!response.ok) {
        const err = await response.json();
        const msg = err?.required
          ? `${err.error}: ${Array.isArray(err.required) ? err.required.join(', ') : ''}`
          : (err?.error || 'Failed to update request');
        alert(msg);
        return;
      }

      setEditingRequestId(null);
      await fetchRequests();
    } catch (err) {
      console.error('Failed to update request:', err);
      alert('Failed to update request');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading requests...</div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No referral requests yet.</p>
        <p className="text-sm mt-2">Create one to start receiving applications from providers.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Request ID</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Created</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Applicants</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.map((req, idx) => {
            const reqIdentifier = getRequestIdentifier(req);
            return (
            <React.Fragment key={reqIdentifier || `request-${idx}`}>
              <tr
                className="cursor-pointer transition-all hover:bg-gray-50 hover:shadow-sm"
                onClick={() => {
                  const next = expandedRequestId === reqIdentifier ? null : reqIdentifier;
                  setExpandedRequestId(next);
                  if (next && !applicantsByRequest[reqIdentifier]) {
                    fetchApplicantsForRequest(reqIdentifier);
                  }
                }}
                title="Click to view request details and applicants"
              >
                <td className="px-4 py-3 font-mono text-blue-600">{reqIdentifier || '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(req.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-gray-900 font-semibold">{req.applicantCount ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                    req.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareLink(reqIdentifier);
                      }}
                      disabled={!reqIdentifier}
                      title={copiedLinkFor === reqIdentifier ? 'Link copied' : 'Copy referral link'}
                      aria-label={`Copy referral link for ${reqIdentifier}`}
                      className={`p-1.5 rounded hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        copiedLinkFor === reqIdentifier ? 'text-green-700' : 'text-teal-700'
                      }`}
                    >
                      <i className={`fas ${copiedLinkFor === reqIdentifier ? 'fa-check' : 'fa-copy'}`}></i>
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(reqIdentifier, req.status);
                        }}
                        disabled={!reqIdentifier}
                        className={`text-xs px-3 py-1 rounded ${
                          req.status === 'active'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {req.status === 'active' ? 'Close' : 'Reopen'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(reqIdentifier);
                        }}
                        disabled={!reqIdentifier}
                        title="Delete request"
                        aria-label={`Delete request ${reqIdentifier}`}
                        className="p-1.5 rounded text-red-700 hover:bg-red-100"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>

              {expandedRequestId === reqIdentifier && (
                <tr className="bg-slate-50">
                  <td colSpan={5} className="px-4 pb-4">
                    <div className="mt-2 bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">Request Details</h4>
                        {editingRequestId !== reqIdentifier ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startInlineEdit(req);
                            }}
                            className="text-xs px-3 py-1 bg-teal-100 text-teal-800 rounded hover:bg-teal-200"
                          >
                            Edit
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRequestId(null);
                              }}
                              className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveInlineEdit(req);
                              }}
                              disabled={savingEdit}
                              className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                            >
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        )}
                      </div>

                      {editingRequestId !== reqIdentifier ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {req.clientInitials && (
                              <p><span className="font-semibold text-slate-700">Client Initials:</span> {req.clientInitials}</p>
                            )}
                            <p><span className="font-semibold text-slate-700">Client Type:</span> <span className="capitalize">{req.clientType}</span></p>
                            {req.clientAge && (
                              <p><span className="font-semibold text-slate-700">Age:</span> {req.clientAge}</p>
                            )}
                            <p><span className="font-semibold text-slate-700">Budget:</span> {req.budgetRange}</p>
                            <p><span className="font-semibold text-slate-700">Urgency:</span> {req.urgency}</p>
                            {req.languages && (
                              <p><span className="font-semibold text-slate-700">Languages:</span> {req.languages}</p>
                            )}
                            {req.mode?.length > 0 && (
                              <p><span className="font-semibold text-slate-700">Mode:</span> {req.mode.join(', ')}</p>
                            )}
                            {req.location && (
                              <p><span className="font-semibold text-slate-700">Location:</span> {req.location}</p>
                            )}
                          </div>

                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-700 mb-1">Concerns</p>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap">{req.concerns}</p>
                          </div>

                          {req.notes && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Additional Notes</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.notes}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Initials</label>
                              <input
                                value={inlineForm.clientInitials}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, clientInitials: e.target.value.toUpperCase().substring(0, 12) }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Type</label>
                              <select
                                value={inlineForm.clientType}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, clientType: e.target.value as 'individual' | 'couple' | 'group' }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              >
                                <option value="individual">Individual</option>
                                <option value="couple">Couple</option>
                                <option value="group">Group</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                              <input
                                type="number"
                                min="13"
                                max="100"
                                value={inlineForm.clientAge}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, clientAge: e.target.value }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Client Concerns</label>
                            <textarea
                              rows={3}
                              value={inlineForm.concerns}
                              onChange={(e) => setInlineForm(prev => ({ ...prev, concerns: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-3 py-2 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender Preference</label>
                              <div className="grid grid-cols-2 gap-2">
                                {genderOptions.map(option => (
                                  <label key={option} className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={inlineForm.genderPreference.includes(option)}
                                      onChange={() => toggleGender(option)}
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
                              <div className="grid grid-cols-2 gap-2">
                                {modeOptions.map(option => (
                                  <label key={option} className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={inlineForm.mode.includes(option)}
                                      onChange={() => toggleMode(option)}
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Languages</label>
                              <input
                                value={inlineForm.languages}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, languages: e.target.value }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget</label>
                              <input
                                value={inlineForm.budgetRange}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, budgetRange: e.target.value }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
                              <select
                                value={inlineForm.urgency}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, urgency: e.target.value as 'Low' | 'Medium' | 'High' }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>

                          {(inlineForm.mode.includes('Offline') || inlineForm.mode.includes('Hybrid')) && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                              <input
                                value={inlineForm.location}
                                onChange={(e) => setInlineForm(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                            <textarea
                              rows={2}
                              value={inlineForm.notes}
                              onChange={(e) => setInlineForm(prev => ({ ...prev, notes: e.target.value.substring(0, 200) }))}
                              className="w-full bg-white border border-slate-300 rounded px-3 py-2 resize-none"
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-6 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-slate-900">Applicants ({req.applicantCount || 0})</h5>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchApplicantsForRequest(reqIdentifier);
                            }}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                          >
                            Refresh
                          </button>
                        </div>

                        {/* Success message when provider is selected */}
                        {(selectedSuccess[reqIdentifier] || (req as any).selectedProviderId) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                            <div className="flex items-start gap-3">
                              <i className="fas fa-check-circle text-green-600 text-lg mt-0.5"></i>
                              <div>
                                <p className="text-sm font-semibold text-green-800">Great! Our team will get in touch with you shortly!</p>
                                <p className="text-xs text-green-700 mt-1">
                                  You've selected your preferred provider. We'll coordinate the next steps.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {loadingApplicantsByRequest[reqIdentifier] ? (
                          <div className="text-sm text-slate-500 py-3">Loading applicants...</div>
                        ) : applicantErrorByRequest[reqIdentifier] ? (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                            {applicantErrorByRequest[reqIdentifier]}
                          </div>
                        ) : getApplicants(reqIdentifier).length === 0 ? (
                          <div className="text-sm text-slate-500 py-3">No applicants yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {getApplicants(reqIdentifier).map((app) => {
                              const skey = `${reqIdentifier}:${app.applicantId}`;
                              const isSelected = (req as any).selectedProviderId === app.applicantId || selectedSuccess[reqIdentifier] === app.applicantId;
                              const hasSelection = !!(req as any).selectedProviderId || !!selectedSuccess[reqIdentifier];
                              const profileExpanded = expandedProfileId === app.applicantId;
                              const profile = providerProfiles[app.applicantId];

                              return (
                                <div key={app.applicantId} className={`border rounded-lg overflow-hidden ${isSelected ? 'border-green-300 bg-green-50/50' : 'border-slate-200 bg-slate-50/40'}`}>
                                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{app.applicantName || 'Provider'}</p>
                                        {isSelected && (
                                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-semibold">
                                            <i className="fas fa-star mr-1"></i>Selected
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600">
                                        {app.applicantExp || '-'} yrs | {app.applicantDegrees || '-'} | Fee: {app.applicantFee || '-'}
                                      </p>
                                      <p className="text-xs text-slate-600">
                                        {(Array.isArray(app.applicantLanguages) ? app.applicantLanguages.join(', ') : app.applicantLanguages) || '-'}
                                        {' | '}
                                        {app.applicantLocation || '-'}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fetchProviderProfile(app.applicantId);
                                        }}
                                        disabled={loadingProfileId === app.applicantId}
                                        className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                                      >
                                        {loadingProfileId === app.applicantId ? (
                                          <><i className="fas fa-spinner fa-spin mr-1"></i>Loading</>
                                        ) : profileExpanded ? 'Hide Profile' : 'View Profile'}
                                      </button>
                                      {!hasSelection && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectProvider(reqIdentifier, app.applicantId);
                                          }}
                                          disabled={selectingProvider === skey}
                                          className="text-xs px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                                        >
                                          {selectingProvider === skey ? 'Selecting...' : 'Select'}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Inline expanded profile */}
                                  {profileExpanded && profile && (
                                    <div className="border-t border-slate-200 bg-white p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-xs font-semibold text-slate-500">Name</span>
                                          <p className="text-slate-900">{profile.fullName}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-semibold text-slate-500">Qualification</span>
                                          <p className="text-slate-900">{profile.qualification || '-'}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-semibold text-slate-500">Experience</span>
                                          <p className="text-slate-900">{profile.yearsExperience ? `${profile.yearsExperience} years` : '-'}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-semibold text-slate-500">Mode</span>
                                          <p className="text-slate-900 capitalize">{profile.mode || '-'}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-semibold text-slate-500">Budget Range</span>
                                          <p className="text-slate-900">{profile.budgetRange || '-'}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-semibold text-slate-500">Licenses</span>
                                          <p className="text-slate-900">{profile.licenses || '-'}</p>
                                        </div>
                                        {profile.specializations.length > 0 && (
                                          <div className="md:col-span-2">
                                            <span className="text-xs font-semibold text-slate-500">Specializations</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {profile.specializations.map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{s}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {profile.languages.length > 0 && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-500">Languages</span>
                                            <p className="text-slate-900">{profile.languages.join(', ')}</p>
                                          </div>
                                        )}
                                        {profile.therapeuticFocus && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-500">Therapeutic Focus</span>
                                            <p className="text-slate-900">{profile.therapeuticFocus}</p>
                                          </div>
                                        )}
                                        {profile.therapyStyle && (
                                          <div className="md:col-span-2">
                                            <span className="text-xs font-semibold text-slate-500">Therapy Style / Bio</span>
                                            <p className="text-slate-900 whitespace-pre-wrap">{profile.therapyStyle}</p>
                                          </div>
                                        )}
                                        {profile.website && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-500">Website</span>
                                            <p>
                                              <a
                                                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline text-sm"
                                              >
                                                {profile.website}
                                              </a>
                                            </p>
                                          </div>
                                        )}
                                        {profile.offlineLocation && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-500">Location</span>
                                            <p className="text-slate-900">{profile.offlineLocation}</p>
                                          </div>
                                        )}
                                      </div>

                                      {!hasSelection && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectProvider(reqIdentifier, app.applicantId);
                                            }}
                                            disabled={selectingProvider === skey}
                                            className="text-xs px-4 py-1.5 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 font-medium"
                                          >
                                            {selectingProvider === skey ? 'Selecting...' : 'Select as Top Choice'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )})}
        </tbody>
      </table>
    </div>
  );
};
