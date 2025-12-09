
import React from 'react';
import { UserProfile } from '../../types';
import { Input, TextArea } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

export const StepProviderPractice: React.FC<StepProps> = ({ data, updateData }) => {
  const details = data.providerDetails || {
    qualification: '', yearsExperience: '', specializations: [], mode: 'online', languages: [], clientType: [], budgetRange: '', licenses: '', therapeuticFocus: '', therapyStyle: '', resumeLink: ''
  };

  const updateDetails = (key: string, value: any) => {
    updateData('providerDetails', { ...details, [key]: value });
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Capitalize specific fields
    if (['offlineLocation', 'budgetRange', 'therapeuticFocus'].includes(name)) {
        value = toTitleCase(value);
    }

    updateDetails(name, value);
  };

   const handleArrayChange = (name: string, value: string) => {
    const arr = value.split(',').map(s => toTitleCase(s.trim()));
    updateDetails(name, arr);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Practice Details</h2>
        <p className="text-slate-500">How do you work with clients?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 ml-1">Preferred Mode *</label>
            <select
                name="mode"
                value={details.mode}
                onChange={handleChange}
                className="bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            >
                <option value="online">Online Only</option>
                <option value="offline">In-Person Only</option>
                <option value="both">Hybrid (Both)</option>
            </select>
        </div>
        
        {details.mode !== 'online' && (
             <Input 
                label="Offline Location (City & Area)" 
                name="offlineLocation" 
                placeholder="e.g. Indiranagar, Bangalore" 
                value={details.offlineLocation || ''} 
                onChange={handleChange}
            />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Languages Spoken" 
          name="languages" 
          placeholder="e.g. English, Hindi, Marathi" 
          value={details.languages.join(', ')} 
          onChange={(e) => handleArrayChange('languages', e.target.value)}
        />
        <Input 
          label="Budget Range (per session) *" 
          name="budgetRange" 
          placeholder="e.g. ₹ 1000 - ₹ 2000" 
          value={details.budgetRange} 
          onChange={handleChange}
        />
      </div>

      <TextArea
          label="Client Types *" 
          name="clientType" 
          placeholder="e.g.&#10;Individuals&#10;Couples&#10;Families&#10;Teenagers&#10;Adults" 
          value={details.clientType.join('\n')} 
          onChange={(e) => {
            const arr = e.target.value.split('\n').map(s => toTitleCase(s.trim())).filter(Boolean);
            updateDetails('clientType', arr);
          }}
          rows={4}
      />

       <Input 
          label="Therapeutic Focus Area" 
          name="therapeuticFocus" 
          placeholder="e.g. Child Development, Trauma Recovery" 
          value={details.therapeuticFocus} 
          onChange={handleChange}
      />

      <TextArea
        label="What is your style of therapy?"
        name="therapyStyle"
        placeholder="Describe your approach (e.g. Solution-focused, Psychodynamic, collaborative...)"
        value={details.therapyStyle}
        onChange={handleChange}
        className="h-24"
      />
      
      <Input 
        label="Personal Website" 
        name="website" 
        placeholder="https://..." 
        value={details.website || ''} 
        onChange={handleChange}
      />
    </div>
  );
};
