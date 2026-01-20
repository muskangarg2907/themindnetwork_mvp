import React from 'react';

interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, value, onChange, rows = 3, className }) => {
  return (
    <div className={className}>
      {label && <label className="block text-xs text-slate-400 mb-1">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
      />
    </div>
  );
};
