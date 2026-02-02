import React, { useEffect, useState, Suspense, lazy } from 'react';
import api from '../api';
import Loader from './Loader';
import SuspenseFallback from './SuspenseFallback';

// Core components (always needed)
import DashboardSidebar from './dashboard/DashboardSidebar';
import DashboardHeader from './dashboard/DashboardHeader';

// Lazy load view components for code splitting
const DashboardOverview = lazy(() => import('./dashboard/DashboardOverview'));
const ComplaintsView = lazy(() => import('./dashboard/ComplaintsView'));
const EngineerTicketsView = lazy(() => import('./dashboard/EngineerTicketsView'));
const CustomersView = lazy(() => import('./dashboard/CustomersView'));
const TeamView = lazy(() => import('./dashboard/TeamView'));
const HistoryView = lazy(() => import('./dashboard/HistoryView'));
const WorkHistoryView = lazy(() => import('./dashboard/WorkHistoryView'));
const EngineerAnalyticsView = lazy(() => import('./dashboard/EngineerAnalyticsView'));
const LeaveManagementView = lazy(() => import('./dashboard/LeaveManagementView'));
const DashboardAnalyticsView = lazy(() => import('./dashboard/DashboardAnalyticsView'));
const ActivityFeed = lazy(() => import('./ActivityFeed'));

// New feature views
// TeamMessagingView removed (chat feature disabled)
const SkillsManagementView = lazy(() => import('./dashboard/SkillsManagementView'));
const ServiceChecklistView = lazy(() => import('./dashboard/ServiceChecklist'));
const CustomizableDashboard = lazy(() => import('./dashboard/CustomizableDashboard'));
const MachineServiceHistory = lazy(() => import('./dashboard/MachineServiceHistory'));
const SettingsView = lazy(() => import('./dashboard/SettingsView'));
const SecurityView = lazy(() => import('./dashboard/SecurityView'));

// Modal components (lazy load on demand)
const UserFormModal = lazy(() => import('./dashboard/UserFormModal'));
const AssignEngineerModal = lazy(() => import('./dashboard/modals/AssignEngineerModal'));
const CompleteServiceModal = lazy(() => import('./dashboard/modals/CompleteServiceModal'));
const CloseTicketModal = lazy(() => import('./dashboard/modals/CloseTicketModal'));
const ComplaintFormModal = lazy(() => import('./dashboard/modals/ComplaintFormModal'));
const UpdateNameModal = lazy(() => import('./dashboard/modals/UpdateNameModal'));
const LeaveRequestModal = lazy(() => import('./dashboard/modals/LeaveRequestModal'));

export default function Dashboard({ user, onLogout, onUserUpdate }) {
  // Engineers start on complaints (tickets) page, others on dashboard
  const [currentView, setCurrentView] = useState(user?.role === 'engineer' ? 'complaints' : 'dashboard');
  const [appState, setAppState] = useState({
    customers: [],
    machines: [],
    engineers: [],
    users: [],
    complaints: [],
    leaves: [],
    models: ['Fiber 30W', 'Fiber 50W', 'CO2 100W', 'CO2 150W', 'UV Laser 5W', 'MOPA 60W']
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewMachine, setIsNewMachine] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [user]);

  // Live timer for daily work time + 7pm auto-checkout check
  useEffect(() => {
    if (user?.role !== 'engineer' || !currentUser?.isCheckedIn) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      
      // Check if it's 7:00 PM or later - trigger auto-checkout
      if (hour >= 19 && currentUser?.isCheckedIn) {
        // Auto-checkout on frontend - call API
        api.post('/users/checkout').then(res => {
          const dailyMins = res.data?.dailyTotalWorkTime || 0;
          const hours = Math.floor(dailyMins / 60);
          const mins = dailyMins % 60;
          showToast(`⏰ Auto-checkout at 7:00 PM. Today's total: ${hours}h ${mins}m`, 'info');
          setCurrentUser(res.data);
        }).catch(err => {
          console.error('Auto-checkout error:', err);
        });
        return;
      }

      setCurrentUser(prev => {
        if (!prev || !prev.isCheckedIn || !prev.lastCheckIn) {
          return prev;
        }

        const checkInTime = new Date(prev.lastCheckIn);
        const nowTime = new Date();
        
        // Cap calculation time at 7pm
        let endTime = nowTime;
        if (nowTime.getHours() >= 19) {
          endTime = new Date(nowTime);
          endTime.setHours(19, 0, 0, 0);
        }
        
        // Calculate elapsed minutes since last check-in (capped at 7pm)
        const elapsedMinutes = Math.floor((endTime.getTime() - checkInTime.getTime()) / 60000);
        
        // Base daily work time from previous check-outs today
        const baseDailyTime = prev.baseDailyWorkTime !== undefined ? prev.baseDailyWorkTime : (prev.dailyTotalWorkTime || 0);
        const totalDailyWorkTime = baseDailyTime + elapsedMinutes;

        return {
          ...prev,
          baseDailyWorkTime: baseDailyTime,
          dailyTotalWorkTime: totalDailyWorkTime
        };
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user?.role, currentUser?.isCheckedIn, currentUser?.lastCheckIn]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [customersRes, machinesRes, usersRes, complaintsRes] = await Promise.all([
        api.get('/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/machines').catch(() => ({ data: { machines: [] } })),
        api.get('/users').catch(() => ({ data: { users: [] } })),
        api.get('/complaints').catch(() => ({ data: { complaints: [] } }))
      ]);

      let complaints = complaintsRes.data.complaints || [];

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

      const customers = (customersRes.data.customers || []).map(c => ({ ...c, id: String(c.id) }));
      const machines = (machinesRes.data.machines || []).map(m => ({ ...m, id: String(m.id), customerId: String(m.customerId) }));
      const allUsers = usersRes.data.users || [];
      const engineers = allUsers.filter(u => u.role === 'engineer').map(e => ({ ...e, id: String(e.id) }));

      const normalizedComplaints = complaints.map(c => ({
        ...c,
        id: String(c.id),
        customerId: String(c.customerId),
        machineId: String(c.machineId),
        assignedTo: c.assignedTo ? String(c.assignedTo) : null,
        displayId: c.complaintId || `TKT-${c.id}`,
        status: c.status || 'pending',
        workStatus: c.workStatus || 'pending'
      }));

      setAppState(prev => ({
        ...prev,
        customers,
        machines,
        engineers,
        users: allUsers,
        complaints: normalizedComplaints,
      }));

      // Load leaves
      try {
        const leavesRes = await api.get('/leaves').catch(() => ({ data: { leaves: [] } }));
        const leaves = leavesRes.data.leaves || [];
        setAppState(prev => ({
          ...prev,
          leaves
        }));
      } catch (err) {
        console.log('Could not load leave data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const closeModal = () => setModal(null);

  // ===== USER MANAGEMENT =====
  const handleCreateUser = async (userData) => {
    try {
      await api.post('/users', userData);
      loadData();
      closeModal();
      showToast('User created successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Error creating user', 'error');
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await api.put(`/users/${userId}`, userData);
      loadData();
      closeModal();
      showToast('User updated successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Error updating user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        loadData();
        showToast('User deleted', 'success');
      } catch (error) {
        showToast('Error deleting user', 'error');
      }
    }
  };

  const handleBlockUser = async (userId, shouldBlock) => {
    const action = shouldBlock ? 'block' : 'unblock';
    try {
      await api.post(`/users/${userId}/${action}`);
      loadData();
      showToast(`User ${action}ed`, 'success');
    } catch (error) {
      showToast(`Error ${action}ing user`, 'error');
    }
  };

  // ===== COMPLAINT MANAGEMENT =====
  const assignComplaint = async (complaintId, engineerId) => {
    try {
      await api.post(`/complaints/${complaintId}/assign`, { engineerId });
      loadData();
      closeModal();
      showToast('Engineer assigned successfully', 'success');
    } catch (error) {
      showToast('Error assigning engineer', 'error');
    }
  };

  const handleCancelAssignment = async (complaintId) => {
    try {
      await api.post(`/complaints/${complaintId}/unassign`);
      loadData();
      showToast('Assignment cancelled', 'success');
    } catch (error) {
      showToast('Error cancelling assignment', 'error');
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      loadData();
      showToast(`Status Updated: ${status}`, 'success');
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  const handleCompleteSubmit = async (complaintId, solution, spares) => {
    try {
      await api.post(`/complaints/${complaintId}/complete`, { workPerformed: solution, solutionNotes: solution, sparesUsed: spares });
      loadData();
      closeModal();
      showToast('Service completed and ticket closed.', 'success');
    } catch (error) {
      showToast('Error completing ticket', 'error');
    }
  };

  const handleCloseSubmit = async (complaintId, notes) => {
    if (!notes.trim()) {
      showToast('Closing requires notes', 'warning');
      return;
    }
    try {
      await api.post(`/complaints/${complaintId}/close`, { solutionNotes: notes });
      loadData();
      closeModal();
      showToast('Ticket closed with notes.', 'success');
    } catch (error) {
      showToast('Error closing ticket', 'error');
    }
  };

  const handleComplaintSubmit = async (formData) => {
    try {
      let cid = formData.customerId ? parseInt(formData.customerId) : null;
      let mid = formData.machineId ? parseInt(formData.machineId) : null;

      // If new customer, create it first
      if (formData.isNewCustomer && formData.customerData) {
        const customerPayload = {
          name: formData.customerData.companyName,
          company: formData.customerData.companyName,
          companyName: formData.customerData.companyName,
          serviceNo: formData.serviceNo,
          contactPerson: formData.customerData.contactPerson,
          city: formData.customerData.city || 'Unknown',
          contact: formData.customerData.phone || 'N/A',
          phone: formData.customerData.phone,
          phones: formData.customerData.phones,
          address: formData.customerData.address,
          email: formData.customerData.email
        };
        const created = await api.post('/customers', customerPayload);
        cid = created.data.id;
      }

      // If new machine, create it
      if (formData.isNewMachine && formData.machineData) {
        if (!formData.machineData.model || !formData.machineData.serialNumber) {
          showToast("Machine Model and Serial No are required", "warning");
          return;
        }
        const machineCreated = await api.post('/machines', {
          model: formData.machineData.model,
          serialNumber: formData.machineData.serialNumber,
          installationDate: new Date().toISOString(),
          warrantyAmc: 'N/A',
          customerId: cid
        });
        mid = machineCreated.data.id;
        
        // Add new model to state if it's custom
        const modelName = formData.machineData.model;
        setAppState(prev => ({
          ...prev,
          models: !prev.models.includes(modelName) ? [...prev.models, modelName] : prev.models
        }));
      }

      if (!cid || !mid || cid === 0 || mid === 0 || isNaN(cid) || isNaN(mid)) {
        showToast("Customer and Machine are required", "warning");
        return;
      }

      // Create complaint with all new fields
      const complaintPayload = { 
        problem: formData.problem, 
        priority: formData.priority || 'medium', 
        customerId: cid, 
        machineId: mid,
        issueCategories: formData.issueCategories || [],
        attachments: formData.attachments || []
      };
      
      const complaintRes = await api.post('/complaints', complaintPayload);

      if (complaintRes.data) {
        loadData();
        setModal(null);
        setIsNewClient(false);
        setIsNewMachine(false);
        showToast(`Ticket created successfully.`, 'success');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error creating complaint';
      showToast(errorMsg, 'error');
    }
  };

  // ===== ENGINEER DAILY CHECK-IN/OUT =====
  const handleDailyCheckIn = async () => {
    try {
      const res = await api.post('/users/check-in');
      const userData = res.data;
      // Store the base daily work time at check-in to prevent compounding
      setCurrentUser({ ...userData, baseDailyWorkTime: userData.dailyTotalWorkTime || 0 });
      showToast('✓ Checked in for the day. Let\'s get to work!', 'success');
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMsg = error.response.data.error;
        if (errorMsg === 'Already checked in') {
          showToast('You are already checked in.', 'info');
          loadData();
        } else if (errorMsg.includes('Check-in is only allowed')) {
          showToast(errorMsg, 'error');
        } else {
          showToast('Error checking in', 'error');
        }
      } else {
        showToast('Error checking in', 'error');
      }
    }
  };

  const handleDailyCheckOut = async () => {
    try {
      const res = await api.post('/users/check-out');
      setCurrentUser(res.data);
      const hours = Math.floor((res.data?.dailyTotalWorkTime || 0) / 60);
      const mins = (res.data?.dailyTotalWorkTime || 0) % 60;
      const message = res.data?.autoCheckout 
        ? `✓ Auto checkout at 7:00 PM. Today's total work time: ${hours}h ${mins}m`
        : `✓ Checked out. Today's total work time: ${hours}h ${mins}m`;
      showToast(message, 'success');
    } catch (error) {
      showToast('Error checking out', 'error');
    }
  };

  const handleEditName = () => {
    setModal('updateName');
  };

  const handleNameUpdateSuccess = (updatedUser) => {
    closeModal();
    // Update the user object in parent component
    if (onUserUpdate) {
      onUserUpdate({ ...user, name: updatedUser.name });
    }
    showToast('✓ Profile updated successfully!', 'success');
    loadData();
  };

  // ===== RENDER CONTENT BASED ON VIEW =====
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview complaints={appState.complaints} customers={appState.customers} machines={appState.machines} setCurrentView={setCurrentView} setModal={setModal} user={user} />;
      case 'complaints':
        // Engineers get card-style view, others get table view
        if (user?.role === 'engineer') {
          return <EngineerTicketsView 
            complaints={appState.complaints} 
            customers={appState.customers} 
            machines={appState.machines}
            currentUser={currentUser}
            onTakeTicket={assignComplaint}
            onStartWork={updateTicketStatus}
            onComplete={(complaint) => setModal({ type: 'complete', complaint })}
            onClose={(complaint) => setModal({ type: 'close', complaint })}
            onCancelAssignment={handleCancelAssignment}
          />;
        }
        return <ComplaintsView 
          complaints={appState.complaints} 
          customers={appState.customers} 
          machines={appState.machines}
          user={user}
          onAssign={assignComplaint}
          onTakeTicket={assignComplaint}
          onCancelAssignment={handleCancelAssignment}
          onStartWork={updateTicketStatus}
          onComplete={handleCompleteSubmit}
          onClose={handleCloseSubmit}
          setModal={setModal}
        />;
      case 'customers':
        return <CustomersView customers={appState.customers} machines={appState.machines} setModal={setModal} user={user} />;
      case 'team':
        return <TeamView 
          users={appState.users}
          user={user}
          onNewUser={() => setModal({ type: 'user-form', userToEdit: null })}
          onEditUser={(targetUser) => setModal({ type: 'user-form', userToEdit: targetUser })}
          onDeleteUser={handleDeleteUser}
          onBlockUser={handleBlockUser}
          setModal={setModal}
        />;
      case 'history':
        return <HistoryView machines={appState.machines} customers={appState.customers} complaints={appState.complaints} setModal={setModal} user={user} />;
      case 'work-history':
        return <WorkHistoryView user={user} />;
      case 'engineer-analytics':
        return <EngineerAnalyticsView users={appState.users} appState={appState} setModal={setModal} user={user} />;
      case 'leaves':
        return <LeaveManagementView 
          leaves={appState.leaves} 
          user={user}
          onApprove={() => {}}
          onReject={() => {}}
          onRefresh={loadData}
          setModal={setModal}
        />;
      case 'analytics':
        return <DashboardAnalyticsView complaints={appState.complaints} users={appState.users} setModal={setModal} user={user} />;
      case 'activity':
        return <ActivityFeed complaints={appState.complaints} users={appState.users} />;
      
      // New feature views
      
      case 'skills':
        return <SkillsManagementView currentUser={user} />;
      case 'my-skills':
        return <SkillsManagementView currentUser={user} />;
      case 'checklists':
        return <ServiceChecklistView />;
      case 'customize':
        return <CustomizableDashboard userRole={user?.role} />;
      case 'settings':
        return <SettingsView user={user} showToast={showToast} />;
      case 'security':
        return <SecurityView showToast={showToast} />;
        
      default:
        return <DashboardOverview complaints={appState.complaints} customers={appState.customers} machines={appState.machines} setCurrentView={setCurrentView} />;
    }
  };

  // ===== RENDER MODALS =====
  const renderModal = () => {
    if (!modal) return null;

    if (modal.type === 'assign') {
      return <AssignEngineerModal complaint={modal.complaint} engineers={appState.engineers} onAssign={assignComplaint} onClose={closeModal} />;
    }

    if (modal.type === 'complete') {
      return <CompleteServiceModal complaint={modal.complaint} onSubmit={handleCompleteSubmit} onClose={closeModal} />;
    }

    if (modal.type === 'close') {
      return <CloseTicketModal complaint={modal.complaint} onSubmit={handleCloseSubmit} onClose={closeModal} />;
    }

    if (modal.type === 'user-form') {
      return (
        <UserFormModal
          currentUser={user}
          userToEdit={modal.userToEdit}
          onClose={closeModal}
          onCreate={handleCreateUser}
          onUpdate={handleUpdateUser}
        />
      );
    }

    if (modal === 'complaint') {
      return (
        <ComplaintFormModal
          appState={appState}
          user={user}
          isNewClient={isNewClient}
          isNewMachine={isNewMachine}
          setIsNewClient={setIsNewClient}
          setIsNewMachine={setIsNewMachine}
          onSubmit={handleComplaintSubmit}
          onClose={() => { setModal(null); setIsNewClient(false); setIsNewMachine(false); }}
          showToast={showToast}
        />
      );
    }

    if (modal === 'updateName') {
      return (
        <UpdateNameModal
          user={user}
          onClose={closeModal}
          onSuccess={handleNameUpdateSuccess}
        />
      );
    }

    if (modal === 'leaveRequest') {
      return (
        <LeaveRequestModal
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            loadData();
            showToast('Leave request submitted successfully', 'success');
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar 
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onLogout={onLogout}
        onCheckIn={handleDailyCheckIn}
        onCheckOut={handleDailyCheckOut}
        onEditName={handleEditName}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardHeader 
          currentView={currentView}
          onNewComplaint={() => setModal('complaint')}
          onRequestLeave={() => setModal('leaveRequest')}
          user={user}
        />
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar relative">
          {isLoadingData && <Loader message="Loading data..." fullScreen={true} />}
          <Suspense fallback={<SuspenseFallback />}>
            {!isLoadingData && renderContent()}
          </Suspense>
        </div>
      </main>

      {/* Modal with Suspense */}
      <Suspense fallback={<SuspenseFallback />}>
        {renderModal()}
      </Suspense>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
          <div className={`px-6 py-4 rounded-[1.25rem] shadow-2xl border border-white/10 text-white notification-toast ${
            toast.type === 'success' ? 'bg-emerald-600' :
            toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-600'
          }`}>
            <p className="text-xs font-bold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
