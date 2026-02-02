import React from 'react';

export default function StatCard({ label, value, Icon, color, bg }) {
  return (
    <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-sm font-medium">{label}</p>
          <h4 className="text-3xl font-bold text-neutral-900 mt-2">{value}</h4>
        </div>
        <div className={`p-3 rounded-md ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
