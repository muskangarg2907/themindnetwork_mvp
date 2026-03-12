import * as React from 'react';
import { useState } from 'react';
import { ReferralRequest } from '../types';
import { CreateReferralForm } from './CreateReferralForm';
import { MyReferralsTable } from './MyReferralsTable';

interface ReferralTabProps {
  phoneNumber: string;
  role?: string;
}

export const ReferralTab: React.FC<ReferralTabProps> = ({ phoneNumber, role }) => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingRequest, setEditingRequest] = useState<ReferralRequest | null>(null);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRequest(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
            {role === 'provider' ? 'Have a client referral?' : 'Looking for a therapist for someone else?'}
          </h2>
        {!showForm && (
          <button
            onClick={() => {
              setEditingRequest(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Referral
          </button>
        )}
      </div>

      {/* Create Form Section */}
      {showForm && (
        <CreateReferralForm
          phoneNumber={phoneNumber}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingRequest(null);
          }}
          initialData={editingRequest}
        />
      )}

      {/* My Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <MyReferralsTable
          phoneNumber={phoneNumber}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Referrals Work:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Create a referral request</li>
          <li>Copy the link and share with potential providers in your network</li>
          <li>Providers apply directly through the public referral page</li>
          <li>Providers on the TheMindNetwork also apply</li>
          <li>Close requests when you've found the right match</li>
        </ul>
      </div>
    </div>
  );
};
