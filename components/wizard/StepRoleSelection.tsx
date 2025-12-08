
import React from 'react';
import { UserRole } from '../../types';

interface StepProps {
  setRole: (role: UserRole) => void;
}

export const StepRoleSelection: React.FC<StepProps> = ({ setRole }) => {
  return (
    <div className="space-y-8 animate-fade-in py-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to The Mind Network</h2>
        <p className="text-slate-500">Please tell us who you are to get started.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Card */}
        <button 
            onClick={() => setRole('client')}
            className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 text-left"
        >
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-hand-holding-heart text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">I'm seeking therapy</h3>
            <p className="text-sm text-slate-500 text-center">
                I'm looking for professional support for my mental well-being.
            </p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-check-circle text-teal-500 text-xl"></i>
            </div>
        </button>

        {/* Provider Card */}
        <button 
            onClick={() => setRole('provider')}
            className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 text-left"
        >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-doctor text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">I'm a provider</h3>
            <p className="text-sm text-slate-500 text-center">
                I'm a mental health professional looking to join the network.
            </p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-check-circle text-blue-500 text-xl"></i>
            </div>
        </button>
      </div>
    </div>
  );
};
