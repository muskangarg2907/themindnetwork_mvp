import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';

export const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-brain text-white text-3xl"></i>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Snapshot Feature
        </h1>
        
        <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-4">
          <i className="fas fa-clock text-accent"></i>
          <span className="text-accent font-semibold text-sm">Coming Soon</span>
        </div>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          We're working on improving the Psychological Snapshot feature to provide you with even better insights. This feature will be available again soon!
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/profile')}
            className="w-full bg-primary hover:bg-primaryHover"
          >
            <i className="fas fa-user mr-2"></i>
            Back to Profile
          </Button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 text-slate-600 hover:text-primary transition-colors text-sm font-medium"
          >
            Go to Home
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            <i className="fas fa-tools mr-1"></i>
            Under maintenance • Check back soon
          </p>
        </div>
      </div>
    </div>
  );
};
