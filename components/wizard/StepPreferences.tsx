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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Provider Preferences</h2>
        <p className="text-slate-500">Help us match you with the right provider.</p>
      </div>

      <Input 
          label="Preferred Provider Gender" 
          name="providerGenderPreference" 
          placeholder="No preference, Female, Male..." 
          value={data.preferences.providerGenderPreference} 
          onChange={handleChange}
      />
    </div>
  );
};