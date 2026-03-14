import * as React from 'react';
import { useEffect, useState } from 'react';
import { ReferralRequest } from '../types';

interface CreateReferralFormProps {
  phoneNumber: string;
  onSuccess: (requestId: string) => void;
  onCancel: () => void;
  initialData?: ReferralRequest | null;
}

export const CreateReferralForm: React.FC<CreateReferralFormProps> = ({
  phoneNumber,
  onSuccess,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    clientInitials: '',
    clientType: 'individual',
    clientAge: '',
    concerns: '',
    genderPreference: [] as string[],
    languages: '',
    mode: [] as string[],
    location: '',
    budgetRange: '',
    urgency: 'Medium',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successLink, setSuccessLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const isEditMode = Boolean(initialData?.requestId);

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      clientInitials: initialData.clientInitials || '',
      clientType: initialData.clientType || 'individual',
      clientAge: initialData.clientAge ? String(initialData.clientAge) : '',
      concerns: initialData.concerns || '',
      genderPreference: initialData.genderPreference || [],
      languages: initialData.languages || '',
      mode: initialData.mode || [],
      location: initialData.location || '',
      budgetRange: initialData.budgetRange || '',
      urgency: initialData.urgency || 'Medium',
      notes: initialData.notes || ''
    });
  }, [initialData]);

  const genderOptions = ['Female', 'Male', 'Non-Binary', 'Any'];
  const modeOptions = ['Online', 'Offline', 'Hybrid'];

  const handleGenderToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      genderPreference: prev.genderPreference.includes(option)
        ? prev.genderPreference.filter(g => g !== option)
        : [...prev.genderPreference, option]
    }));
  };

  const handleModeToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      mode: prev.mode.includes(option)
        ? prev.mode.filter(m => m !== option)
        : [...prev.mode, option]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.concerns.trim()) {
      setError('Please describe the client concerns');
      setLoading(false);
      return;
    }

    if (formData.mode.length === 0) {
      setError('Please select at least one mode');
      setLoading(false);
      return;
    }

    if ((formData.mode.includes('Offline') || formData.mode.includes('Hybrid')) && !formData.location.trim()) {
      setError('Please specify location for offline/hybrid sessions');
      setLoading(false);
      return;
    }

    if (!formData.budgetRange.trim()) {
      setError('Please specify budget range');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/referrals?action=${isEditMode ? 'update' : 'create'}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Phone': phoneNumber
        },
        body: JSON.stringify({
          requestId: initialData?.requestId || (initialData as any)?._id || (initialData as any)?.id,
          referralId: (initialData as any)?._id || (initialData as any)?.id,
          clientInitials: formData.clientInitials,
          clientType: formData.clientType,
          clientAge: formData.clientAge ? parseInt(formData.clientAge, 10) : undefined,
          concerns: formData.concerns,
          genderPreference: formData.genderPreference.length > 0 ? formData.genderPreference : ['Any'],
          languages: formData.languages || 'Any',
          mode: formData.mode,
          location: formData.location,
          budgetRange: formData.budgetRange,
          urgency: formData.urgency,
          notes: formData.notes
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to ${isEditMode ? 'update' : 'create'} request`);
      }

      const data = await response.json();
      if (isEditMode) {
        onSuccess(data.requestId || initialData?.requestId || '');
        return;
      }

      setSuccessLink(`themindnetwork.in/#/referral/${data.requestId}`);
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEditMode ? 'update' : 'create'} referral`;
      console.error('[REFERRAL FORM ERROR]', {
        error: errorMsg,
        message: err.message,
        formData
      });
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (successLink) {
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-4xl">
        <h3 className="text-base font-semibold text-green-900 mb-2">✓ Referral Request Created!</h3>
        <p className="text-xs text-green-700 mb-3">Share this link with potential providers:</p>
        <div className="flex gap-2 mb-4">
          <code className="flex-1 bg-white p-2 rounded border border-green-200 text-xs break-all">
            {successLink}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(successLink);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className={`px-3 py-2 rounded text-xs whitespace-nowrap transition-colors ${
              linkCopied ? 'bg-green-700 text-white' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {linkCopied ? <><i className="fas fa-check mr-1"></i>Copied!</> : 'Copy Link'}
          </button>
        </div>
        <button
          onClick={() => {
            onSuccess(successLink.split('/').pop() || '');
          }}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 space-y-4 max-w-4xl">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        {isEditMode ? 'Edit Referral Request' : 'Create New Referral Request'}
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client Initials</label>
          <input
            type="text"
            value={formData.clientInitials}
            onChange={(e) => setFormData(prev => ({ ...prev, clientInitials: e.target.value.toUpperCase().substring(0, 12) }))}
            placeholder="e.g., A.K."
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client Type</label>
          <div className="relative">
            <select
              value={formData.clientType}
              onChange={(e) => setFormData(prev => ({ ...prev, clientType: e.target.value }))}
              className="w-full appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
            >
              <option value="individual">Individual</option>
              <option value="couple">Couple</option>
              <option value="group">Group</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" aria-hidden="true"></i>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client Age (Optional)</label>
          <input
            type="number"
            value={formData.clientAge}
            onChange={(e) => setFormData(prev => ({ ...prev, clientAge: e.target.value }))}
            placeholder="e.g., 28"
            min="13"
            max="100"
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Client Concerns *</label>
        <textarea
          value={formData.concerns}
          onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
          placeholder="Describe the client's presenting concerns..."
          rows={3}
          className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gender Preference</label>
          <div className="grid grid-cols-2 gap-2">
            {genderOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleGenderToggle(option)}
                className={`px-2 py-1.5 rounded border text-xs transition-all ${
                  formData.genderPreference.includes(option)
                    ? 'bg-teal-50 border-teal-400 text-teal-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-teal-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mode of Therapy *</label>
          <div className="grid grid-cols-2 gap-2">
            {modeOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleModeToggle(option)}
                className={`px-2 py-1.5 rounded border text-xs transition-all ${
                  formData.mode.includes(option)
                    ? 'bg-teal-50 border-teal-400 text-teal-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-teal-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Languages (Optional)</label>
          <input
            type="text"
            value={formData.languages}
            onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
            placeholder="English, Hindi"
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Budget (INR) *</label>
          <input
            type="text"
            value={formData.budgetRange}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetRange: e.target.value }))}
            placeholder="1000-2000"
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
          <div className="relative">
            <select
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as 'Low' | 'Medium' | 'High' }))}
              className="w-full appearance-none bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      {(formData.mode.includes('Offline') || formData.mode.includes('Hybrid')) && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Mumbai, Andheri"
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes (Max 200 chars)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            notes: e.target.value.substring(0, 200)
          }))}
          placeholder="Any additional information..."
          rows={2}
          className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/200</p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Request')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
