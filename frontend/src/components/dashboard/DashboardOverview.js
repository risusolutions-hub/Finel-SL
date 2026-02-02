
import React from 'react';
import { AlertCircle, RefreshCcw, CheckCircle2, Cpu, Plus } from 'lucide-react';
import StatCard from './StatCard';
import StatusBadge from './StatusBadge';
import EngineerWidget from './EngineerWidget';

export default function DashboardOverview({ complaints, customers, machines, setCurrentView, setModal, user, engineers }) {
  const counts = {
    new: complaints.filter(c => c.status === 'pending').length,
    active: complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length,
    resolved: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    machines: machines.length
  };

  const statusLabels = {
    pending: 'New',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
  };

  return (
    <div className="fade-in space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Open Tickets" 
          value={counts.new} 
          Icon={AlertCircle} 
          color="text-error-600" 
          bg="bg-error-50" 
        />
        <StatCard 
          label="Active Service" 
          value={counts.active} 
          Icon={RefreshCcw} 
          color="text-primary-600" 
          bg="bg-primary-50" 
        />
        <StatCard 
          label="Resolved (30d)" 
          value={counts.resolved} 
          Icon={CheckCircle2} 
          color="text-success-600" 
          bg="bg-success-50" 
        />
        <StatCard 
          label="Fleet Size" 
          value={counts.machines} 
          Icon={Cpu} 
          color="text-secondary-600" 
          bg="bg-secondary-50" 
        />
      </div>

      {/* Engineer Status Widget */}
      <EngineerWidget engineers={engineers || []} />

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">Recent Activity</h3>
            <p className="text-xs text-neutral-600 mt-1">{complaints.length} active tickets</p>
          </div>
          <div className="flex items-center gap-2">
            {(user?.role !== 'engineer') && (
              <button 
                onClick={() => setModal('complaint')} 
                className="bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors shadow-sm"
                title="Create New Ticket"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}
            <button 
              onClick={() => setCurrentView('complaints')} 
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-700 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3">Ticket ID</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Machine</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {complaints.slice(0, 5).map((c, idx) => {
                const safe = (id) => (id && String(id).trim() && String(id) !== 'undefined') ? String(id) : null;
                const cCustId = safe(c.customerId);
                const cMachId = safe(c.machineId);
                const cust = customers.find(cu => (safe(cu.id) || safe(cu._id)) === cCustId);
                const mach = machines.find(m => (safe(m.id) || safe(m._id)) === cMachId);
                const keyId = safe(c.id) || safe(c._id) || safe(c.complaintId);
                const finalKey = keyId || `ov-${idx}`;
                const displayId = c.displayId || c.complaintId || (safe(c.id) ? `#${safe(c.id)}` : `#${idx}`);
                return (
                  <tr key={finalKey} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary-600 font-medium">
                      {displayId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{cust?.company || cust?.name || 'Unknown'}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{cust?.serviceNo || `ID: ${cust ? (safe(cust.id) || safe(cust._id)) : 'N/A'}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-neutral-800 font-medium">{mach?.model || '-'}</div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">{mach?.serialNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={statusLabels[c.status] || c.status} />
                    </td>
                  </tr>
                );
              })}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-neutral-400 italic">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
