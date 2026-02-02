// Navigation items for sidebar
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Building2, 
  Clock, 
  BarChart3, 
  CalendarDays,
  Activity,
  MessageCircle,
  Award,
  ClipboardCheck,
  Wrench,
  Layout,
  Settings
} from 'lucide-react';

// Admin/Manager navigation items
export const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'complaints', label: 'Tickets', icon: Ticket },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'customers', label: 'Customers', icon: Building2 },
  { id: 'history', label: 'Service History', icon: Clock },
  { id: 'spare-parts-used', label: 'Spare Parts Used', icon: Wrench },
  { id: 'skills', label: 'Skills & Certs', icon: Award },
  { id: 'checklists', label: 'Checklists', icon: ClipboardCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'leaves', label: 'Leave Management', icon: CalendarDays },
  { id: 'customize', label: 'Customize', icon: Layout }
];

// Super Admin only navigation items
import { Shield } from 'lucide-react';
export const SUPER_ADMIN_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', icon: Settings, superAdminOnly: true },
  { id: 'security', label: 'Security', icon: Shield, superAdminOnly: true }
];

// Engineer navigation items
export const ENGINEER_NAV_ITEMS = [
  { id: 'complaints', label: 'My Tickets', icon: Ticket },
  { id: 'work-history', label: 'Work History', icon: Clock },
  { id: 'my-skills', label: 'My Skills', icon: Award },
  { id: 'leaves', label: 'Leave Requests', icon: CalendarDays }
];

// Get navigation items based on role
export const getNavItems = (role) => {
  if (role === 'engineer') {
    return ENGINEER_NAV_ITEMS;
  }
  if (role === 'superadmin') {
    return [...ADMIN_NAV_ITEMS, ...SUPER_ADMIN_NAV_ITEMS];
  }
  return ADMIN_NAV_ITEMS;
};

// Check if user has access to a specific view
export const hasViewAccess = (role, viewId) => {
  const navItems = getNavItems(role);
  return navItems.some(item => item.id === viewId);
};
