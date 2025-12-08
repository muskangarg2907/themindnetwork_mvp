import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

        <div className="text-center max-w-3xl z-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-xs mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Powered by Gemini 2.5 Flash
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">TheMindNetwork</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                India's most trusted platform for connecting clients and mental health professionals. 
                Create your verified profile in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                    onClick={() => navigate('/create')}
                    className="text-lg px-8 py-4 rounded-xl"
                >
                    Get Started <i className="fas fa-arrow-right ml-2"></i>
                </Button>
                
                {localStorage.getItem('userProfile') && (
                     <Button 
                        variant="secondary"
                        onClick={() => navigate('/profile')}
                        className="text-lg px-8 py-4 rounded-xl"
                    >
                        Go to Profile <i className="fas fa-user ml-2"></i>
                    </Button>
                )}
            </div>
        </div>
        
        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 z-10 max-w-5xl w-full">
            {[
                { icon: 'fa-shield-heart', title: 'Verified Profiles', desc: 'Rigorous vetting process to ensure community trust and safety.' },
                { icon: 'fa-wand-magic-sparkles', title: 'AI Assistant', desc: 'Our smart system helps generate professional bios and summaries.' },
                { icon: 'fa-comments', title: 'Smart Support', desc: 'Integrated chat support to help you through the onboarding process.' }
            ].map((f, i) => (
                <div key={i} className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-colors">
                    <div className="w-12 h-12 bg-teal-600/20 rounded-lg flex items-center justify-center text-teal-400 mb-4 text-xl">
                        <i className={`fas ${f.icon}`}></i>
                    </div>
                    <h3 className="text-white font-bold mb-2">{f.title}</h3>
                    <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
            ))}
        </div>
    </div>
  );
};