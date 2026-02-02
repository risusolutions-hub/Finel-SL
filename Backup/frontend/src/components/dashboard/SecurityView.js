

import React, { useState, useEffect } from 'react';
import { Shield, Unlock, Mail, FileText, Ban, Zap } from 'lucide-react';
import api from '../../api';

export default function SecurityView({ showToast }) {
  const [scanResults, setScanResults] = useState([]);
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [reportDownloading, setReportDownloading] = useState(false);

  useEffect(() => {
    fetchBlockedAccounts();
  }, []);

  const fetchBlockedAccounts = async () => {
    try {
      const res = await api.get('/users?status=blocked');
      setBlockedAccounts(res.data.users || []);
    } catch (e) {
      setBlockedAccounts([]);
    }
  };

  const runScan = async () => {
    setScanning(true);
    showToast?.('Running security scan...', 'info');
    try {
      const res = await api.get('/system/security-scan');
      if (res.data.success) {
        setScanResults(res.data.suspicious);
        showToast?.(`Scan complete: ${res.data.suspicious.length} suspicious accounts found`, 'success');
      } else {
        showToast?.('Scan failed', 'error');
      }
    } catch (e) {
      showToast?.('Scan failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  const unlockAccount = async () => {
    if (!unlockEmail) return showToast?.('Enter user email to unlock', 'warning');
    setUnlocking(true);
    try {
      const res = await api.post('/system/unlock-account', { email: unlockEmail });
      if (res.data.success) {
        showToast?.('Account unlocked successfully', 'success');
        fetchBlockedAccounts();
      } else {
        showToast?.(res.data.message || 'Unlock failed', 'error');
      }
    } catch (e) {
      showToast?.('Unlock failed', 'error');
    } finally {
      setUnlocking(false);
      setUnlockEmail('');
    }
  };

  const downloadReport = async () => {
    setReportDownloading(true);
    try {
      const res = await api.get('/system/security-report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `security_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast?.('Security report downloaded', 'success');
    } catch (e) {
      showToast?.('Download failed', 'error');
    } finally {
      setReportDownloading(false);
    }
  };

  // Feature cards for security actions
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-red-600" />, title: 'Security Scan',
      description: 'Detect suspicious accounts and weak passwords.',
      action: (
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
          onClick={runScan}
          disabled={scanning}
        >
          <Shield className="w-4 h-4" /> {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      )
    },
    {
      icon: <Unlock className="w-6 h-6 text-green-600" />, title: 'Unlock Account',
      description: 'Unlock a locked or blocked user account.',
      action: (
        <div className="flex gap-2 items-center">
          <input
            type="email"
            value={unlockEmail}
            onChange={e => setUnlockEmail(e.target.value)}
            placeholder="User email to unlock"
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={unlocking}
          />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
            onClick={unlockAccount}
            disabled={unlocking}
          >
            <Unlock className="w-4 h-4" /> {unlocking ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      )
    },
    {
      icon: <FileText className="w-6 h-6 text-indigo-600" />, title: 'Download Security Report',
      description: 'Download a full security report of all users and actions.',
      action: (
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
          onClick={downloadReport}
          disabled={reportDownloading}
        >
          <FileText className="w-4 h-4" /> {reportDownloading ? 'Downloading...' : 'Download Report'}
        </button>
      )
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />, title: 'Security Alerts',
      description: 'Email notifications for suspicious activity (coming soon).',
      action: (
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2" disabled>
          <Mail className="w-4 h-4" /> Configure Alerts
        </button>
      )
    }
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Security Panel</h1>
        <span className="ml-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Super Admin</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <div key={i} className="bg-white border rounded-xl p-6 flex flex-col gap-3 shadow-sm">
            <div>{f.icon}</div>
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{f.description}</p>
            <div>{f.action}</div>
          </div>
        ))}
      </div>
      {/* Blocked Accounts Table */}
      <div className="mt-10">
        <h2 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2"><Ban className="w-5 h-5 text-red-600" /> Blocked Accounts</h2>
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blockedAccounts.map(user => (
                <tr key={user._id || user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3 capitalize text-red-600 font-semibold">{user.status}</td>
                </tr>
              ))}
              {blockedAccounts.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No blocked accounts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Suspicious Accounts Table (from scan) */}
      {scanResults.length > 0 && (
        <div className="mt-10">
          <h2 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-red-600" /> Suspicious Accounts</h2>
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Reason</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scanResults.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-red-600 font-semibold">{item.reason}</td>
                    <td className="px-4 py-2">{item.user?.name || 'N/A'}</td>
                    <td className="px-4 py-2">{item.user?.email || 'N/A'}</td>
                    <td className="px-4 py-2 capitalize">{item.user?.role || 'N/A'}</td>
                    <td className="px-4 py-2 capitalize">{item.user?.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}