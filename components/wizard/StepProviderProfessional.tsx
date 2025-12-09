
import React from 'react';
import { UserProfile } from '../../types';
import { Input, TextArea } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

export const StepProviderProfessional: React.FC<StepProps> = ({ data, updateData }) => {
  const details = data.providerDetails || {
    qualification: '', yearsExperience: '', specializations: [], mode: 'online', languages: [], clientType: [], budgetRange: '', licenses: '', therapeuticFocus: '', therapyStyle: '', resumeLink: '', resumeFileName: ''
  };

  const updateDetails = (key: string, value: any) => {
    updateData('providerDetails', { ...details, [key]: value });
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    // Auto-capitalize Qualification and Licenses
    if (name === 'qualification' || name === 'licenses') {
        value = toTitleCase(value);
    }
    
    updateDetails(name, value);
  };

  const handleArrayChange = (name: string, value: string) => {
    // Split, capitalize each word, and trim
    const arr = value.split(',').map(s => toTitleCase(s.trim()));
    updateDetails(name, arr);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Professional Background</h2>
        <p className="text-slate-500">Tell us about your qualifications and experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Highest Qualification *" 
          name="qualification" 
          placeholder="e.g. M.Phil in Clinical Psychology" 
          value={details.qualification} 
          onChange={handleChange}
        />
        <Input 
          label="Years of Experience *" 
          name="yearsExperience" 
          type="number"
          placeholder="e.g. 5" 
          value={details.yearsExperience} 
          onChange={handleChange}
        />
      </div>

      <Input 
        label="Licenses & Certifications" 
        name="licenses" 
        placeholder="e.g. RCI License No. A12345" 
        value={details.licenses} 
        onChange={handleChange}
      />

      <TextArea
        label="Specializations *"
        name="specializations"
        placeholder="e.g. Trauma, Anxiety, Depression, CBT"
        value={details.specializations.join(', ')}
        onChange={(e) => handleArrayChange('specializations', e.target.value)}
        className="h-24"
      />
    </div>
  );
};
