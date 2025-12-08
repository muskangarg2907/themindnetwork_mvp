import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-slate-700 ml-1">
        {label}
      </label>
      <input
        className={`bg-white border ${error ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-slate-300 text-slate-900 placeholder-slate-400'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-600 ml-1">{error}</span>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-slate-700 ml-1">
        {label}
      </label>
      <textarea
        className={`bg-white border ${error ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-slate-300 text-slate-900 placeholder-slate-400'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all min-h-[120px] resize-none shadow-sm ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-600 ml-1">{error}</span>}
    </div>
  );
};