
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Input, TextArea } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

const CLIENT_TYPE_OPTIONS = [
  'Individuals',
  'Couples',
  'Families',
  'Children',
  'Teenagers',
  'Adults',
  'Elderly',
  'Groups'
];

export const StepProviderPractice: React.FC<StepProps> = ({ data, updateData }) => {
  const details = data.providerDetails || {
    qualification: '', yearsExperience: '', specializations: [], mode: 'online', languages: [], clientType: [], budgetRange: '', licenses: '', therapeuticFocus: '', therapyStyle: '', resumeLink: '', resumeFileName: '', resumeFileData: ''
  };
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const updateDetails = (key: string, value: any) => {
    updateData('providerDetails', { ...details, [key]: value });
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
   const handleArrayChange = (name: string, value: string) => {
    const arr = value.split(',').map(s => toTitleCase(s.trim()));
    updateDetails(name, arr);
  };
  
  const toggleClientType = (type: string) => {
    const current = details.clientType || [];
    const newTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateDetails('clientType', newTypes);
  };
  
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateDetails('resumeFileData', base64);
        updateDetails('resumeFileName', file.name);
      };
      reader.readAsDataURL(file);
    }
  };let { name, value } = e.target;

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

      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-slate-700 ml-1">Client Types *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CLIENT_TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleClientType(type)}
              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${
                (details.clientType || []).includes(type)
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {(!details.clientType || details.clientType.length === 0) && (
          <span className="text-xs text-slate-500 ml-1">Select at least one client type</span>
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
      
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-slate-700 ml-1">
          Upload Resume/CV (Optional)
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg px-4 py-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all"
          >
            <i className="fas fa-cloud-upload-alt text-xl"></i>
            <span className="font-medium">
              {resumeFile ? resumeFile.name : 'Click to upload PDF or DOC (max 5MB)'}
            </span>
          </label>
          {resumeFile && (
            <button
              type="button"
              onClick={() => {
                setResumeFile(null);
                updateDetails('resumeFileData', '');
                updateDetails('resumeFileName', '');
              }}
              className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
        <span className="text-xs text-slate-500 ml-1">
          Accepted formats: PDF, DOC, DOCX (Maximum size: 5MB)
        </span>
      </div>
    </div>
  );
};       <Input 
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
