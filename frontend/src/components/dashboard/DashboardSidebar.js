import React from 'react';
import { Zap, Edit2, LogOut } from 'lucide-react';
import { ADMIN_NAV_ITEMS, ENGINEER_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from '../../constants';
import { useSettings, NAV_TO_FEATURE } from '../../context/SettingsContext';

export default function DashboardSidebar({ user, currentView, setCurrentView, currentUser, onLogout, onCheckIn, onCheckOut, onEditName }) {
  const role = user?.role;
  const { isFeatureEnabled } = useSettings();
  
  // Get navigation items based on role
  const getNavItems = () => {
    if (role === 'engineer') return ENGINEER_NAV_ITEMS;
    if (role === 'superadmin') return [...ADMIN_NAV_ITEMS, ...SUPER_ADMIN_NAV_ITEMS];
    return ADMIN_NAV_ITEMS;
  };
  
  // Filter nav items based on feature settings
  const navItems = getNavItems().filter(item => {
    // Settings always visible for superadmin
    if (item.id === 'settings') return true;
    
    // Check if this nav item has a feature flag
    const featureKey = NAV_TO_FEATURE[item.id];
    if (featureKey) {
      return isFeatureEnabled(featureKey);
    }
    
    // No feature flag = always visible
    return true;
  });
  
  // Format work time display
  const formatWorkTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <aside className="w-64 bg-neutral-900 text-neutral-400 flex flex-col transition-all duration-300 border-r border-neutral-800">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-neutral-800 flex items-center gap-3">
        <div className="bg-primary-600 p-1.5 rounded-md flex items-center justify-center flex-shrink-0">
          <Zap className="text-white w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-white text-sm leading-tight tracking-tight truncate">LaserService</h1>
          <p className="text-neutral-500 text-[10px] font-medium uppercase tracking-wide truncate">Enterprise</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-primary-600/15 text-primary-300 border-l-2 border-primary-600 pl-2.5' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border-l-2 border-transparent'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-primary-400' : 'text-neutral-500'
              }`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 space-y-3">
        {/* Work Timer (Engineer Only) */}
        {role === 'engineer' && currentUser && (
          <div className="p-3 rounded-md bg-neutral-800/50 border border-neutral-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">Time Today</span>
              <span className="text-xs font-bold text-white font-mono">
                {formatWorkTime(currentUser.dailyTotalWorkTime || 0)}
              </span>
            </div>
            {currentUser.isCheckedIn ? (
              <button
                onClick={onCheckOut}
                className="w-full bg-error-500 hover:bg-error-600 text-white rounded text-xs py-2 font-medium transition-colors border border-error-400"
              >
                Check Out
              </button>
            ) : (
              <button
                onClick={onCheckIn}
                className="w-full bg-success-600 hover:bg-success-700 text-white rounded text-xs py-2 font-medium transition-colors border border-success-500"
              >
                Check In
              </button>
            )}
          </div>
        )}

        {/* User Profile */}
        <div 
          className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
            role === 'engineer' ? 'cursor-pointer hover:bg-neutral-800' : ''
          } border border-transparent hover:border-neutral-700`}
          onClick={role === 'engineer' ? onEditName : null}
          title={role === 'engineer' ? 'Click to edit name' : 'User profile'}
        >
          <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-neutral-200 font-medium text-xs truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-neutral-500 font-medium uppercase truncate">{user?.role || 'Role'}</p>
          </div>
          {role === 'engineer' && (
            <Edit2 className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md text-xs py-2 font-medium transition-colors border border-transparent hover:border-neutral-700"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
