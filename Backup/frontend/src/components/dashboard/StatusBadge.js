import React from 'react';
import { STATUS_CONFIG } from '../../constants';

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-neutral-100 text-neutral-700 border border-neutral-200' };
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${config.color}`}>
      {config.label}
    </span>
  );
}

