import React, { useState, useEffect } from 'react';
import { Calendar, Wrench, AlertCircle, TrendingDown, DollarSign, Info } from 'lucide-react';
import Loader from '../Loader';
import { saveAs } from 'file-saver';

export default function MachineServiceHistory({ machineId, machine, role = 'engineer' }) {
  const [history, setHistory] = useState([]);
  const [frequentFailures, setFrequentFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadServiceHistory();
  }, [machineId]);

  const loadServiceHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/service-history/machines/${machineId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
        setFrequentFailures(data.frequentFailures || []);
      }
    } catch (error) {
      console.error('Error loading service history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download as CSV for admin/superadmin
  const handleDownload = () => {
    const csvRows = [
      [
        'Service Type', 'Service Date', 'Issue', 'Resolution', 'Parts Replaced', 'Downtime', 'Cost', 'Engineer',
        'Created By', 'Assigned By', 'Created At', 'Assigned At', 'Started At', 'Completed At'
      ],
      ...filteredHistory.map(service => [
        service.serviceType,
        service.serviceDate ? new Date(service.serviceDate).toLocaleString() : '',
        service.issueDescription || '',
        service.resolutionDescription || '',
        (service.partsReplaced || []).map(p => `${p.partName} (x${p.quantity})`).join('; '),
        service.downtime || '',
        service.cost || '',
        service.engineer?.name || '',
        service.createdBy?.name || '',
        service.assignedBy?.name || '',
        service.createdAt ? new Date(service.createdAt).toLocaleString() : '',
        service.assignedAt ? new Date(service.assignedAt).toLocaleString() : '',
        service.startedAt ? new Date(service.startedAt).toLocaleString() : '',
        service.completedAt ? new Date(service.completedAt).toLocaleString() : ''
      ])
    ];
    const csv = csvRows.map(row => row.map(String).map(v => '"' + v.replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `service-history-${machine?.serialNumber || machineId}.csv`);
  };

  // Filter for manager: only same-day tickets
  const today = new Date();
  const isSameDay = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  let filteredHistory = filter === 'all' ? history : history.filter(h => h.serviceType === filter);
  if (role === 'manager') {
    filteredHistory = filteredHistory.filter(h => isSameDay(h.completedAt || h.serviceDate));
  }

  const formattedHistory = history.map(h => ({
    ...h,
    completedAt: h.completedAt ? new Date(h.completedAt).toLocaleString() : '',
    closedAt: h.closedAt ? new Date(h.closedAt).toLocaleString() : ''
  }));

  const totalServices = history.length;
  const totalDowntime = history.reduce((sum, h) => sum + (h.downtime || 0), 0);
  const totalCost = history.reduce((sum, h) => sum + (h.cost || 0), 0);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Machine Summary */}
      {machine && (
        <div className="flex items-center gap-8 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2">
          <div>
            <div className="font-bold text-lg text-slate-900">{machine.model}</div>
            <div className="text-xs text-slate-500">Serial: {machine.serialNumber}</div>
            <div className="text-xs text-slate-500">Installed: {machine.installationDate ? new Date(machine.installationDate).toLocaleDateString() : '-'}</div>
          </div>
          {(role === 'admin' || role === 'superadmin') && (
            <button onClick={handleDownload} className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
              Download CSV
            </button>
          )}
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex gap-8 items-center bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-blue-600" />
          <span className="font-bold text-blue-900">{totalServices}</span>
          <span className="text-xs text-blue-700">Services</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown size={18} className="text-amber-600" />
          <span className="font-bold text-amber-900">{totalDowntime}m</span>
          <span className="text-xs text-amber-700">Total Downtime</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-green-600" />
          <span className="font-bold text-green-900">${totalCost}</span>
          <span className="text-xs text-green-700">Total Cost</span>
        </div>
      </div>

      {/* Frequent Failures Alert */}
      {frequentFailures.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-bold text-red-900">Frequent Failures Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                These components have failed multiple times:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                {frequentFailures.map((failure, idx) => (
                  <li key={idx}>
                    {failure.partName} ({failure.failureCount} times)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'corrective', 'preventive', 'maintenance', 'inspection'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            title={`Show ${type} services`}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Wrench size={40} className="mx-auto mb-3 opacity-50" />
            <p>No service history for this machine</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistory.map((service, idx) => (
              <div key={service.id || service._id || `srv-${idx}`} className="flex gap-4">
                {/* Timeline marker */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    service.serviceType === 'corrective' ? 'bg-red-500' :
                    service.serviceType === 'preventive' ? 'bg-green-500' :
                    service.serviceType === 'maintenance' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < filteredHistory.length - 1 && (
                    <div className="w-1 h-16 bg-slate-300 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 capitalize">
                          {service.serviceType} Service
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          <Calendar size={14} />
                          {service.serviceDate ? new Date(service.serviceDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        service.serviceType === 'corrective' ? 'bg-red-100 text-red-700' :
                        service.serviceType === 'preventive' ? 'bg-green-100 text-green-700' :
                        service.serviceType === 'maintenance' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {service.serviceType}
                      </span>
                    </div>

                    {/* Issue & Resolution */}
                    {service.issueDescription && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-slate-600 uppercase">Issue</p>
                        <p className="text-sm text-slate-700">{service.issueDescription}</p>
                      </div>
                    )}

                    {service.resolutionDescription && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-slate-600 uppercase">Resolution</p>
                        <p className="text-sm text-slate-700">{service.resolutionDescription}</p>
                      </div>
                    )}

                    {/* Parts Replaced */}
                    {service.partsReplaced && service.partsReplaced.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-slate-600 uppercase mb-2">Parts Replaced</p>
                        <div className="grid grid-cols-2 gap-2">
                          {service.partsReplaced.map((part, pidx) => (
                            <div key={pidx} className="bg-slate-50 rounded p-2 text-sm">
                              <p className="font-medium text-slate-900">{part.partName}</p>
                              <p className="text-xs text-slate-600">Qty: {part.quantity}</p>
                              {part.cost && (
                                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                                  <DollarSign size={12} /> {part.cost}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200">
                      {service.downtime && (
                        <div>
                          <p className="text-xs text-slate-500">Downtime</p>
                          <p className="font-bold text-slate-900">{service.downtime}m</p>
                        </div>
                      )}
                      {service.cost && (
                        <div>
                          <p className="text-xs text-slate-500">Cost</p>
                          <p className="font-bold text-slate-900">${service.cost}</p>
                        </div>
                      )}
                      {service.engineer && (
                        <div>
                          <p className="text-xs text-slate-500">Engineer</p>
                          <p className="font-bold text-slate-900 text-sm">{service.engineer.name}</p>
                        </div>
                      )}
                    </div>

                    {/* Next Maintenance */}
                    {service.nextScheduledMaintenance && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700">
                          <strong>Next Maintenance:</strong> {new Date(service.nextScheduledMaintenance).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
