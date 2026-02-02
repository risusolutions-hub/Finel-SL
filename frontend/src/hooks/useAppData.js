import { useState, useEffect, useCallback } from 'react';
import api from '../api';

/**
 * Custom hook for fetching and managing app data
 */
export default function useAppData(user) {
  const [appState, setAppState] = useState({
    customers: [],
    machines: [],
    engineers: [],
    users: [],
    complaints: [],
    leaves: [],
    models: ['Fiber 30W', 'Fiber 50W', 'CO2 100W', 'CO2 150W', 'UV Laser 5W', 'MOPA 60W']
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [customersRes, machinesRes, usersRes, complaintsRes] = await Promise.all([
        api.get('/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/machines').catch(() => ({ data: { machines: [] } })),
        api.get('/users').catch(() => ({ data: { users: [] } })),
        api.get('/complaints').catch(() => ({ data: { complaints: [] } }))
      ]);

      let complaints = complaintsRes.data.complaints || [];

      // For engineers, also fetch pending complaints
      if (user?.role === 'engineer') {
        const pendingRes = await api.get('/complaints?open=1').catch(() => ({ data: { complaints: [] } }));
        const pending = pendingRes.data.complaints || [];
        complaints = [...complaints, ...pending];
        
        try {
          const meRes = await api.get('/auth/me');
          setCurrentUser(meRes.data);
        } catch (err) {
          console.log('Could not load current user data');
        }
      }

      // Normalize data
      const customers = (customersRes.data.customers || []).map(c => ({ ...c, id: String(c.id) }));
      const machines = (machinesRes.data.machines || []).map(m => ({ 
        ...m, 
        id: String(m.id), 
        customerId: String(m.customerId) 
      }));
      const allUsers = usersRes.data.users || [];
      const engineers = allUsers.filter(u => u.role === 'engineer').map(e => ({ ...e, id: String(e.id) }));

      const normalizedComplaints = complaints.map(c => {
        // prefer c.id, fallback to _id, ensure null instead of 'undefined' or 'null' strings
        const rawId = c.id || c._id || null;
        const custId = c.customerId || null;
        const mId = c.machineId || null;
        return {
          ...c,
          id: rawId ? String(rawId) : null,
          customerId: custId ? String(custId) : null,
          machineId: mId ? String(mId) : null,
          assignedTo: c.assignedTo ? String(c.assignedTo) : null,
          displayId: c.complaintId || (rawId ? `TKT-${String(rawId).slice(0,8)}` : null),
          status: c.status || 'pending',
          workStatus: c.workStatus || 'pending'
        };
      });

      setAppState(prev => ({
        ...prev,
        customers,
        machines,
        engineers,
        users: allUsers,
        complaints: normalizedComplaints,
      }));
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update current user state
  const updateCurrentUser = useCallback((userData) => {
    setCurrentUser(userData);
  }, []);

  // Update specific data in app state
  const updateAppState = useCallback((key, data) => {
    setAppState(prev => ({ ...prev, [key]: data }));
  }, []);

  return {
    appState,
    currentUser,
    loading,
    error,
    loadData,
    updateCurrentUser,
    updateAppState,
    setAppState
  };
}
