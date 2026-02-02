# Dashboard Refactoring - Quick Reference Guide

## 📚 Documentation Files

Start here based on your needs:

### **New to the Refactoring?**
→ Read [REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md)
- High-level overview
- Before/after comparison
- Statistics and benefits

### **Understanding the New Structure?**
→ Read [COMPONENT_STRUCTURE.md](COMPONENT_STRUCTURE.md)
- File tree visualization
- Component size chart
- How to add new features

### **Deep Dive into Details?**
→ Read [REFACTORING_NOTES.md](REFACTORING_NOTES.md)
- Complete breakdown
- Data flow architecture
- Import references
- Future improvements

---

## 🎯 Quick Navigation

### View Components (displays data)
```
DashboardSidebar.js       ← Navigation sidebar
DashboardHeader.js        ← Top header bar
DashboardOverview.js      ← Home dashboard
ComplaintsView.js         ← All tickets table
CustomersView.js          ← Client directory
TeamView.js               ← User management
HistoryView.js            ← Service history
```

### Modal Components (forms & dialogs)
```
UserFormModal.js          ← User create/edit
AssignEngineerModal.js    ← Assign to ticket
CompleteServiceModal.js   ← Mark complete
CloseTicketModal.js       ← Close without fix
ComplaintFormModal.js     ← Create ticket
```

### Reusable Components (use anywhere)
```
StatCard.js               ← Generic stat display
StatusBadge.js            ← Status indicator
```

---

## 🔄 Data Flow Cheat Sheet

```
User Action → Component Callback → Dashboard Handler → API Call → 
  ↓
State Update → All Components Re-render → View Updates
```

Example: Assigning an engineer
1. User clicks "Assign" in ComplaintsView
2. ComplaintsView calls `onAssign()` (prop callback)
3. Dashboard.assignComplaint() runs
4. API: POST /complaints/:id/assign
5. Dashboard.loadData() refreshes
6. ComplaintsView gets new data via props
7. Table re-renders with updated assignment

---

## 🛠️ Common Tasks

### Add a New View
1. Create `dashboard/NewView.js`
2. Add import to Dashboard.js
3. Add case in renderContent() switch
4. Add nav link in DashboardSidebar

### Add a New Modal
1. Create `dashboard/modals/NewModal.js`
2. Add import to Dashboard.js
3. Add handler in Dashboard.js
4. Add condition in renderModal() switch

### Create Reusable Component
1. Create `dashboard/MyComponent.js`
2. Accept simple props
3. No state (presentation only)
4. Export as default

### Add New API Handler
1. Create handler in Dashboard.js
2. Use api.get/post/put/delete
3. Call loadData() to refresh
4. Call showToast() for feedback
5. Pass as callback to component

---

## 📊 Component Dependency Tree

```
Dashboard.js (root)
├── DashboardSidebar
├── DashboardHeader
├── ComplaintsView
│   ├── StatusBadge ✓ reusable
│   └── (many actions)
├── CustomersView
├── TeamView
├── DashboardOverview
│   ├── StatCard ✓ reusable
│   └── StatusBadge ✓ reusable
├── HistoryView
├── Modals:
│   ├── UserFormModal
│   ├── AssignEngineerModal
│   ├── CompleteServiceModal
│   ├── CloseTicketModal
│   └── ComplaintFormModal
└── Toast (built-in)
```

---

## 🔍 Find What You're Looking For

| I want to... | Location | Line count |
|---|---|---|
| View all users | TeamView.js | ~60 |
| Create a user | UserFormModal.js | ~70 |
| View all complaints | ComplaintsView.js | ~80 |
| Assign engineer | AssignEngineerModal.js | ~25 |
| View customers | CustomersView.js | ~35 |
| View dashboard home | DashboardOverview.js | ~50 |
| View service history | HistoryView.js | ~35 |
| Navigate between pages | DashboardSidebar.js | ~80 |
| See all handlers | Dashboard.js (search: `const handle`) | ~250 |
| See all state | Dashboard.js (search: `useState`) | ~20 |

---

## 🧪 Testing Components

Each component is small enough to test independently:

```javascript
// Example test for StatCard
import StatCard from './dashboard/StatCard'
import { AlertCircle } from 'lucide-react'

render(
  <StatCard 
    label="Open Tickets" 
    value={5} 
    Icon={AlertCircle}
    color="text-rose-600"
    bg="bg-rose-50"
  />
)

expect(screen.getByText('Open Tickets')).toBeInTheDocument()
expect(screen.getByText('5')).toBeInTheDocument()
```

---

## 🚀 Performance Tips

1. **Use React.memo()** on expensive view components
2. **Use useCallback()** for stable callbacks
3. **Lazy load** modals if they're heavy
4. **Optimize** API calls (debounce, cache)
5. **Profile** with React DevTools Profiler

---

## ⚠️ Common Pitfalls to Avoid

❌ Don't:
- Import components with wrong path
- Forget to pass required props
- Call setModal directly in view (use callback)
- Put state in view components

✅ Do:
- Use consistent naming for callbacks
- Pass only necessary props
- Keep views as pure functions
- Keep state in Dashboard.js
- Document new components

---

## 📖 Code Style Guide

### Component Template
```javascript
import React from 'react'
import { IconName } from 'lucide-react'

export default function MyComponent({ 
  dataProperty,
  callbackProp,
  user
}) {
  return (
    <div className="...">
      {/* JSX here */}
    </div>
  )
}
```

### Handler Template (Dashboard.js)
```javascript
const handleSomething = async (params) => {
  try {
    const res = await api.post('/endpoint', data)
    loadData()
    showToast('Success message', 'success')
  } catch (error) {
    showToast('Error message', 'error')
  }
}
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Import errors | Check path: `./dashboard/ComponentName` |
| Props undefined | Verify component is receiving props |
| Modal won't show | Check modal type in switch statement |
| Data not updating | Call loadData() in handler |
| No feedback | Use showToast() for user feedback |
| Component not rendering | Check default export |

---

## 📞 Key Files Location

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.js ⭐ MAIN FILE
│   │   └── dashboard/
│   │       ├── *.js (view components)
│   │       └── modals/
│   │           └── *.js (modal components)
│   ├── api.js (API client)
│   └── ...
└── ...
```

---

## 🎓 Learning Path

1. **Understand structure**: Read COMPONENT_STRUCTURE.md
2. **Explore main file**: Open Dashboard.js, see imports & state
3. **Pick a view**: Read DashboardOverview.js (simplest)
4. **Pick a modal**: Read AssignEngineerModal.js (simple)
5. **Understand flow**: Trace one action from click to API

---

## 💡 Pro Tips

- Use Cmd/Ctrl+P in VS Code to quickly open components
- Use Cmd/Ctrl+F to search within a file
- Use Cmd/Ctrl+Shift+F to search across files
- Look at Dashboard.js imports to see component structure
- Use React DevTools Profiler for performance analysis

---

**Happy coding! 🎉**

Need more info? Check the detailed documentation files above.
