// Replaced by StepClinical.tsx, but kept file to avoid build errors if imported elsewhere, 
// though logically this file is now obsolete. We will overwrite it with Clinical Data logic.

import React from 'react';
import { UserProfile } from '../../types';
import { Input, TextArea } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

export const StepClinical: React.FC<StepProps> = ({ data, updateData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateData('clinical', { ...data.clinical, [e.target.name]: e.target.value });
  };

  const handleRiskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Comma separated simple implementation
    const risks = e.target.value.split(',').map(s => s.trim());
    updateData('clinical', { ...data.clinical, riskFactors: risks });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Clinical Intake</h2>
        <p className="text-slate-500">Help us understand how we can support you.</p>
      </div>

      <TextArea
        label="What brings you to therapy today? (Presenting Problem)"
        name="presentingProblem"
        placeholder="Please describe your main concerns, symptoms, or life events..."
        value={data.clinical.presentingProblem}
        onChange={handleChange}
        className="h-32"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Current Mood (1-10)" 
          name="currentMood" 
          placeholder="e.g. 6" 
          value={data.clinical.currentMood} 
          onChange={handleChange}
        />
        <div className="flex flex-col gap-1.5 pt-7">
             <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                    type="checkbox"
                    checked={data.clinical.hasPriorTherapy}
                    onChange={(e) => updateData('clinical', { ...data.clinical, hasPriorTherapy: e.target.checked })}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-slate-700 font-medium">I have attended therapy before</span>
             </label>
        </div>
      </div>

      <Input 
        label="Are you currently taking any medications?" 
        name="medications" 
        placeholder="List any relevant medications or 'None'" 
        value={data.clinical.medications} 
        onChange={handleChange}
      />

      <Input 
        label="Specific Symptoms/Risk Factors" 
        name="riskFactors" 
        placeholder="e.g. Anxiety, Insomnia, Panic Attacks" 
        value={data.clinical.riskFactors.join(', ')} 
        onChange={handleRiskChange}
      />
    </div>
  );
};