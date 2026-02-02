import React, { useState } from 'react';
import { Bell, Plus, FileText, ChevronDown } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';

export default function DashboardHeader({ currentView, onNewComplaint, onRequestLeave, user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { type: 'success', title: 'Ticket Created', message: 'New complaint #COMP-2024-001 created successfully', timestamp: new Date(Date.now() - 5 * 60000), read: false },
    { type: 'info', title: 'Assignment', message: 'You have been assigned to ticket #COMP-2024-002', timestamp: new Date(Date.now() - 30 * 60000), read: false },
    { type: 'success', title: 'Resolution', message: 'Ticket #COMP-2024-003 marked as resolved', timestamp: new Date(Date.now() - 2 * 60 * 60000), read: true }
  ]);

  const viewTitles = {
    dashboard: 'Dashboard',
    complaints: 'Active Incident Monitor',
    customers: 'Account Directory',
    team: 'Team Management',
    history: 'Service History',
    'work-history': 'Work Time History & Analytics',
    'engineer-analytics': 'Engineer Status & Analytics',
    leaves: user?.role === 'engineer' ? 'My Leave Requests' : 'Leave Management',
    activity: 'Activity Log'
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDismissNotification = (index) => {
    setNotifications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], read: true };
      return updated;
    });
  };

  const handleClearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 z-10 sticky top-0">
      {/* Left Section - Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">System</p>
          <h2 className="text-lg font-semibold text-neutral-900">{viewTitles[currentView] || 'Dashboard'}</h2>
        </div>
      </div>
      
      {/* Right Section - Actions & Notifications */}
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-md border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-success-500"></span>
          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Connected</span>
        </div>
        
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full border border-white"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-md border border-neutral-200 z-50">
              <NotificationCenter 
                notifications={notifications}
                onDismiss={handleDismissNotification}
                onClear={handleClearAll}
                compact={true}
              />
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-neutral-200 mx-1"></div>

        {/* Action Buttons */}
        {user?.role === 'engineer' ? (
          <div className="flex gap-2">
            <button
              onClick={onRequestLeave}
              className="px-3 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 text-xs font-medium rounded-md transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              title="Request Leave"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Leave Request</span>
            </button>
            <button
              onClick={onNewComplaint}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium rounded-md transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              title="Create New Ticket"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Ticket</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onNewComplaint}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium rounded-md transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            title="Create New Ticket"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </button>
        )}
      </div>
    </header>
  );
}
