
import React, { useRef } from 'react';
import { UserProfile } from '../../types';
import { Input, TextArea } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

export const StepProviderProfessional: React.FC<StepProps> = ({ data, updateData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit check
          alert("File size should be less than 2MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         const base64String = reader.result as string;
         updateData('providerDetails', { 
             ...details, 
             resumeFileName: file.name,
             resumeFileData: base64String
         });
      };
      reader.readAsDataURL(file);
    }
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
        label="Specializations (Comma separated) *"
        name="specializations"
        placeholder="e.g. Trauma, Anxiety, Depression, CBT"
        value={details.specializations.join(', ')}
        onChange={(e) => handleArrayChange('specializations', e.target.value)}
        className="h-24"
      />

      <div className="space-y-4 pt-2">
         <h3 className="text-sm font-semibold text-slate-700">Resume / CV (Optional)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
                label="Link to Resume (LinkedIn/Drive)" 
                name="resumeLink" 
                placeholder="https://linkedin.com/in/..." 
                value={details.resumeLink} 
                onChange={handleChange}
            />
            
            <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 ml-1">Upload File</label>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-white border border-slate-300 text-slate-600 rounded-lg px-4 py-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-sm text-left flex items-center justify-between"
                    >
                        <span className="truncate text-sm">
                            {details.resumeFileName ? details.resumeFileName : 'Choose PDF/Doc...'}
                        </span>
                        <i className="fas fa-cloud-upload-alt text-teal-600"></i>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                     {details.resumeFileName && (
                         <button 
                            onClick={() => updateData('providerDetails', { ...details, resumeFileName: '', resumeFileData: '' })}
                            className="text-red-500 hover:text-red-700 p-2"
                            title="Remove file"
                         >
                            <i className="fas fa-trash"></i>
                         </button>
                     )}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
