import React from 'react';
import { UserProfile } from '../../types';
import { Input } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

export const StepPreferences: React.FC<StepProps> = ({ data, updateData }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('preferences', { ...data.preferences, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Preferences & Insurance</h2>
        <p className="text-slate-500">Help us match you with the right provider.</p>
      </div>

      <Input 
        label="Insurance Provider" 
        name="insuranceProvider" 
        placeholder="e.g. Blue Cross Blue Shield, Aetna, or Self-Pay" 
        value={data.preferences.insuranceProvider} 
        onChange={handleChange}
      />

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold text-slate-700">Provider Preferences</h3>
        
        <Input 
            label="Preferred Provider Gender" 
            name="providerGenderPreference" 
            placeholder="No preference, Female, Male..." 
            value={data.preferences.providerGenderPreference} 
            onChange={handleChange}
        />
        
        <Input 
            label="Communication Style" 
            name="communicationStyle" 
            placeholder="e.g. Direct, Gentle, Listener-focused" 
            value={data.preferences.communicationStyle} 
            onChange={handleChange}
        />
      </div>
    </div>
  );
};