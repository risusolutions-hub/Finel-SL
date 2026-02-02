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
const SparePartsUsedPage = lazy(() => import('./dashboard/SparePartsUsedPage'));

// Modal components (lazy load on demand)
const UserFormModal = lazy(() => import('./dashboard/UserFormModal'));
const AssignEngineerModal = lazy(() => import('./dashboard/modals/AssignEngineerModal'));
const CompleteServiceModal = lazy(() => import('./dashboard/modals/CompleteServiceModal'));
const CloseTicketModal = lazy(() => import('./dashboard/modals/CloseTicketModal'));
const ComplaintFormModal = lazy(() => import('./dashboard/modals/ComplaintFormModal'));
const UpdateNameModal = lazy(() => import('./dashboard/modals/UpdateNameModal'));
const LeaveRequestModal = lazy(() => import('./dashboard/modals/LeaveRequestModal'));

// Toast notification helper

export default function Dashboard({ user, onLogout, onUserUpdate }) {
  // Engineers start on complaints (tickets) page, others on dashboard
  const getInitialView = () => {
    const saved = window.localStorage.getItem('dashboardView');
    if (saved) return saved;
    return user?.role === 'engineer' ? 'complaints' : 'dashboard';
  };
  const [currentView, setCurrentView] = useState(getInitialView());
  // Consolidated useEffect hook for persisting currentView
  useEffect(() => {
    window.localStorage.setItem('dashboardView', currentView);
  }, [currentView]);
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
    // Toast notification helper must be inside the component to access setToast
    const showToast = (message, type = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    };
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewMachine, setIsNewMachine] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load data
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      let complaints = [];
      const [customersRes, machinesRes, usersRes] = await Promise.all([
        api.get('/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/machines').catch(() => ({ data: { machines: [] } })),
        api.get('/users').catch(() => ({ data: { users: [] } }))
      ]);

      if (user?.role === 'engineer') {
        // Fetch my tickets and available tickets separately
        const [myRes, availableRes] = await Promise.all([
          api.get('/complaints/my').catch(() => ({ data: { complaints: [] } })),
          api.get('/complaints/available').catch(() => ({ data: { complaints: [] } })),
        ]);
        complaints = [...(myRes.data.complaints || []), ...(availableRes.data.complaints || [])];
      } else {
        // Non-engineers: load all complaints
        const complaintsRes = await api.get('/complaints').catch(() => ({ data: { complaints: [] } }));
        complaints = complaintsRes.data.complaints || [];
      }

      const customers = (customersRes.data.customers || []).map(c => ({ ...c, id: String(c.id) }));
      const machines = (machinesRes.data.machines || []).map(m => ({ ...m, id: String(m.id), customerId: String(m.customerId) }));
      const allUsers = usersRes.data.users || [];
      const engineers = allUsers.filter(u => u.role === 'engineer').map(e => ({ ...e, id: String(e.id) }));

      const normalizedComplaints = complaints.map(c => ({
        ...c,
        id: String(c._id || c.id),
        customerId: String(c.customerId),
        machineId: String(c.machineId),
        assignedTo: c.assignedTo ? String(c.assignedTo) : null,
        displayId: c.complaintId || `TKT-${String(c._id || c.id).slice(0, 8)}`,
        status: c.status || 'pending',
        workStatus: c.workStatus || 'pending',
      }));

      setAppState(prev => ({
        ...prev,
        customers,
        machines,
        engineers,
        users: allUsers,
        complaints: normalizedComplaints,
      }));

      const leavesRes = await api.get('/leaves').catch(() => ({ data: { leaves: [] } }));
      setAppState(prev => ({
        ...prev,
        leaves: leavesRes.data.leaves || [],
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    // Ensure currentUser is set for engineer views
    if (!currentUser && user) {
      setCurrentUser(user);
    }
  }, []);

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
    // Defensive checks to avoid sending 'undefined' values to the server
    if (!complaintId || complaintId === 'undefined') { showToast('Invalid complaint selected', 'error'); closeModal(); return false; }
    if (!engineerId || engineerId === 'undefined') { showToast('Invalid engineer selected', 'error'); return false; }
    try {
      await api.post(`/complaints/${complaintId}/assign`, { engineerId });
      loadData();
      closeModal();
      showToast('Engineer assigned successfully', 'success');
      return true;
    } catch (error) {
      showToast('Error assigning engineer', 'error');
      return false;
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
    console.log('handleComplaintSubmit called with:', formData);
    try {
      // Treat ids as strings (Mongo ObjectId) — do NOT parseInt
      let cid = formData.customerId && String(formData.customerId).trim() ? formData.customerId : null;
      let mid = formData.machineId && String(formData.machineId).trim() ? formData.machineId : null;

      // Note: backend will create customer/machine when customerData/machineData present
      // so we avoid calling protected endpoints from frontend.

      // Validate presence: require either customerId or customerData
      if (!cid && !(formData.customerData && formData.customerData.companyName)) {
        showToast('Customer required', 'warning');
        return;
      }

      // Validate machine: require either machineId or machineData
      if (!mid && !(formData.machineData && formData.machineData.model && formData.machineData.serialNumber)) {
        showToast('Machine details required', 'warning');
        return;
      }

      // Build complaint payload with optional nested data
      const complaintPayload = {
        problem: formData.problem,
        priority: formData.priority || 'medium',
        customerId: cid,
        machineId: mid,
        issueCategories: formData.issueCategories || []
      };
      if (formData.customerData) complaintPayload.customerData = formData.customerData;
      if (formData.machineData) complaintPayload.machineData = formData.machineData;
      if (formData.serviceNo) complaintPayload.serviceNo = formData.serviceNo;
      if (formData.isNewCustomer !== undefined) complaintPayload.isNewCustomer = formData.isNewCustomer;
      if (formData.isNewMachine !== undefined) complaintPayload.isNewMachine = formData.isNewMachine;

      console.log('Creating complaint (server will create customer/machine if needed):', complaintPayload);
      const complaintRes = await api.post('/complaints', complaintPayload);
      console.log('Complaint response:', complaintRes);

      if (complaintRes.data) {
        // If server returned populated { complaint, customer, machine }, update local state instead of full reload
        const { complaint, customer, machine } = complaintRes.data;
        setAppState(prev => {
          const customers = customer ? [customer, ...prev.customers.filter(c => String(c._id || c.id) !== String(customer._id || customer.id))] : prev.customers;
          const machines = machine ? [machine, ...prev.machines.filter(m => String(m._id || m.id) !== String(machine._id || machine.id))] : prev.machines;
          const rawId = complaint._id || complaint.id || null;
          const normalized = {
            ...complaint,
            id: rawId ? String(rawId) : null,
            complaintId: complaint.complaintId,
            customerId: customer ? (customer._id || customer.id ? String(customer._id || customer.id) : null) : (complaint.customerId ? String(complaint.customerId) : null),
            machineId: machine ? (machine._id || machine.id ? String(machine._id || machine.id) : null) : (complaint.machineId ? String(complaint.machineId) : null),
            displayId: complaint.complaintId || (rawId ? `TKT-${String(rawId).slice(0,8)}` : null)
          };
          const complaints = [normalized, ...prev.complaints];
          return { ...prev, customers, machines, complaints };
        });

        setModal(null);
        setIsNewClient(false);
        setIsNewMachine(false);
        showToast('Ticket created successfully', 'success');
      }
    } catch (error) {
      console.error('Error in handleComplaintSubmit:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error creating complaint';

      // Handle duplicate serial warning (409) - offer to use existing machine
      if (error.response?.status === 409 && error.response?.data?.existingMachine) {
        const existing = error.response.data.existingMachine;
        const existingCustomer = error.response.data.existingCustomer;
        const useExisting = window.confirm(
          `The serial number you entered belongs to another customer (${existingCustomer?.companyName || existingCustomer?.name || existingCustomer?.serviceNo}).\n\n` +
          'Click OK to create the ticket on the existing machine and customer, or Cancel to abort.'
        );
        if (useExisting) {
          try {
            const retryPayload = { ...complaintPayload, machineId: existing._id, customerId: existing.customerId };
            // Remove nested customerData to avoid new customer creation
            delete retryPayload.customerData;
            delete retryPayload.machineData;
            const retryRes = await api.post('/complaints', retryPayload);
            if (retryRes.data) {
              const { complaint, customer, machine } = retryRes.data;
              setAppState(prev => {
                const customers = customer ? [customer, ...prev.customers.filter(c => String(c._id || c.id) !== String(customer._id || customer.id))] : prev.customers;
                const machines = machine ? [machine, ...prev.machines.filter(m => String(m._id || m.id) !== String(machine._id || machine.id))] : prev.machines;
                const rawId = complaint._id || complaint.id || null;
                const normalized = {
                  ...complaint,
                  id: rawId ? String(rawId) : null,
                  complaintId: complaint.complaintId,
                  customerId: customer ? (customer._id || customer.id ? String(customer._id || customer.id) : null) : (complaint.customerId ? String(complaint.customerId) : null),
                  machineId: machine ? (machine._id || machine.id ? String(machine._id || machine.id) : null) : (complaint.machineId ? String(complaint.machineId) : null),
                  displayId: complaint.complaintId || (rawId ? `TKT-${String(rawId).slice(0,8)}` : null)
                };
                const complaints = [normalized, ...prev.complaints];
                return { ...prev, customers, machines, complaints };
              });

              setModal(null);
              setIsNewClient(false);
              setIsNewMachine(false);
              showToast('Ticket created on existing machine.', 'success');
              return;
            }
          } catch (retryErr) {
            console.error('Error creating ticket on existing machine:', retryErr);
            showToast(retryErr.response?.data?.error || 'Failed to create ticket on existing machine', 'error');
            return;
          }
        } else {
          // user cancelled - just show warning
          showToast('Ticket creation cancelled due to duplicate serial', 'warning');
          return;
        }
      }

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

  const closeModal = () => setModal(null);

  // ===== RENDER CONTENT BASED ON VIEW =====
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview 
          complaints={appState.complaints}
          customers={appState.customers}
          machines={appState.machines}
          setCurrentView={setCurrentView}
          setModal={setModal}
          user={user}
          engineers={appState.engineers}
        />;
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
      case 'spare-parts-used':
        return <SparePartsUsedPage complaints={appState.complaints} machines={appState.machines} customers={appState.customers} />;
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
      return <AssignEngineerModal complaint={modal.complaint} engineers={appState.engineers} onAssign={assignComplaint} onClose={closeModal} loadData={loadData} />;
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

      <Suspense fallback={<SuspenseFallback />}>
        {renderModal()}
      </Suspense>

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
