import React from 'react';

export default function SparePartsUsedPanel({ allSpares }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-900 mb-2">Spare Parts Used</h4>
      {allSpares.length === 0 ? (
        <p className="text-blue-700 text-sm">No spare parts used in completed/closed tickets.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-200 rounded-lg text-xs">
            <thead>
              <tr className="bg-blue-100">
                <th className="px-2 py-1 font-bold text-blue-900">Part</th>
                <th className="px-2 py-1 font-bold text-blue-900">Engineer</th>
                <th className="px-2 py-1 font-bold text-blue-900">Time</th>
                <th className="px-2 py-1 font-bold text-blue-900">Ticket</th>
                <th className="px-2 py-1 font-bold text-blue-900">Customer</th>
                <th className="px-2 py-1 font-bold text-blue-900">Machine</th>
              </tr>
            </thead>
            <tbody>
              {allSpares.map((s, idx) => (
                <tr key={idx} className="border-b border-blue-100">
                  <td className="px-2 py-1">{s.part}</td>
                  <td className="px-2 py-1">{s.engineer}</td>
                  <td className="px-2 py-1">{s.time ? new Date(s.time).toLocaleString() : '-'}</td>
                  <td className="px-2 py-1">{s.ticket}</td>
                  <td className="px-2 py-1">{s.customer}</td>
                  <td className="px-2 py-1">{s.machine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
