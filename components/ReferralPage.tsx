import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReferralRequest } from '../types';
import { Button } from './ui/Button';

export const ReferralPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ReferralRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) {
        setError('Invalid referral ID');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/referrals?action=view&id=${id}`);
        if (!response.ok) {
          throw new Error('Referral request not found');
        }
        const data = await response.json();
        setRequest(data);

        // Check if user is logged in
        const phone = localStorage.getItem('user_phone');
        if (phone) {
          setUserPhone(phone);
          try {
            const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
            setUserRole(stored.role || '');
          } catch { setUserRole(''); }
        } else {
          setUserPhone('');
          setUserRole('');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load referral');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const handleApply = async () => {
    // If not logged in, redirect to login with return URL
    if (!userPhone) {
      // Store the path (without #) for post-login redirect
      const redirectPath = window.location.hash.replace(/^#/, '') || `/referral/${id}`;
      localStorage.setItem('referral_page_redirect', redirectPath);
      navigate('/login');
      return;
    }

    if (!request) return;

    setIsApplying(true);
    setApplyError('');
    try {
      const response = await fetch('/api/referrals?action=apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': userPhone
        },
        body: JSON.stringify({
          requestId: request.requestId,
          name: localStorage.getItem('userProfile')
            ? JSON.parse(localStorage.getItem('userProfile') || '{}').basicInfo?.fullName
            : 'Provider',
          exp: localStorage.getItem('userProfile')
            ? JSON.parse(localStorage.getItem('userProfile') || '{}').providerDetails?.yearsExperience
            : '',
          degrees: localStorage.getItem('userProfile')
            ? JSON.parse(localStorage.getItem('userProfile') || '{}').providerDetails?.qualification
            : '',
          modalities: localStorage.getItem('userProfile')
            ? [JSON.parse(localStorage.getItem('userProfile') || '{}').providerDetails?.mode]
            : [],
          fee: localStorage.getItem('userProfile')
            ? JSON.parse(localStorage.getItem('userProfile') || '{}').providerDetails?.budgetRange
            : '',
          languages: localStorage.getItem('userProfile')
            ? JSON.parse(localStorage.getItem('userProfile') || '{}').providerDetails?.languages?.join(', ')
            : '',
          location: localStorage.getItem('userProfile')
            ? JSON.parse(localStorage.getItem('userProfile') || '{}').providerDetails?.offlineLocation
            : ''
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to apply');
      }

      setApplySuccess(true);
      setTimeout(() => navigate('/profile'), 2500);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Referral request not found</p>
        </div>
      </div>
    );
  }

  const isActive = request.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Request</h1>
          <p className="text-gray-600 mt-2">Interested in this case? Apply below!</p>
        </div>

        {/* Status Badge */}
        {!isActive && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
            This referral request is currently closed and not accepting new applications.
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Request Details */}
          <div className="space-y-6">
            {/* Client Initials */}
            {request.clientInitials && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Initials</label>
                <p className="text-lg font-semibold text-gray-900 tracking-wide">{request.clientInitials}</p>
              </div>
            )}

            {/* Client Type & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <p className="text-lg font-semibold text-gray-900 capitalize">{request.clientType}</p>
              </div>
              {request.clientAge && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <p className="text-lg font-semibold text-gray-900">{request.clientAge} years</p>
                </div>
              )}
            </div>

            {/* Concerns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Concerns</label>
              <p className="text-gray-900 whitespace-pre-wrap">{request.concerns}</p>
            </div>

            {/* Gender Preference */}
            {request.genderPreference && request.genderPreference.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender Preference</label>
                <div className="flex flex-wrap gap-2">
                  {request.genderPreference.map(gender => (
                    <span key={gender} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {gender}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mode of Therapy */}
            {request.mode && request.mode.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Therapy</label>
                <div className="flex flex-wrap gap-2">
                  {request.mode.map(mode => (
                    <span key={mode} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {request.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{request.location}</p>
              </div>
            )}

            {/* Languages */}
            {request.languages && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                <p className="text-gray-900">{request.languages}</p>
              </div>
            )}

            {/* Budget & Urgency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range Per Session (in INR)</label>
                <p className="text-lg font-semibold text-gray-900">{request.budgetRange}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <span className={`inline-block px-3 py-1 rounded font-semibold text-sm ${
                  request.urgency === 'High'
                    ? 'bg-red-100 text-red-800'
                    : request.urgency === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {request.urgency}
                </span>
              </div>
            </div>

            {/* Notes */}
            {request.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <p className="text-gray-900 text-sm">{request.notes}</p>
              </div>
            )}

            {/* Created Date */}
            <div className="border-t border-gray-200 pt-4 text-xs text-gray-600">
              Posted on {new Date(request.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* Apply Section */}
        {isActive && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {applySuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-green-600 text-3xl"></i>
                </div>
                <h2 className="text-xl font-bold text-green-800 mb-2">Successfully Applied!</h2>
                <p className="text-gray-600 mb-6">The client will review your profile and may reach out if interested.</p>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-lg mb-3"
                >
                  <i className="fas fa-arrow-right mr-2"></i>Go to Profile
                </button>
                <p className="text-sm text-gray-500">Or wait to be redirected automatically...</p>
              </div>
            ) : userPhone && userRole === 'client' ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Provider Account Required</h2>
                <p className="text-gray-600 mb-4">
                  Only registered providers can apply to referral requests. You are currently logged in as a client.
                </p>
                <p className="text-sm text-gray-500">
                  If you are a therapist or counselor, please create a provider account to apply.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ready to Help?</h2>
                <p className="text-gray-600 mb-6">
                  {userPhone
                    ? "Click below to submit your application. The client will review your profile and may reach out if interested."
                    : "Please log in to apply. If you don't have an account yet, first create a provider profile."}
                </p>
                {applyError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {applyError}
                  </div>
                )}
                <button
                  onClick={handleApply}
                  disabled={isApplying || !isActive}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg"
                >
                  {isApplying ? 'Submitting...' : userPhone ? 'Submit Application' : 'Log In to Apply'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
