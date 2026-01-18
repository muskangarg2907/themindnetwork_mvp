
import React from 'react';
import { UserRole } from '../../types';

interface StepProps {
  setRole: (role: UserRole) => void;
}

export const StepRoleSelection: React.FC<StepProps> = ({ setRole }) => {
  return (
    <div className="space-y-8 animate-fade-in py-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Welcome to The Mind Network</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Please tell us who you are to get started.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Card */}
        <button 
            onClick={() => setRole('client')}
            className="group relative flex flex-col items-center p-8 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 text-left"
            style={{ borderColor: 'var(--color-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
        >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                <i className="fas fa-hand-holding-heart text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>I'm seeking therapy</h3>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                I'm looking for professional support for my mental well-being.
            </p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-check-circle text-xl" style={{ color: 'var(--color-primary)' }}></i>
            </div>
        </button>

        {/* Provider Card */}
        <button 
            onClick={() => setRole('provider')}
            className="group relative flex flex-col items-center p-8 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 text-left"
            style={{ borderColor: 'var(--color-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
        >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                <i className="fas fa-user-doctor text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>I'm a provider</h3>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                I'm a mental health professional looking to join the network.
            </p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-check-circle text-xl" style={{ color: 'var(--color-accent)' }}></i>
            </div>
        </button>
      </div>
    </div>
  );
};
