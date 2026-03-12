import React, { useState, useEffect } from 'react';
import { ReferralApplication, ReferralShortlist } from '../types';

interface ViewApplicantsModalProps {
  requestId: string;
  phoneNumber: string;
  onClose: () => void;
}

export const ViewApplicantsModal: React.FC<ViewApplicantsModalProps> = ({
  requestId,
  phoneNumber,
  onClose
}) => {
  const [applicants, setApplicants] = useState<ReferralApplication[]>([]);
  const [shortlist, setShortlist] = useState<ReferralShortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shortlisting, setShortlisting] = useState<{ [key: string]: boolean }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, shortRes] = await Promise.all([
        fetch(`/api/referrals?action=applicants&requestId=${requestId}`, {
          headers: { 'X-User-Phone': phoneNumber }
        }),
        fetch(`/api/referrals?action=shortlist&requestId=${requestId}`, {
          headers: { 'X-User-Phone': phoneNumber }
        })
      ]);

      if (!appRes.ok) throw new Error('Failed to fetch applicants');

      const appData = await appRes.json();
      setApplicants(appData || []);

      if (shortRes.ok) {
        const shortData = await shortRes.json();
        setShortlist(shortData || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestId, phoneNumber]);

  const handleShortlist = async (applicantId: string, rank: number) => {
    setShortlisting(prev => ({ ...prev, [applicantId]: true }));
    try {
      const response = await fetch('/api/referrals?action=shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({
          requestId,
          applicantId,
          rank
        })
      });

      if (response.ok) {
        fetchData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add to shortlist');
      }
    } catch (err) {
      console.error('Error shortlisting:', err);
      alert('Failed to add to shortlist');
    } finally {
      setShortlisting(prev => ({ ...prev, [applicantId]: false }));
    }
  };

  const handleRemoveShortlist = async (applicantId: string) => {
    try {
      const response = await fetch('/api/referrals?action=shortlist-remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({ requestId, applicantId })
      });

      if (response.ok) {
        fetchData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to remove from shortlist');
      }
    } catch (err) {
      console.error('Error removing from shortlist:', err);
      alert('Failed to remove from shortlist');
    }
  };

  const isShortlisted = (applicantId: string) => {
    return shortlist.some(s => s.applicantId === applicantId);
  };

  const getShortlistRank = (applicantId: string) => {
    return shortlist.find(s => s.applicantId === applicantId)?.rank;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Applicants for {requestId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading applicants...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No applicants yet.</div>
          ) : (
            <>
              {shortlist.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Your Top {shortlist.length}:</h3>
                  <div className="space-y-2">
                    {shortlist.sort((a, b) => a.rank - b.rank).map((sl) => {
                      const app = applicants.find(a => a.applicantId === sl.applicantId);
                      return (
                        <div key={sl.applicantId} className="flex items-center justify-between bg-white p-3 rounded">
                          <div>
                            <p className="font-semibold text-gray-900">#{sl.rank}: {app?.applicantName || 'Provider'}</p>
                            <p className="text-sm text-gray-600">{app?.applicantFee || 'Fee not specified'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveShortlist(sl.applicantId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <h3 className="font-semibold text-gray-900 mb-4">All Applicants ({applicants.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Experience</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Degrees</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Modalities</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Fee</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Languages</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Location</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Shortlist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applicants.map(app => (
                      <tr key={app.applicantId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{app.applicantName || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{app.applicantExp || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{app.applicantDegrees || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {app.applicantModalities?.length > 0
                            ? app.applicantModalities.join(', ')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{app.applicantFee || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{app.applicantLanguages || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{app.applicantLocation || '-'}</td>
                        <td className="px-4 py-3">
                          {isShortlisted(app.applicantId) ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold">
                                #{getShortlistRank(app.applicantId)}
                              </span>
                              <button
                                onClick={() => handleRemoveShortlist(app.applicantId)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map(rank => (
                                <button
                                  key={rank}
                                  onClick={() => handleShortlist(app.applicantId, rank)}
                                  disabled={shortlisting[app.applicantId] || (shortlist.length >= 4 && !isShortlisted(app.applicantId))}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {rank}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
