# Dashboard Refactoring - File Structure Guide

## Complete New Directory Tree

```
frontend/src/components/
│
├── Dashboard.js ⭐ (MAIN - 410 lines)
│   └── Orchestrates all views and modals
│       Manages: state, API calls, navigation
│
└── dashboard/ (All support components)
    │
    ├── 📋 VIEW COMPONENTS
    │   ├── DashboardSidebar.js      (Navigation sidebar)
    │   ├── DashboardHeader.js       (Top header bar)
    │   ├── DashboardOverview.js     (Home dashboard view)
    │   ├── ComplaintsView.js        (Tickets/Incidents list)
    │   ├── CustomersView.js         (Client directory)
    │   ├── TeamView.js              (User management)
    │   └── HistoryView.js           (Service history)
    │
    ├── 🎨 REUSABLE COMPONENTS
    │   ├── StatCard.js              (Stats display)
    │   ├── StatusBadge.js           (Status indicator)
    │   └── UserFormModal.js         (User create/edit)
    │
    └── modals/ (Modal dialogs)
        ├── AssignEngineerModal.js      (Assign engineer to ticket)
        ├── CompleteServiceModal.js     (Mark service complete)
        ├── CloseTicketModal.js         (Close ticket without fix)
        └── ComplaintFormModal.js       (Create new complaint/ticket)
```

## Component Size Summary

| Component | Type | Size | Responsibility |
|-----------|------|------|-----------------|
| Dashboard.js | Main | 410 lines | State, routing, API coordination |
| DashboardSidebar.js | View | ~80 lines | Navigation & user profile |
| DashboardHeader.js | View | ~30 lines | Page header & top actions |
| DashboardOverview.js | View | ~50 lines | Stats & recent tickets |
| ComplaintsView.js | View | ~80 lines | All complaints table |
| CustomersView.js | View | ~35 lines | Customer accounts display |
| TeamView.js | View | ~60 lines | User management table |
| HistoryView.js | View | ~35 lines | Service history cards |
| **Total Views** | - | **370 lines** | - |
| StatCard.js | Reusable | ~15 lines | Generic stat card |
| StatusBadge.js | Reusable | ~10 lines | Status display |
| UserFormModal.js | Modal | ~70 lines | User form |
| AssignEngineerModal.js | Modal | ~25 lines | Engineer assignment |
| CompleteServiceModal.js | Modal | ~40 lines | Service completion |
| CloseTicketModal.js | Modal | ~35 lines | Close without fix |
| ComplaintFormModal.js | Modal | ~120 lines | Create complaint |
| **Total Other** | - | **315 lines** | - |

**Reduction: 1207 lines → 410 + 315 = 725 lines**
- More readable, organized code
- Better separation of concerns
- Easier to maintain and extend

## How to Use Each Component

### Main Dashboard
```javascript
import Dashboard from './Dashboard';

// In App.js or main router:
<Dashboard user={user} onLogout={handleLogout} />
```

### Reusable in Other Features
```javascript
import StatCard from './components/dashboard/StatCard';
import StatusBadge from './components/dashboard/StatusBadge';

// Now you can use these anywhere in the app
<StatCard label="Active Users" value={42} Icon={Users} ... />
<StatusBadge status="Completed" />
```

### Individual Views (if needed separately)
```javascript
import ComplaintsView from './components/dashboard/ComplaintsView';

// Can be rendered independently if refactored into separate pages
<ComplaintsView complaints={data} customers={...} ... />
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard.js                          │
│  (State: view, appState, modal, toast, checks)         │
│                                                          │
│  ↓ Passes Props                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ renderContent()  - Switch based on currentView   │  │
│  │                                                   │  │
│  │  • dashboard → DashboardOverview (stats)        │  │
│  │  • complaints → ComplaintsView (table)          │  │
│  │  • customers → CustomersView (cards)            │  │
│  │  • team → TeamView (users table)                │  │
│  │  • history → HistoryView (machines)             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ renderModal() - Switch based on modal.type       │  │
│  │                                                   │  │
│  │  • null → null (no modal)                        │  │
│  │  • 'complaint' → ComplaintFormModal              │  │
│  │  • { type: 'assign' } → AssignEngineerModal     │  │
│  │  • { type: 'complete' } → CompleteServiceModal  │  │
│  │  • { type: 'close' } → CloseTicketModal         │  │
│  │  • { type: 'user-form' } → UserFormModal        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## API Call Organization

**All API handlers are in Dashboard.js** and follow this pattern:

### Data Loading
```javascript
loadData() // Fetches: customers, machines, users, complaints
```

### User Management
```javascript
handleCreateUser(userData)
handleUpdateUser(userId, userData)
handleDeleteUser(userId)
handleBlockUser(userId, shouldBlock)
```

### Complaint Actions
```javascript
assignComplaint(complaintId, engineerId)
handleCancelAssignment(complaintId)
updateTicketStatus(id, status)
handleCompleteSubmit(complaintId, solution, spares)
handleCloseSubmit(complaintId, notes)
handleComplaintSubmit(formData) // Create complaint
```

### Check-in/Check-out
```javascript
handleDailyCheckIn()
handleDailyCheckOut()
```

## Component Communication

All child components communicate **UP** to Dashboard.js via props:

```
ComplaintsView
  └ User clicks "Assign" button
  └ Calls onAssign() from props
  └ onAssign = assignComplaint (from Dashboard)
  └ API call happens in Dashboard
  └ State updates (appState)
  └ All components re-render with new data
```

## Adding a New Feature

1. **Create new view component** in `dashboard/`
   - Accept: `{ appState, user, callbacks... }`
   - Return: JSX displaying that view

2. **Add handler in Dashboard.js**
   - Add API call function
   - Add state if needed

3. **Wire in renderContent()**
   - Add case in switch statement
   - Import component at top

4. **Add navigation**
   - Update links in DashboardSidebar.js

5. **Test**
   - Component renders correctly
   - Props are passed correctly
   - Callbacks trigger properly

## Performance Notes

- Each view component is lightweight (30-80 lines)
- No unnecessary re-renders (props are memoized types)
- Modal system prevents unmounting/remounting
- AppState is single source of truth
- Consider React.memo() on expensive view components

## Debugging Tips

1. **Check which view is shown**: Look at `currentView` state
2. **Check which modal is shown**: Look at `modal` state
3. **Check data availability**: Inspect `appState` in DevTools
4. **Check toast messages**: Toast component at bottom
5. **Component not rendering?**: Check import paths match file structure
