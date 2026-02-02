import React from 'react';
import { UserCheck, UserX } from 'lucide-react';

export default function EngineerWidget({ engineers }) {
  // engineers: array of { name, status, isCheckedIn }
  return (
    <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-indigo-600" /> Engineer Status
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {engineers.map((e, idx) => (
          <div key={e.id || e._id || `engineer-${idx}`} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 bg-neutral-50">
            <div className={`w-3 h-3 rounded-full mr-2 ${e.isCheckedIn ? (e.status === 'busy' ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300'}`}></div>
            <div className="flex-1">
              <div className="font-medium text-neutral-900">{e.name}</div>
              <div className="text-xs text-neutral-500">{e.isCheckedIn ? (e.status === 'busy' ? 'Busy' : 'Free') : 'Offline'}</div>
            </div>
            {e.isCheckedIn ? (
              e.status === 'busy' ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        ))}
        {engineers.length === 0 && (
          <div className="text-center text-gray-400 col-span-2">No engineers found</div>
        )}
      </div>
    </div>
  );
}
