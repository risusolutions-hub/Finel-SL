import React, { useState, useEffect } from 'react';
import { AlertTriangle, Link2, Copy, Trash2 } from 'lucide-react';
import Loader from '../Loader';

export default function DuplicateDetection({ complaintId, customerId, description, title }) {
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [linkedDuplicates, setLinkedDuplicates] = useState([]);

  useEffect(() => {
    if (complaintId) {
      loadLinkedDuplicates();
    }
  }, [complaintId]);

  const detectDuplicates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/duplicates/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customerId, description, title })
      });

      const data = await response.json();
      if (data.success) {
        setPotentialDuplicates(data.potentialDuplicates || []);
        setHasDuplicates(data.hasDuplicates);
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedDuplicates = async () => {
    try {
      const response = await fetch(`/api/duplicates/complaints/${complaintId}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setLinkedDuplicates(data.duplicates || []);
      }
    } catch (error) {
      console.error('Error loading duplicates:', error);
    }
  };

  const handleLinkDuplicate = async (duplicateId) => {
    try {
      const response = await fetch('/api/duplicates/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          primaryComplaintId: complaintId,
          duplicateComplaintId: duplicateId,
          linkReason: 'Auto-detected similar complaint'
        })
      });

      if (response.ok) {
        setPotentialDuplicates(potentialDuplicates.filter(d => d.id !== duplicateId));
        loadLinkedDuplicates();
      }
    } catch (error) {
      console.error('Error linking duplicate:', error);
    }
  };

  const handleUnlinkDuplicate = async (linkId) => {
    try {
      const response = await fetch(`/api/duplicates/link/${linkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadLinkedDuplicates();
      }
    } catch (error) {
      console.error('Error unlinking duplicate:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Linked Duplicates */}
      {linkedDuplicates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Link2 size={18} />
            Linked Duplicates ({linkedDuplicates.length})
          </h3>
          <div className="space-y-2">
            {linkedDuplicates.map(link => (
              <div key={link.id} className="bg-white rounded p-3 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Complaint #{link.duplicateComplaintId}
                  </p>
                  {link.linkReason && (
                    <p className="text-sm text-slate-600">{link.linkReason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleUnlinkDuplicate(link.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Detection */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <button
          onClick={detectDuplicates}
          disabled={loading}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          <AlertTriangle size={18} />
          {loading ? 'Checking...' : 'Check for Similar Complaints'}
        </button>
      </div>

      {potentialDuplicates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} />
            Potential Duplicates Found ({potentialDuplicates.length})
          </h3>
          <div className="space-y-2">
            {potentialDuplicates.map(complaint => (
              <div key={complaint.id} className="bg-white rounded p-3 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Complaint #{complaint.id}: {complaint.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{complaint.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Status: {complaint.status}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {complaint.similarityScore}% match
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleLinkDuplicate(complaint.id)}
                  className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition flex items-center gap-1 whitespace-nowrap ml-2"
                >
                  <Copy size={14} /> Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasDuplicates === false && potentialDuplicates.length === 0 && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 font-medium">No similar complaints found</p>
        </div>
      )}
    </div>
  );
}
