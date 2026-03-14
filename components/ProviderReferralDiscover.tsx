import * as React from 'react';
import { useEffect, useState } from 'react';
import { ReferralRequest, UserProfile } from '../types';

type DiscoverReferral = ReferralRequest & {
  hasApplied?: boolean;
};

interface ProviderReferralDiscoverProps {
  phoneNumber: string;
  profile: UserProfile;
}

export const ProviderReferralDiscover: React.FC<ProviderReferralDiscoverProps> = ({ phoneNumber, profile }) => {
  const [items, setItems] = useState<DiscoverReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingRequestId, setApplyingRequestId] = useState<string | null>(null);
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOpenReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/referrals?action=discover', {
        headers: {
          'X-User-Phone': phoneNumber,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load open referrals');
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load open referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!phoneNumber) return;
    fetchOpenReferrals();
  }, [phoneNumber]);

  const handleApply = async (requestId: string) => {
    setApplyingRequestId(requestId);
    try {
      const payload = {
        requestId,
        name: profile.basicInfo?.fullName || 'Provider',
        exp: profile.providerDetails?.yearsExperience || '',
        degrees: profile.providerDetails?.qualification || '',
        modalities: profile.providerDetails?.mode ? [profile.providerDetails.mode] : [],
        fee: profile.providerDetails?.budgetRange || '',
        languages: Array.isArray(profile.providerDetails?.languages)
          ? profile.providerDetails?.languages.join(', ')
          : '',
        location: profile.providerDetails?.offlineLocation || '',
      };

      const res = await fetch('/api/referrals?action=apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to apply');
      }

      setItems((prev) => prev.map((item) =>
        item.requestId === requestId
          ? { ...item, hasApplied: true, applicantCount: (item.applicantCount || 0) + 1 }
          : item
      ));
    } catch (e: any) {
      setApplyErrors(prev => ({ ...prev, [requestId]: e.message || 'Could not submit application. Please try again.' }));
      setTimeout(() => setApplyErrors(prev => { const n = { ...prev }; delete n[requestId]; return n; }), 5000);
    } finally {
      setApplyingRequestId(null);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Open Client Referrals</h3>
          <p className="text-sm text-slate-600 mt-1">Discover active referrals posted by others and apply directly.</p>
        </div>
        <button
          type="button"
          onClick={fetchOpenReferrals}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
        >
          Refresh
        </button>
      </div>

      <div className="p-6">
        {loading && <p className="text-slate-600">Loading open referrals...</p>}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 text-slate-600 px-4 py-4 text-sm">
            No open referrals available right now.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((req) => (
              <div key={req.requestId} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                {/* Summary row - clickable to expand */}
                <div
                  className="flex flex-wrap items-start justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === req.requestId ? null : req.requestId)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-500">
                      Posted {new Date(req.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h4 className="text-base font-semibold text-slate-900 capitalize mt-1">
                      {req.clientType} case {req.clientAge ? `• ${req.clientAge} yrs` : ''}
                    </h4>
                    {expandedId !== req.requestId && (
                      <p className="text-sm text-slate-700 mt-2 line-clamp-2">{req.concerns}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Budget: {req.budgetRange} {req.languages ? `• Languages: ${req.languages}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {req.urgency} urgency
                    </span>
                    <span className="text-xs text-slate-500">{req.applicantCount || 0} applicants</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === req.requestId ? null : req.requestId); }}
                        className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700"
                      >
                        {expandedId === req.requestId ? 'Hide' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleApply(req.requestId); }}
                        disabled={!!req.hasApplied || applyingRequestId === req.requestId}
                        className={`text-xs px-3 py-1 rounded text-white ${req.hasApplied ? 'bg-green-600' : 'bg-teal-600 hover:bg-teal-700'} disabled:opacity-60`}
                      >
                        {applyingRequestId === req.requestId
                          ? 'Applying...'
                          : req.hasApplied
                          ? <><i className="fas fa-check mr-1"></i>Applied</>
                          : 'Apply'}
                      </button>
                    </div>
                    {applyErrors[req.requestId] && (
                      <p className="text-xs text-red-600 text-right">{applyErrors[req.requestId]}</p>
                    )}
                  </div>
                </div>

                {/* Expanded inline details */}
                {expandedId === req.requestId && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 pb-4">
                    <div className="mt-3 bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Full Details</h4>
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
                        {req.genderPreference?.length > 0 && (
                          <p><span className="font-semibold text-slate-700">Gender Pref:</span> {req.genderPreference.join(', ')}</p>
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
