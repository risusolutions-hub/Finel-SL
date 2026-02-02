# 🧪 Feature Testing & Verification Guide

## Quick Start Testing

### Prerequisites
- Frontend running: `npm start` from `frontend/` directory
- Backend running: `npm start` from `backend/` directory
- Browser DevTools open (F12)

---

## Test 1: Code Splitting ✅

### What to Test
Verify that views load on-demand rather than all at startup

### Steps
1. Open DevTools → **Network** tab
2. Filter by **JS** files
3. Reload the page
4. Observe initial load (should see Loader briefly)
5. Click "Tickets" in sidebar
6. **Expected**: New JS chunk loads for ComplaintsView
7. Click "Analytics"
8. **Expected**: New JS chunk loads for DashboardAnalyticsView
9. Click "Activity Log"
10. **Expected**: New JS chunk loads for ActivityFeed

### Success Criteria
- ✓ Initial page load < 100KB JavaScript
- ✓ Each view click triggers new network request
- ✓ No console errors
- ✓ Loader shows briefly on each view transition

---

## Test 2: Professional Loader 🔄

### What to Test
Verify loader appears during data fetch and view transitions

### Steps
1. Open DevTools → **Network** tab
2. Throttle to "Slow 3G" (for visible loading)
3. Click "Dashboard"
4. **Expected**: Spinning ring + bouncing dots animation
5. Wait for view to load
6. **Expected**: Loader disappears, Dashboard displays
7. Repeat for other views

### Success Criteria
- ✓ Loader appears immediately on navigation
- ✓ Loader centered and visible
- ✓ Smooth animation (no jank)
- ✓ Loader hides when view ready
- ✓ No layout shift when loader disappears

---

## Test 3: Advanced Search & Filters 🔍

### What to Test
Verify search and filter functionality in Complaints view

### Prerequisites
- Be logged in as Admin/Manager
- Navigate to "Tickets" view
- Should see complaints table with search/filter bar above

### Step 1: Search by Text
1. In search box, type "fiber" (partial machine model)
2. Wait 300ms (debounce)
3. **Expected**: Table filters to show only fiber laser complaints
4. Clear and type "John" (engineer name)
5. **Expected**: Shows complaints assigned to John
6. Clear search box
7. **Expected**: All complaints show again

### Step 2: Filter by Status
1. Check "Assigned" checkbox
2. **Expected**: Shows only Assigned tickets
3. Uncheck "Assigned", check "In Progress"
4. **Expected**: Shows only In Progress tickets
5. Check multiple: "Pending" + "Resolved"
6. **Expected**: Shows both pending AND resolved

### Step 3: Filter by Priority
1. Check "Critical" checkbox
2. **Expected**: Shows only critical priority tickets
3. Check "High" as well
4. **Expected**: Shows Critical OR High priority
5. Uncheck all
6. **Expected**: Shows all priorities

### Step 4: Combine Search + Filters
1. Type "smith" in search (engineer name)
2. Check Status "In Progress"
3. Check Priority "High"
4. **Expected**: Shows tickets assigned to Smith, status In Progress, priority High
5. Clear search
6. **Expected**: Shows all In Progress + High priority tickets (not just Smith's)

### Step 5: Save Filter Preset
1. Set Status = "Pending" + "Assigned"
2. Set Priority = "High" + "Critical"
3. Type "My Urgent Tickets" in preset name field
4. Click "Save Preset"
5. **Expected**: "My Urgent Tickets" appears in dropdown
6. Clear filters (uncheck all)
7. **Expected**: All tickets show
8. Click "My Urgent Tickets" preset
9. **Expected**: Previous filter state restored (Pending + Assigned, High + Critical)

### Step 6: Filter Count Badge
1. Apply any filter
2. **Expected**: Filter button shows count (e.g., "[3] Filters")
3. Click filter button to close
4. **Expected**: Badge still visible
5. Clear all filters
6. **Expected**: Badge disappears

### Success Criteria
- ✓ Search works across all fields (text, name, email)
- ✓ Filters work individually and combined
- ✓ AND logic within category (Pending OR Assigned)
- ✓ Presets save and restore correctly
- ✓ Filter count badge accurate
- ✓ No console errors
- ✓ Search debounces (doesn't re-filter on every keystroke)

---

## Test 4: Export/Download Reports 📊

### What to Test
Verify export in multiple formats

### Prerequisites
- In Complaints table view
- Have 3+ complaints with data

### Step 1: Export as CSV
1. Click "Export" button (should show dropdown)
2. Click "📄 Export as CSV"
3. **Expected**: File downloads as `complaints-report-YYYY-MM-DD.csv`
4. Open file in Excel/Google Sheets
5. **Expected**: Comma-separated data with headers
6. Verify columns: Case ID, Client Name, Machine, Status, Priority, Engineer, SLA

### Step 2: Export as JSON
1. Click "Export" → "Export as JSON"
2. **Expected**: File downloads as `complaints-report-YYYY-MM-DD.json`
3. Open file in text editor
4. **Expected**: Valid JSON array with complaint objects
5. Verify structure: `[{id, complaintId, problem, status, priority, ...}, ...]`

### Step 3: Export as Excel (if xlsx installed)
1. Open terminal in frontend folder
2. Run `npm install xlsx`
3. Reload page
4. Click "Export" → "📊 Export as Excel"
5. **Expected**: File downloads as `.xlsx`
6. Open in Excel
7. **Expected**: Formatted spreadsheet with data in columns

### Step 4: Export as PDF (if jspdf installed)
1. Open terminal in frontend folder
2. Run `npm install jspdf`
3. Reload page
4. Click "Export" → "📑 Export as PDF"
5. **Expected**: File downloads as `.pdf`
6. Open in PDF viewer
7. **Expected**: Formatted PDF table with all complaint data

### Step 5: Export with Filters Applied
1. Apply filters (e.g., Status = "Pending")
2. Click "Export" → Choose format
3. **Expected**: Export file contains ONLY filtered complaints (not all)
4. Verify row count matches filtered view

### Success Criteria
- ✓ CSV downloads with correct data
- ✓ JSON valid and proper format
- ✓ Excel (if installed) opens in spreadsheet app
- ✓ PDF (if installed) opens in PDF viewer
- ✓ Filenames include date stamp
- ✓ Exports respect applied filters
- ✓ No console errors
- ✓ All columns included in export

---

## Test 5: Dashboard Analytics 📈

### What to Test
Verify analytics view displays correct metrics and charts

### Prerequisites
- Logged in as Admin/Manager
- Have 10+ complaints with varying statuses
- Navigate to "Analytics" from sidebar

### Step 1: KPI Cards
1. **Total Tickets card**: Should show total complaint count
2. **SLA Compliance card**: Should show % (e.g., "94%")
3. **Avg Resolution Time card**: Should show hours (e.g., "6.5h")
4. **Open Tickets card**: Should show count of unresolved tickets
5. **Expected**: All values > 0 and reasonable

### Step 2: Pie Chart (Status)
1. Look for pie chart labeled "Ticket Status"
2. **Expected**: Slices for: Pending, Assigned, In Progress, Resolved, Closed
3. Hover over each slice
4. **Expected**: Shows label and count
5. **Expected**: Total of all slices = "Total Tickets" KPI

### Step 3: Bar Chart (Priority)
1. Look for bar chart labeled "Priority Breakdown"
2. **Expected**: Bars for: Low, Medium, High, Critical
3. **Expected**: Heights represent count of each
4. Bars should have different colors
5. Y-axis should show counts (0, 5, 10, etc.)

### Step 4: Line Chart (7-Day Trend)
1. Look for line chart labeled "Tickets Resolved (7 Days)"
2. **Expected**: 7 points on x-axis (one per day)
3. **Expected**: Shows trend of resolutions over week
4. **Expected**: Smooth line connecting points
5. Hover over points
6. **Expected**: Shows date and count

### Step 5: Engineer Leaderboard
1. Look for section titled "Top Performing Engineers"
2. **Expected**: List of top 8 engineers
3. **Expected**: Sorted by tickets resolved (descending)
4. **Expected**: Shows engineer name and count
5. **Expected**: Matches visible engineers in system

### Step 6: Responsive Check
1. Resize browser window (drag edge to make smaller)
2. **Expected**: Charts stack vertically on narrow screens
3. **Expected**: KPI cards wrap to new rows
4. Restore to full width
5. **Expected**: Charts display side-by-side

### Success Criteria
- ✓ All KPI values display correctly
- ✓ Pie chart shows all status types
- ✓ Bar chart shows all priority levels
- ✓ Line chart shows 7-day trend
- ✓ Leaderboard lists top engineers
- ✓ Chart colors are distinct
- ✓ No console errors
- ✓ Responsive layout works

---

## Test 6: Notifications & Activity Feed 🔔

### Test 6A: Notification Center

#### Prerequisites
- Logged in to Dashboard
- Look at header (top-right)

#### Steps
1. **Check bell icon**: Should show 🔔 with small red dot (unread count)
2. Click bell icon
3. **Expected**: Dropdown appears showing notifications
4. **Expected**: Shows 3 sample notifications:
   - ✅ "Ticket Created" (green icon)
   - ℹ️ "Assignment" (blue icon)
   - ✅ "Resolution" (green icon)
5. Each notification shows:
   - Type icon + message
   - Timestamp (e.g., "5 minutes ago")
   - Dismiss (X) button
6. Hover over notification
7. **Expected**: Subtle highlight/hover effect
8. Click dismiss (X) on one
9. **Expected**: Notification marked as read (lighter color)
10. Click "Clear All" button
11. **Expected**: All notifications marked as read
12. Red dot on bell icon disappears
13. Click bell icon again
14. **Expected**: Dropdown still shows notifications (but all read)

#### Success Criteria
- ✓ Bell icon shows/hides dropdown
- ✓ Red unread indicator appears/disappears
- ✓ Timestamps display correctly
- ✓ Dismiss individual notifications
- ✓ Clear all works
- ✓ Read/unread state visual difference
- ✓ Dropdown closes on click outside
- ✓ No console errors

### Test 6B: Activity Feed

#### Prerequisites
- Logged in as Admin/Manager
- Have multiple complaints with different statuses
- Click "Activity Log" in sidebar

#### Steps
1. **Page title**: Should show "Activity Log" in header
2. **Timeline view**: Should show vertical timeline of events
3. **Event types**: Should see events like:
   - 📝 "Complaint Created" entries
   - 👤 "Assigned to [Engineer]" entries
   - ▶️ "Work Started" entries
   - ✓ "Resolved" entries
   - 🔒 "Closed" entries
4. Each event shows:
   - Type icon + label
   - Timestamp (relative, e.g., "2 days ago")
   - Complaint ID or engineer name
5. **Color coding**:
   - Created: Blue
   - Assigned: Orange/Yellow
   - Started: Purple
   - Resolved: Green
   - Closed: Gray
6. Scroll down
7. **Expected**: More events load (if applicable)
8. Hover over event
9. **Expected**: Subtle highlight

#### Step 2: Activity Details
1. Click/hover on an event
2. **Expected**: Shows full details (if available)
3. Should show:
   - Event type
   - Complaint ID
   - User/Engineer involved
   - Exact timestamp
   - Related data (machine, customer, etc.)

#### Success Criteria
- ✓ Timeline displays all events
- ✓ Event types color-coded correctly
- ✓ Timestamps show relative time
- ✓ Events sorted chronologically (newest first)
- ✓ Event details accessible
- ✓ Responsive on smaller screens
- ✓ No console errors

---

## Test 7: SLA Timers ⏱️

### What to Test
Verify SLA countdown and status tracking

### Prerequisites
- In Complaints table
- Should see "SLA" column (5th column)

### Step 1: SLA Status Badges
1. Look at "SLA" column in table
2. **Expected**: Each row shows badge like:
   - 🟢 "OK - 6h 45m" (green, > 4 hours)
   - 🟡 "WARNING - 2h 30m" (yellow, 1-4 hours)
   - 🔴 "CRITICAL - 45m" (red, < 1 hour)
   - ⚫ "OVERDUE" (dark red, past deadline)
   - ✅ "RESOLVED" (green, closed)
3. Status should match complaint status
4. Time should be reasonable (less than 24 hours for open tickets)

### Step 2: Color Changes Over Time
1. Take note of a "WARNING" status complaint
2. Wait 5 minutes
3. Refresh page
4. **Expected**: Same complaint still shows WARNING or now shows CRITICAL
5. Color should transition as deadline approaches

### Step 3: SLA Calculation
1. Find a complaint created within last 12 hours
2. Calculate: Created time + 24 hours = SLA deadline
3. Check current time
4. Time remaining = SLA deadline - current time
5. **Expected**: SLA column shows approximately this time
6. Allow ±5 minutes for calculation variance

### Step 4: Resolved Status
1. Find a complaint with Status = "Closed"
2. Look at SLA column
3. **Expected**: Shows ✅ "RESOLVED" badge (no countdown)

### Step 5: Hover Details
1. Hover over SLA badge
2. **Expected**: Tooltip shows:
   - SLA deadline (exact time)
   - Time remaining
   - Status explanation
   - (Optional: progress percentage)

### Success Criteria
- ✓ Correct status badge displayed
- ✓ Color matches status (green/yellow/red/dark)
- ✓ Time calculations accurate (±5 minutes)
- ✓ Status transitions as time passes
- ✓ Resolved tickets show completed status
- ✓ Hover tooltip provides details
- ✓ No console errors
- ✓ Responsive badge sizing

---

## Test 8: Integration Test 🔗

### What to Test
Verify all features work together smoothly

### Scenario: Full Workflow
1. **Start**: Log in as Admin
2. **Search**: Search for "John" in Complaints
3. **Filter**: Filter by Status "Pending" + Priority "High"
4. **Export**: Export filtered results as CSV
5. **Analytics**: Click to Analytics, verify filtered metrics
6. **Notification**: Check bell icon in header
7. **Activity**: Click Activity Log, verify events
8. **SLA**: Check SLA timers on exported complaints match Dashboard

### Expected Flow
- ✓ No errors during transitions
- ✓ Data consistency (same complaints appear everywhere)
- ✓ Navigation smooth
- ✓ Loaders appear appropriately
- ✓ All features respond immediately

### Success Criteria
- ✓ Complete workflow without errors
- ✓ Data consistent across views
- ✓ No performance issues
- ✓ All interactions responsive
- ✓ Console clear of errors/warnings

---

## Troubleshooting

### Issue: Loader appears indefinitely
**Fix**: Check Network tab → API calls hanging. Verify backend running.

### Issue: Export button not working
**Fix**: Open DevTools Console → Check for errors. May need to install xlsx/jspdf.

### Issue: Analytics showing no data
**Fix**: Verify complaints in database. Check if complaints array being passed to component.

### Issue: SLA times incorrect
**Fix**: Check server time vs client time. Verify complaint creation timestamps valid.

### Issue: Filters not working
**Fix**: Check console for JS errors. Verify complaint data structure matches expected fields.

### Issue: Activity Feed empty
**Fix**: Verify complaints have complete data (createdAt, assignedAt, etc.). Check timestamps valid.

---

## Performance Checklist

- [ ] Initial page load: < 3 seconds
- [ ] View switching: < 1 second
- [ ] Search debounce: 300ms
- [ ] Filter application: Instant (< 100ms)
- [ ] Export: Completes in < 2 seconds
- [ ] Analytics rendering: < 1 second
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] No console errors/warnings
- [ ] Smooth scrolling
- [ ] Responsive design works

---

## Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile (iOS Safari, Chrome Android) - basic check

---

## Accessibility Testing (Optional)

- [ ] Tab navigation works
- [ ] Keyboard shortcuts (Enter to submit, Escape to close)
- [ ] ARIA labels present on buttons
- [ ] Color contrast adequate
- [ ] Focus indicators visible
- [ ] Screen reader compatible (basic check)

---

## Sign-Off Checklist

**All Tests Passed**: _____ (Date & Signature)

**Notes/Issues Found**:
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Approved for Production**: [ ] Yes  [ ] No

**Approved By**: _______________ (Name/Role)

---

**Test Date**: ________________
**Tester**: ________________
**Environment**: Development / Staging / Production
