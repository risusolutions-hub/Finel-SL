import React, { useMemo } from 'react';
import { Plus, Download, Eye } from 'lucide-react';
import { saveAs } from 'file-saver';


export default function HistoryView({ machines, customers, complaints, user, setModal }) {
  const [viewDetails, setViewDetails] = React.useState(null);
  // Only completed/closed complaints
  const isSameDay = (date) => {
    if (!date) return false;
    const today = new Date();
    const d = new Date(date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  const filteredComplaints = useMemo(() => {
    let filtered = complaints.filter(c => c.status === 'completed' || c.status === 'closed');
    if (user?.role === 'manager') {
      filtered = filtered.filter(c => isSameDay(c.completedAt || c.closedAt || c.updatedAt));
    }
    return filtered;
  }, [complaints, user]);



  // Download CSV for admin/superadmin
  const handleDownload = () => {
    const csvRows = [
      [
        'Ticket ID', 'Machine', 'Serial', 'Customer', 'Status', 'Created By', 'Assigned By', 'Created At', 'Assigned At', 'Started At', 'Completed At', 'Closed At', 'Issue', 'Resolution', 'Engineer'
      ],
      ...filteredComplaints.map(c => {
        // Ensure all fields are passed correctly to the modal
        const machine = machines.find(m => m._id === c.machineId || m.id === c.machineId) || {};
        const customer = customers.find(cu => cu._id === c.customerId || cu.id === c.customerId) || {};
        return [
          c.displayId || c._id || c.id,
          machine.model || '',
          machine.serialNumber || '',
          customer.company || customer.name || '',
          c.status,
          c.createdBy?.name || '',
          c.assignedBy?.name || '',
          c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
          c.assignedAt ? new Date(c.assignedAt).toLocaleString() : '',
          c.startedAt ? new Date(c.startedAt).toLocaleString() : '',
          c.completedAt ? new Date(c.completedAt).toLocaleString() : '',
          c.closedAt ? new Date(c.closedAt).toLocaleString() : '',
          c.problem || '',
          c.resolution || '',
          c.engineer?.name || ''
        ];
      })
    ];
    const csv = csvRows.map(row => row.map(String).map(v => '"' + v.replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `complaint-history.csv`);
  };

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Complaint History</h3>
          <p className="text-sm text-neutral-600 mt-1">{filteredComplaints.length} completed/closed tickets</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors shadow-sm" title="Download CSV">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-neutral-200 rounded-lg">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Ticket ID</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Machine</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Serial</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Customer</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Status</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Created By</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Assigned By</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Created At</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Assigned At</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Started At</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Completed At</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Closed At</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Issue</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Resolution</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Engineer</th>
              <th className="px-3 py-2 text-xs font-bold text-neutral-700">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map(c => {
              const machine = machines.find(m => m._id === c.machineId || m.id === c.machineId) || {};
              const customer = customers.find(cu => cu._id === c.customerId || cu.id === c.customerId) || {};
              return (
                <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2 text-xs font-mono">{c.displayId || c._id || c.id}</td>
                  <td className="px-3 py-2 text-xs">{machine.model || '-'}</td>
                  <td className="px-3 py-2 text-xs">{machine.serialNumber || '-'}</td>
                  <td className="px-3 py-2 text-xs">{customer.company || customer.name || '-'}</td>
                  <td className="px-3 py-2 text-xs capitalize">{c.status}</td>
                  <td className="px-3 py-2 text-xs">{c.createdBy?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.assignedBy?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.assignedAt ? new Date(c.assignedAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.startedAt ? new Date(c.startedAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.completedAt ? new Date(c.completedAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.closedAt ? new Date(c.closedAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.problem || '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.resolution || '-'}</td>
                  <td className="px-3 py-2 text-xs">{c.engineer?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs">
                    <button onClick={() => setViewDetails({
                      ...c,
                      createdBy: c.createdBy || {},
                      assignedBy: c.assignedBy || {},
                      engineer: c.engineer || {},
                      customer,
                      machine
                    })} className="text-blue-600 hover:text-blue-900" title="View Details">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setViewDetails(null)}>&times;</button>
            <h3 className="text-lg font-bold mb-2">Ticket Details</h3>
            <div className="mb-2 text-sm"><b>Status:</b> {viewDetails.status}</div>
            <div className="mb-2 text-sm"><b>Problem:</b> {viewDetails.problem}</div>
            <div className="mb-2 text-sm"><b>Resolution:</b> {viewDetails.resolution || '-'}</div>
            <div className="mb-2 text-sm"><b>Complete/Close Notes:</b> {viewDetails.solutionNotes || '-'}</div>
            <div className="mb-2 text-sm"><b>Engineer:</b> {viewDetails.engineer?.name || '-'}</div>
            <div className="mb-2 text-sm"><b>Created By:</b> {viewDetails.createdBy?.name || '-'}</div>
            <div className="mb-2 text-sm"><b>Assigned By:</b> {viewDetails.assignedBy?.name || '-'}</div>
            <div className="mb-2 text-sm"><b>Created At:</b> {viewDetails.createdAt ? new Date(viewDetails.createdAt).toLocaleString() : '-'}</div>
            <div className="mb-2 text-sm"><b>Assigned At:</b> {viewDetails.assignedAt ? new Date(viewDetails.assignedAt).toLocaleString() : '-'}</div>
            <div className="mb-2 text-sm"><b>Started At:</b> {viewDetails.startedAt ? new Date(viewDetails.startedAt).toLocaleString() : '-'}</div>
            <div className="mb-2 text-sm"><b>Completed At:</b> {viewDetails.completedAt ? new Date(viewDetails.completedAt).toLocaleString() : '-'}</div>
            <div className="mb-2 text-sm"><b>Closed At:</b> {viewDetails.closedAt ? new Date(viewDetails.closedAt).toLocaleString() : '-'}</div>
            <div className="mb-2 text-sm"><b>Spare Parts Used:</b>
              {Array.isArray(viewDetails.sparesUsed) && viewDetails.sparesUsed.length > 0 ? (
                <ul className="list-disc ml-5 mt-1">
                  {viewDetails.sparesUsed.map((part, idx) => (
                    <li key={idx}>{typeof part === 'string' ? part : (part.name || part.partName || JSON.stringify(part))}</li>
                  ))}
                </ul>
              ) : (
                <span> - </span>
              )}
            </div>
            <div className="mb-2 text-sm"><b>Customer:</b> {viewDetails.customer?.companyName || viewDetails.customer?.name || '-'}</div>
            <div className="mb-2 text-sm"><b>Machine:</b> {viewDetails.machine?.model || '-'} ({viewDetails.machine?.serialNumber || '-'})</div>
          </div>
        </div>
      )}
    </div>
  );
}
