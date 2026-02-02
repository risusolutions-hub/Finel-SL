import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Plus, AlertTriangle, ClipboardCheck, History, X, Paperclip, Image, Video, FileText, Eye, Download, ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';
import api from '../../api';
import AdvancedSearchFilters from '../AdvancedSearchFilters';
import ExportButton from '../ExportButton';
import { SLABadge } from '../SLATimer';

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${styles[priority] || styles.medium}`}>
      {priority || 'medium'}
    </span>
  );
};

// Issue Categories Display
const IssueCategoriesDisplay = ({ categories }) => {
  const cats = Array.isArray(categories) ? categories : [];
  if (cats.length === 0) return null;
  const categoryIcons = {
    electrical: '⚡',
    mechanical: '⚙️',
    software: '💻',
    cooling: '❄️',
    network: '🌐',
    display: '🖥️',
    power: '🔌',
    noise: '🔊',
    performance: '📉',
    other: '📋'
  };
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {cats.slice(0, 3).map((cat, idx) => {
        const isCustom = cat.startsWith('custom:');
        const label = isCustom ? cat.replace('custom:', '') : cat;
        return (
          <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
            {!isCustom && categoryIcons[cat]} {label.substring(0, 15)}
          </span>
        );
      })}
      {cats.length > 3 && (
        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
          +{cats.length - 3} more
        </span>
      )}
    </div>
  );
};

// Attachments indicator
const AttachmentsIndicator = ({ attachments }) => {
  const files = Array.isArray(attachments) ? attachments : [];
  if (files.length === 0) return null;
  const hasImages = files.some(a => a.type?.startsWith('image/'));
  const hasVideos = files.some(a => a.type?.startsWith('video/'));
  const hasDocs = files.some(a => !a.type?.startsWith('image/') && !a.type?.startsWith('video/'));
  
  return (
    <div className="flex items-center gap-1 mt-1">
      {hasImages && <Image size={12} className="text-blue-500" />}
      {hasVideos && <Video size={12} className="text-purple-500" />}
      {hasDocs && <FileText size={12} className="text-slate-500" />}
      <span className="text-[9px] text-slate-500">{files.length} file{files.length > 1 ? 's' : ''}</span>
    </div>
  );
};

// Full Attachments List Component
const AttachmentsList = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return <p className="text-sm text-slate-400 italic">No attachments</p>;
  }

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type?.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    return <FileText size={16} className="text-slate-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (attachment) => {
    try {
      // Prefer structured local files (yearMonth + filename), fallback to generic path
      const url = (attachment.yearMonth && attachment.filename)
        ? `${api.defaults.baseURL}/uploads/files/${attachment.yearMonth}/${attachment.filename}`
        : `${api.defaults.baseURL}/uploads/${attachment.filename || attachment.name}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="space-y-2">
      {attachments.map((att, idx) => (
        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
          {getFileIcon(att.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{att.originalName || att.name || att.filename}</p>
            <p className="text-xs text-slate-400">{formatFileSize(att.size)}</p>
          </div>
          <button
            onClick={() => handleDownload(att)}
            className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition"
            title="Download"
          >
            <Download size={14} />
          </button>
          {att.type?.startsWith('image/') && (
            <button
              onClick={() => handleDownload(att)}
              className="p-1.5 hover:bg-green-100 rounded text-green-600 transition"
              title="View"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// Complaint Detail Panel
const ComplaintDetailPanel = ({ complaint, customer, machine }) => {
  if (!complaint) return null;
  
  const categoryLabels = {
    electrical: '⚡ Electrical Issues',
    mechanical: '⚙️ Mechanical Problems',
    software: '💻 Software/Firmware',
    cooling: '❄️ Cooling System',
    network: '🌐 Network/Connectivity',
    display: '🖥️ Display Issues',
    power: '🔌 Power Supply',
    noise: '🔊 Unusual Noise',
    performance: '📉 Performance Issues',
    other: '📋 Other'
  };

  return (
    <div className="p-4 space-y-5">
      {/* Priority & Status */}
      <div className="flex items-center gap-3">
        <PriorityBadge priority={complaint.priority} />
        <StatusBadge status={complaint.status} />
      </div>

      {/* Customer Info */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Customer Details</h4>
        <p className="text-sm font-medium text-slate-900">{customer?.company || customer?.name}</p>
        <p className="text-xs text-slate-600">Service No: {customer?.serviceNo || '-'}</p>
        {customer?.contactPerson && <p className="text-xs text-slate-600">Contact: {customer.contactPerson}</p>}
        {customer?.phone && <p className="text-xs text-slate-600">📞 {customer.phone}</p>}
        {customer?.phones?.length > 1 && (
          <p className="text-xs text-slate-500">+ {customer.phones.length - 1} more number(s)</p>
        )}
        {customer?.address && <p className="text-xs text-slate-500 mt-1">📍 {customer.address}</p>}
      </div>

      {/* Machine Info */}
      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
        <h4 className="text-xs font-bold text-purple-700 uppercase mb-2">Machine Details</h4>
        <p className="text-sm font-medium text-slate-900">{machine?.model}</p>
        <p className="text-xs text-slate-600 font-mono">S/N: {machine?.serialNumber}</p>
        {machine?.mobileNumbers?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-slate-500 font-medium">Mobile Numbers:</p>
            {machine.mobileNumbers.map((num, idx) => (
              <p key={idx} className="text-xs text-slate-600">📱 {num}</p>
            ))}
          </div>
        )}
      </div>

      {/* Issue Categories */}
      {Array.isArray(complaint.issueCategories) && complaint.issueCategories.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Issue Categories</h4>
          <div className="flex flex-wrap gap-2">
            {complaint.issueCategories.map((cat, idx) => {
              const isCustom = cat.startsWith('custom:');
              const label = isCustom ? `✏️ ${cat.replace('custom:', '')}` : (categoryLabels[cat] || cat);
              return (
                <span key={idx} className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Problem Description */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Problem Description</h4>
        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
          {complaint.problem}
        </p>
      </div>

      {/* Attachments */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
          Attachments ({complaint.attachments?.length || 0})
        </h4>
        <AttachmentsList attachments={complaint.attachments} />
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Timeline</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Created:</span>
            <span className="text-slate-700">{new Date(complaint.createdAt).toLocaleString()}</span>
          </div>
          {complaint.assignedAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned:</span>
              <span className="text-slate-700">{new Date(complaint.assignedAt).toLocaleString()}</span>
            </div>
          )}
          {complaint.resolvedAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Resolved:</span>
              <span className="text-slate-700">{new Date(complaint.resolvedAt).toLocaleString()}</span>
            </div>
          )}
          {complaint.closedAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Closed:</span>
              <span className="text-slate-700">{new Date(complaint.closedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Lazy load feature panels
const DuplicateDetection = lazy(() => import('./DuplicateDetection'));
const ServiceChecklist = lazy(() => import('./ServiceChecklist'));
const MachineServiceHistory = lazy(() => import('./MachineServiceHistory'));

export default function ComplaintsView({ complaints, customers, machines, user, onAssign, onTakeTicket, onCancelAssignment, onStartWork, onComplete, onClose, setModal }) {
  const [filteredComplaints, setFilteredComplaints] = useState(complaints);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // 'chat', 'duplicates', 'checklist', 'history'
  const [savedPresets, setSavedPresets] = useState(() => {
    const stored = localStorage.getItem('complaintFilterPresets');
    return stored ? JSON.parse(stored) : [];
  });

  const searchFields = ['displayId', 'complaintId', 'id', 'problem', 'engineer.name', 'engineer.email'];
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    }
  ];

  const handleSavePreset = (preset) => {
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem('complaintFilterPresets', JSON.stringify(updated));
  };

  const handleLoadPreset = (preset) => {
    // This would reload filters - simplified for now
    window.location.reload();
  };
  const renderComplaintActions = (c) => {
    const isEngineer = user?.role === 'engineer';
    const isAssignedToMe = c.assignedTo === String(user?.id);
    const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'superadmin';

    if (isEngineer) {
      if (c.status === 'pending') {
        return <button onClick={() => onTakeTicket(c.id, user.id)} className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-700">Take</button>;
      }
      if (c.status === 'assigned' && isAssignedToMe) {
        return (
          <div className="flex gap-4">
            <button onClick={() => onCancelAssignment(c.id)} className="text-[10px] font-bold uppercase text-slate-600 hover:text-slate-700">Cancel</button>
            <button onClick={() => onStartWork(c.id, 'in_progress')} className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-700">Start Work</button>
          </div>
        );
      }
      if (c.status === 'in_progress' && isAssignedToMe) {
        return (
          <div className="flex gap-4">
            <button onClick={() => setModal({ type: 'complete', complaint: c })} className="text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700">Complete</button>
            <button onClick={() => setModal({ type: 'close', complaint: c })} className="text-[10px] font-bold uppercase text-rose-600 hover:text-rose-700">Close</button>
          </div>
        );
      }
    } else if (isManager) {
      if (c.status === 'pending') {
        return <button onClick={() => setModal({ type: 'assign', complaint: c })} className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-700">Assign</button>;
      }
      if (c.status === 'assigned') {
        return (
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-blue-500">Assigned to {c.engineer?.name || '...'}</span>
            <button onClick={() => onCancelAssignment(c.id)} className="text-[10px] font-bold uppercase text-rose-600 hover:text-rose-700">Cancel</button>
          </div>
        );
      }
      if (c.status === 'in_progress') {
        return (
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-blue-500">In Progress by {c.engineer?.name || '...'}</span>
            <button onClick={() => onCancelAssignment(c.id)} className="text-[10px] font-bold uppercase text-rose-600 hover:text-rose-700">Cancel</button>
          </div>
        );
      }
    }
    if (c.status === 'closed' || c.status === 'resolved') {
      return <span className="text-[10px] font-bold text-slate-400">{c.status === 'resolved' ? 'Completed' : 'Closed'}</span>;
    }
    return null;
  };

  const openPanel = (complaint, panel) => {
    setSelectedComplaint(complaint);
    setActivePanel(panel);
  };

  const closePanel = () => {
    setSelectedComplaint(null);
    setActivePanel(null);
  };

  const renderFeatureButtons = (c) => {
    const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'superadmin';
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openPanel(c, 'duplicates')}
          className="p-1.5 hover:bg-orange-50 rounded transition text-orange-600"
          title="Check Duplicates"
        >
          <AlertTriangle size={14} />
        </button>
        {(c.status === 'in_progress' || c.status === 'resolved') && (
          <button
            onClick={() => openPanel(c, 'checklist')}
            className="p-1.5 hover:bg-green-50 rounded transition text-green-600"
            title="Service Checklist"
          >
            <ClipboardCheck size={14} />
          </button>
        )}
        <button
          onClick={() => openPanel(c, 'history')}
          className="p-1.5 hover:bg-purple-50 rounded transition text-purple-600"
          title="Machine History"
        >
          <History size={14} />
        </button>
        <button
          onClick={() => openPanel(c, 'details')}
          className="p-1.5 hover:bg-slate-100 rounded transition text-slate-600"
          title="View Details"
        >
          <Eye size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="fade-in flex gap-4">
      {/* Main Content */}
      <div className={`flex-1 space-y-4 ${selectedComplaint ? 'w-2/3' : 'w-full'}`}>
      {/* Advanced Search & Filters */}
      <AdvancedSearchFilters
        data={complaints}
        onFilter={setFilteredComplaints}
        searchFields={searchFields}
        filters={filterOptions}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        savedPresets={savedPresets}
      />

      {/* Export Options */}
      <div className="flex justify-end">
        <ExportButton
          data={filteredComplaints.map(c => ({
            'Case ID': c.displayId || c.complaintId || c.id,
            'Customer': customers.find(cu => cu.id === c.customerId)?.name || 'N/A',
            'Machine': machines.find(m => m.id === c.machineId)?.model || 'N/A',
            'Priority': c.priority || 'N/A',
            'Status': c.status || 'pending',
            'Assigned To': c.engineer?.name || 'Unassigned',
            'Created': new Date(c.createdAt).toLocaleDateString(),
            'Problem': c.problem?.substring(0, 100) || ''
          }))}
          filename="complaints"
          title="Complaint Tickets Export"
          compact={true}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">Tickets</h3>
            <p className="text-xs text-neutral-600 mt-1">{filteredComplaints.length} of {complaints.length} tickets</p>
          </div>
          {(user?.role !== 'engineer') && (
            <button onClick={() => setModal('complaint')} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Case ID</th>
                <th className="px-6 py-3">Client details</th>
                <th className="px-6 py-3">Machine info</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Issue</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">SLA</th>
                <th className="px-6 py-3">Tools</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map(c => {
                  const cust = customers.find(cu => cu.id === c.customerId);
                  const mach = machines.find(m => m.id === c.machineId);
                  const isSelected = selectedComplaint?.id === c.id;
                  return (
                    <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {c.displayId || c.complaintId || c.id}
                        </span>
                        <AttachmentsIndicator attachments={c.attachments} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{cust?.company || cust?.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{cust?.serviceNo || cust?.city || cust?.id}</div>
                        {cust?.phone && <div className="text-xs text-slate-400">📞 {cust.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700 text-sm">{mach?.model}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{mach?.serialNumber}</div>
                        {mach?.mobileNumbers?.length > 0 && (
                          <div className="text-xs text-slate-400">📱 {mach.mobileNumbers[0]}</div>
                        )}
                      </td>
                      <td className="px-6 py-4"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="text-xs text-slate-700 truncate" title={c.problem}>
                          {c.problem?.substring(0, 40)}{c.problem?.length > 40 ? '...' : ''}
                        </div>
                        <IssueCategoriesDisplay categories={c.issueCategories} />
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-6 py-4"><SLABadge complaint={c} slaDurationHours={24} /></td>
                      <td className="px-6 py-4">{renderFeatureButtons(c)}</td>
                      <td className="px-6 py-4 text-right">{renderComplaintActions(c)}</td>
                </tr>
              );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 italic">
                    No tickets match your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Side Panel for Features */}
      {selectedComplaint && activePanel && (
        <div className="w-1/3 min-w-[400px] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900">
                {activePanel === 'duplicates' && 'Duplicate Detection'}
                {activePanel === 'checklist' && 'Service Checklist'}
                {activePanel === 'history' && 'Machine History'}
                {activePanel === 'details' && 'Ticket Details'}
              </h3>
              <p className="text-xs text-slate-500">
                Ticket #{selectedComplaint.displayId || selectedComplaint.complaintId || selectedComplaint.id}
              </p>
            </div>
            <button
              onClick={closePanel}
              className="p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
              
              {activePanel === 'duplicates' && (
                <div className="p-4">
                  <DuplicateDetection
                    complaintId={selectedComplaint.id}
                    customerId={selectedComplaint.customerId}
                    description={selectedComplaint.problem}
                    title={selectedComplaint.displayId}
                  />
                </div>
              )}
              {activePanel === 'checklist' && (
                <div className="p-4">
                  <ServiceChecklist
                    complaintId={selectedComplaint.id}
                    isEngineer={user?.role === 'engineer'}
                    isManager={['manager', 'admin', 'superadmin'].includes(user?.role)}
                  />
                </div>
              )}
              {activePanel === 'history' && (
                <div className="p-4">
                  <MachineServiceHistory machineId={selectedComplaint.machineId} />
                </div>
              )}
              {activePanel === 'details' && (
                <ComplaintDetailPanel 
                  complaint={selectedComplaint}
                  customer={customers.find(c => c.id === selectedComplaint.customerId)}
                  machine={machines.find(m => m.id === selectedComplaint.machineId)}
                />
              )}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
