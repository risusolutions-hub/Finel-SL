import React, { useState, useEffect } from 'react';
import { Calendar, Wrench, AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import Loader from '../Loader';

export default function MachineServiceHistory({ machineId }) {
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

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(h => h.serviceType === filter);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Service History Timeline</h2>
          <p className="text-sm text-slate-500">Complete service record for this machine</p>
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
              <div key={service.id} className="flex gap-4">
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
                          {new Date(service.serviceDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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
