import React from 'react';

interface StatusBadgeProps {
  status: 'approved' | 'pending_verification' | 'rejected' | string | undefined;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (!status) return null;
  let text = '';
  let classes = '';

  switch (status) {
    case 'approved':
      text = 'Approved';
      classes = 'bg-green-100 text-green-700';
      break;
    case 'pending_verification':
      text = 'Pending Approval';
      classes = 'bg-yellow-100 text-yellow-800';
      break;
    case 'rejected':
      text = 'Rejected';
      classes = 'bg-orange-100 text-orange-700';
      break;
    default:
      text = status;
      classes = 'bg-slate-100 text-slate-700';
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${classes}`}>{text}</span>
  );
};
