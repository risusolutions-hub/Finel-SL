import React, { useMemo, useState } from 'react';

export default function SparePartsUsedPage({ complaints, machines, customers }) {
  // Gather all spare parts used from completed/closed complaints
  const allSpares = useMemo(() => {
    const spares = [];
    complaints.forEach(c => {
      if (Array.isArray(c.sparesUsed)) {
        c.sparesUsed.forEach(part => {
          spares.push({
            part: typeof part === 'string' ? part : (part.name || part.partName || JSON.stringify(part)),
            engineer: c.engineer?.name || '-',
            time: c.completedAt || c.closedAt || c.updatedAt,
            ticket: c.displayId || c._id || c.id,
            customer: (() => {
              const machine = machines.find(m => m.id === c.machineId) || {};
              const customer = customers.find(cu => cu.id === machine.customerId) || {};
              return customer.company || customer.name || '-';
            })(),
            machine: (() => {
              const machine = machines.find(m => m.id === c.machineId) || {};
              return machine.model || '-';
            })()
          });
        });
      }
    });
    return spares;
  }, [complaints, machines, customers]);

  // Filters
  const [engineerFilter, setEngineerFilter] = useState('');
  const [partFilter, setPartFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  const filteredSpares = allSpares.filter(s =>
    (!engineerFilter || s.engineer.toLowerCase().includes(engineerFilter.toLowerCase())) &&
    (!partFilter || s.part.toLowerCase().includes(partFilter.toLowerCase())) &&
    (!customerFilter || s.customer.toLowerCase().includes(customerFilter.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Spare Parts Used</h2>
      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Filter by Engineer"
          value={engineerFilter}
          onChange={e => setEngineerFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          type="text"
          placeholder="Filter by Part"
          value={partFilter}
          onChange={e => setPartFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          type="text"
          placeholder="Filter by Customer"
          value={customerFilter}
          onChange={e => setCustomerFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      {filteredSpares.length === 0 ? (
        <p className="text-blue-700 text-sm">No spare parts match the filters.</p>
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
              {filteredSpares.map((s, idx) => (
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
