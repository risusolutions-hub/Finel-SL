import React from 'react';
import { Plus } from 'lucide-react';

export default function CustomersView({ customers, machines, user, setModal }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm">Account Directory</h3>
              <p className="text-xs text-neutral-600 mt-1">{customers.length} total customers</p>
            </div>
            {(user?.role !== 'engineer') && (
              <button 
                onClick={() => setModal('complaint')} 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors shadow-sm"
                title="Create New Ticket"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-700 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200">
                    <tr>
                        <th className="px-6 py-3">Company</th>
                        <th className="px-6 py-3">Service No</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3 text-right">Machines</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {customers.map((c, idx) => {
                        const machineCount = machines.filter(m => m.customerId === (c.id || c._id)).length;
                        const rowKey = c.id || c._id || `cust-${idx}`;
                        return (
                            <tr key={rowKey} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-neutral-900">{c.company || c.name}</td>
                                <td className="px-6 py-4 text-neutral-700">{c.serviceNo || (c.id || c._id)}</td>
                                <td className="px-6 py-4 text-neutral-700">{c.contact || c.phone || 'N/A'}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                                        {machineCount} Assets
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
}
