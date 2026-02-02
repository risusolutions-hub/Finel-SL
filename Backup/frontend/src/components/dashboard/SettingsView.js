import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Shield, MessageSquare, Award, CheckSquare, Palette, Calendar, 
  BarChart3, Bell, Save, RefreshCw, ToggleLeft, ToggleRight, AlertTriangle,
  Users, Database, Activity, Server, FileText, Download,
  Paintbrush, Building2, Bug, Zap, HardDrive, Cpu, Wifi
} from 'lucide-react';
import api from '../../api';
import { useSettings } from '../../context/SettingsContext';

/**
 * SettingsView - Super Admin Control Panel
 * Comprehensive system settings with tabs
 * @version 2.0.0
 */
export default function SettingsView({ user, showToast }) {
  const { refreshSettings: refreshGlobalSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState('features');
  const [settings, setSettings] = useState({});
  const [systemConfig, setSystemConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  // Additional state for different tabs
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const tabs = [
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'system', label: 'System', icon: Server },
    { id: 'branding', label: 'Branding', icon: Paintbrush },
    { id: 'sessions', label: 'Sessions', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'api', label: 'API Logs', icon: Activity },
    { id: 'health', label: 'Health', icon: Cpu }
  ];
        {/* Security Tab removed; now a main option */}


  // Feature icons mapping
  const featureIcons = {
    feature_skills: Award,
    feature_certifications: Shield,
    feature_checklists: CheckSquare,
    feature_customization: Palette,
    feature_leave_management: Calendar,
    feature_analytics: BarChart3,
    feature_notifications: Bell
  };

  // Feature colors for visual distinction
  const featureColors = {
    feature_skills: 'indigo',
    feature_certifications: 'emerald',
    feature_checklists: 'amber',
    feature_customization: 'purple',
    feature_leave_management: 'teal',
    feature_analytics: 'orange',
    feature_notifications: 'red'
  };

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(res.data.settings)));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemConfig = useCallback(async () => {
    try {
      const res = await api.get('/system/config');
      if (res.data.success) {
        setSystemConfig(res.data.config);
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await api.get('/system/audit-logs?limit=100');
      if (res.data.success) {
        setAuditLogs(res.data.logs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchApiLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await api.get('/system/api-logs?limit=100');
      if (res.data.success) {
        setApiLogs(res.data.logs);
      }
    } catch (error) {
      console.error('Error fetching API logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchApiMetrics = useCallback(async () => {
    try {
      const res = await api.get('/system/api-metrics');
      if (res.data.success) {
        setApiMetrics(res.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching API metrics:', error);
    }
  }, []);

  const fetchHealthStatus = useCallback(async () => {
    try {
      const res = await api.get('/system/health');
      if (res.data.success) {
        setHealthStatus(res.data.health);
      }
    } catch (error) {
      console.error('Error fetching health status:', error);
    }
  }, []);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await api.get('/system/sessions');
      if (res.data.success) {
        setActiveSessions(res.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchSystemConfig();
  }, [fetchSettings, fetchSystemConfig]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'api') { fetchApiLogs(); fetchApiMetrics(); }
    if (activeTab === 'health') fetchHealthStatus();
    if (activeTab === 'sessions') fetchActiveSessions();
  }, [activeTab, fetchAuditLogs, fetchApiLogs, fetchApiMetrics, fetchHealthStatus, fetchActiveSessions]);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value: !prev[key].value }
    }));
    setHasChanges(true);
  };

  const handleSaveFeatures = async () => {
    try {
      setSaving(true);
      const settingsArray = Object.entries(settings).map(([key, data]) => ({
        key, value: data.value
      }));
      const res = await api.put('/settings', { settings: settingsArray });
      if (res.data.success) {
        showToast?.('Settings saved successfully', 'success');
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        setHasChanges(false);
        refreshGlobalSettings();
      }
    } catch (error) {
      showToast?.('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await api.put('/system/config', systemConfig);
      if (res.data.success) {
        showToast?.('Configuration saved successfully', 'success');
        setSystemConfig(res.data.config);
      }
    } catch (error) {
      showToast?.('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setHasChanges(false);
  };

  const handleExportAuditLogs = async () => {
    try {
      const res = await api.get('/system/audit-logs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast?.('Audit logs exported', 'success');
    } catch (error) {
      showToast?.('Failed to export logs', 'error');
    }
  };

  const terminateSession = async (userId) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) return;
    try {
      await api.delete(`/system/sessions/${userId}`);
      showToast?.('Session terminated', 'success');
      fetchActiveSessions();
    } catch (error) {
      showToast?.('Failed to terminate session', 'error');
    }
  };

  const getColorClasses = (color, enabled) => {
    const colors = {
      indigo: enabled ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 border-gray-200',
      emerald: enabled ? 'bg-emerald-100 border-emerald-300' : 'bg-gray-50 border-gray-200',
      amber: enabled ? 'bg-amber-100 border-amber-300' : 'bg-gray-50 border-gray-200',
      purple: enabled ? 'bg-purple-100 border-purple-300' : 'bg-gray-50 border-gray-200',
      blue: enabled ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200',
      teal: enabled ? 'bg-teal-100 border-teal-300' : 'bg-gray-50 border-gray-200',
      orange: enabled ? 'bg-orange-100 border-orange-300' : 'bg-gray-50 border-gray-200',
      red: enabled ? 'bg-red-100 border-red-300' : 'bg-gray-50 border-gray-200'
    };
    return colors[color] || colors.indigo;
  };

  const getIconBgClasses = (color, enabled) => {
    const colors = {
      indigo: enabled ? 'bg-indigo-500' : 'bg-gray-300',
      emerald: enabled ? 'bg-emerald-500' : 'bg-gray-300',
      amber: enabled ? 'bg-amber-500' : 'bg-gray-300',
      purple: enabled ? 'bg-purple-500' : 'bg-gray-300',
      blue: enabled ? 'bg-blue-500' : 'bg-gray-300',
      teal: enabled ? 'bg-teal-500' : 'bg-gray-300',
      orange: enabled ? 'bg-orange-500' : 'bg-gray-300',
      red: enabled ? 'bg-red-500' : 'bg-gray-300'
    };
    return colors[color] || colors.indigo;
  };

  // Check access
  if (user?.role !== 'superadmin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Access Denied</h3>
          <p className="text-red-600 text-sm">Only super admin can access system settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const featureSettings = Object.entries(settings).filter(([key]) => key.startsWith('feature_'));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500">Super admin control panel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Toggle features on/off for all users</p>
              <div className="flex gap-2">
                {hasChanges && (
                  <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />Reset
                  </button>
                )}
                <button
                  onClick={handleSaveFeatures}
                  disabled={!hasChanges || saving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
                    hasChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            
            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 text-sm">Super Admin Controls</h4>
                <p className="text-amber-700 text-xs mt-1">
                  Disabling a feature will hide it from all users across the system. 
                  Changes take effect immediately after saving.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureSettings.map(([key, data]) => {
                const Icon = featureIcons[key] || Settings;
                const color = featureColors[key] || 'indigo';
                const enabled = data.value;
                return (
                  <div key={key} className={`relative border rounded-xl p-4 transition-all ${getColorClasses(color, enabled)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getIconBgClasses(color, enabled)}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={`font-semibold text-sm ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                            {data.label}
                          </h3>
                          <p className={`text-xs mt-1 ${enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                            {data.description}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleToggle(key)} className="flex-shrink-0">
                        {enabled ? (
                          <ToggleRight className="w-10 h-10 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      enabled ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                      {enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Feature Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 text-sm mb-3">Feature Summary</h4>
              <div className="flex flex-wrap gap-2">
                {featureSettings.map(([key, data]) => (
                  <span
                    key={key}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      data.value
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 line-through'
                    }`}
                  >
                    {data.label}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {featureSettings.filter(([_, d]) => d.value).length} of {featureSettings.length} features enabled
              </p>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Maintenance Mode */}
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Maintenance Mode</h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={systemConfig.maintenanceMode || false}
                    onChange={(e) => setSystemConfig({...systemConfig, maintenanceMode: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Enable maintenance mode</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Message</label>
                  <textarea
                    value={systemConfig.maintenanceMessage || ''}
                    onChange={(e) => setSystemConfig({...systemConfig, maintenanceMessage: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="System is under maintenance. Please try again later."
                  />
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Data Retention</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closed Tickets (days)</label>
                  <input
                    type="number"
                    value={systemConfig.dataRetentionDays || 365}
                    onChange={(e) => setSystemConfig({...systemConfig, dataRetentionDays: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = never delete</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audit Logs (days)</label>
                  <input
                    type="number"
                    value={systemConfig.auditLogRetentionDays || 90}
                    onChange={(e) => setSystemConfig({...systemConfig, auditLogRetentionDays: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min="7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Logs (days)</label>
                  <input
                    type="number"
                    value={systemConfig.apiLogRetentionDays || 30}
                    onChange={(e) => setSystemConfig({...systemConfig, apiLogRetentionDays: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Debug Settings */}
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Bug className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Debug & Logging</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={systemConfig.debugMode || false}
                    onChange={(e) => setSystemConfig({...systemConfig, debugMode: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Debug Mode (verbose logging)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={systemConfig.apiLoggingEnabled !== false}
                    onChange={(e) => setSystemConfig({...systemConfig, apiLoggingEnabled: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">API Request Logging</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={systemConfig.verboseErrors || false}
                    onChange={(e) => setSystemConfig({...systemConfig, verboseErrors: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Verbose Error Messages</span>
                </label>
              </div>
            </div>

            {/* Backup Settings */}
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Backup Settings</h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={systemConfig.autoBackupEnabled || false}
                    onChange={(e) => setSystemConfig({...systemConfig, autoBackupEnabled: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Enable automatic backups</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                      value={systemConfig.backupFrequency || 'weekly'}
                      onChange={(e) => setSystemConfig({...systemConfig, backupFrequency: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keep last N backups</label>
                    <input
                      type="number"
                      value={systemConfig.backupRetentionCount || 5}
                      onChange={(e) => setSystemConfig({...systemConfig, backupRetentionCount: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Company Branding</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={systemConfig.companyName || ''}
                    onChange={(e) => setSystemConfig({...systemConfig, companyName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="LaserService"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={systemConfig.companyLogo || ''}
                    onChange={(e) => setSystemConfig({...systemConfig, companyLogo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="https://example.com/logo.png"
                  />
                  {systemConfig.companyLogo && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <img src={systemConfig.companyLogo} alt="Logo" className="h-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                  <input
                    type="text"
                    value={systemConfig.footerText || ''}
                    onChange={(e) => setSystemConfig({...systemConfig, footerText: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="© 2026 Company. All rights reserved."
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">All active user sessions (all devices, IPs, browsers)</p>
              <button onClick={fetchActiveSessions} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            <div className="bg-white border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">IP Address</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Device / Browser</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Last Active</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeSessions.map(session => (
                    <tr key={session._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{session.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{session.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                          {session.user?.role?.replace('_', ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{session.ipAddress || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{session.userAgent || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => terminateSession(session._id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No active sessions</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Recent admin actions and system events</p>
              <div className="flex gap-2">
                <button onClick={handleExportAuditLogs} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={fetchAuditLogs} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>
            <div className="bg-white border rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Resource</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logsLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium">{log.userName || 'System'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{log.resource}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{log.description}</td>
                    </tr>
                  ))}
                  {!logsLoading && auditLogs.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No audit logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API Logs Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* Metrics */}
            {apiMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Requests (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{apiMetrics.totalRequests?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Avg Response</p>
                  <p className="text-2xl font-bold text-gray-900">{apiMetrics.avgResponseTime || 0}ms</p>
                </div>
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Errors (24h)</p>
                  <p className="text-2xl font-bold text-red-600">{apiMetrics.errorCount || 0}</p>
                </div>
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Error Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{apiMetrics.errorRate || 0}%</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button onClick={() => { fetchApiLogs(); fetchApiMetrics(); }} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            
            {/* Recent API Logs */}
            <div className="bg-white border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Endpoint</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {apiLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                          log.method === 'POST' ? 'bg-green-100 text-green-700' :
                          log.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                          log.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate">{log.endpoint}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          log.statusCode < 300 ? 'bg-green-100 text-green-700' :
                          log.statusCode < 400 ? 'bg-blue-100 text-blue-700' :
                          log.statusCode < 500 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{log.responseTime}ms</td>
                    </tr>
                  ))}
                  {apiLogs.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No API logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">System health and performance metrics</p>
              <button onClick={fetchHealthStatus} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            
            {healthStatus ? (
              <>
                {/* Overall Status */}
                <div className={`border rounded-xl p-6 ${
                  healthStatus.status === 'healthy' ? 'bg-green-50 border-green-200' :
                  healthStatus.status === 'degraded' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      healthStatus.status === 'healthy' ? 'bg-green-500' :
                      healthStatus.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {healthStatus.status === 'healthy' ? (
                        <Wifi className="w-8 h-8 text-white" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold capitalize">{healthStatus.status}</h3>
                      <p className="text-sm text-gray-600">Uptime: {healthStatus.uptimeFormatted}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-500 uppercase">Database</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{healthStatus.database?.responseTime || 0}ms</p>
                    <p className={`text-xs ${healthStatus.database?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                      {healthStatus.database?.status || 'unknown'}
                    </p>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-500 uppercase">Memory</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{healthStatus.memory?.system?.usedPercent || 0}%</p>
                    <p className="text-xs text-gray-500">{healthStatus.memory?.system?.free || 0}GB free</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-gray-500 uppercase">CPU Load</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{healthStatus.cpu?.load1m || 0}</p>
                    <p className="text-xs text-gray-500">{healthStatus.cpu?.cores || 0} cores</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-500 uppercase">Active Users</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{healthStatus.users?.active24h || 0}</p>
                    <p className="text-xs text-gray-500">Last 24 hours</p>
                  </div>
                </div>

                {/* Error Stats */}
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-700">Errors (Last Hour)</span>
                    </div>
                    <span className={`text-lg font-bold ${(healthStatus.errors?.lastHour || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {healthStatus.errors?.lastHour || 0}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Cpu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Loading health status...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
