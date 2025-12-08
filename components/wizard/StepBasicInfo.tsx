
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { Input } from '../ui/Input';

interface StepProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
}

export const StepBasicInfo: React.FC<StepProps> = ({ data, updateData }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
     // Pre-fill phone if available from login
     const savedPhone = localStorage.getItem('userPhone');
     if (savedPhone && !data.basicInfo.phone) {
         updateData('basicInfo', { ...data.basicInfo, phone: savedPhone });
     }
  }, []);

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    
    // Auto-capitalize Name and Location
    if (name === 'fullName' || name === 'location') {
        value = toTitleCase(value);
    }

    updateData('basicInfo', { ...data.basicInfo, [name]: value });
    
    // Clear error when user types
    if (value.trim() !== '') {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Basic Information</h2>
        <p className="text-slate-500">Fields marked with <span className="text-red-500">*</span> are mandatory.</p>
      </div>
      
      <Input 
        label="Full Name *" 
        name="fullName" 
        placeholder="e.g. Dr. Rajesh Kumar" 
        value={data.basicInfo.fullName} 
        onChange={handleChange}
        autoFocus
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Date of Birth *" 
          name="dob" 
          type="date"
          value={data.basicInfo.dob || ''} 
          onChange={handleChange}
        />
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
            <select
                name="gender"
                value={data.basicInfo.gender || ''}
                onChange={handleChange}
                className="bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
            >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
            </select>
        </div>
      </div>

      <Input 
        label="Location (City, State)" 
        name="location" 
        placeholder="e.g. Mumbai, Maharashtra" 
        value={data.basicInfo.location} 
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Professional Email Address *" 
          name="email" 
          type="email"
          placeholder="doctor@themindnetwork.in" 
          value={data.basicInfo.email} 
          onChange={handleChange}
          error={errors.email}
        />
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 ml-1">
                Phone Number *
            </label>
            <input
                name="phone"
                type="tel"
                value={data.basicInfo.phone}
                readOnly
                className="bg-slate-100 border border-slate-300 text-slate-500 cursor-not-allowed rounded-lg px-4 py-3 focus:outline-none shadow-sm"
            />
            <span className="text-xs text-slate-400 ml-1">Verified via OTP</span>
        </div>
      </div>
    </div>
  );
};
