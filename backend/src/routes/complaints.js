
const express = require('express');
const router = express.Router();
const { requireLogin, loadCurrentUser, roleAtLeast } = require('../middleware/auth');
const { listComplaints, listMyComplaints, listAvailableComplaints, createComplaint, updateComplaint, deleteComplaint, assignComplaint, unassignComplaint, updateStatus, completeComplaint, closeComplaint, summary, startWork, autoAssign, getSuggestedEngineers } = require('../controllers/complaintController');

// New: /available (engineer - available tickets) - now public
router.get('/available', listAvailableComplaints);

router.use(loadCurrentUser);
// Allow unauthenticated complaint creation for public/embedded forms.
// Other routes still require login per-route.

// Allow unauthenticated requests to fetch open (pending) complaints when callers include ?open=1
// Old: /assigned (kept for backward compatibility) - now public
router.get('/assigned', listMyComplaints);
// New: /my (preferred for engineer's own complaints) - now public
router.get('/my', listMyComplaints);
router.get('/', (req, res, next) => {
  if (req.query && (req.query.open === '1' || req.query.open === 'true')) {
    // proceed to listComplaints without requiring login
    return next();
  }
  // otherwise enforce authentication
  return requireLogin(req, res, next);
}, listComplaints);
router.get('/summary', roleAtLeast('admin'), summary);
// Allow public creation unless explicitly disabled by setting ALLOW_PUBLIC_COMPLAINTS to 'false'
if (process.env.ALLOW_PUBLIC_COMPLAINTS === 'false') {
  console.log('ALLOW_PUBLIC_COMPLAINTS is false: requiring auth for POST /api/complaints');
  router.post('/', requireLogin, createComplaint);
} else {
  console.log('ALLOW_PUBLIC_COMPLAINTS is not false: allowing public POST /api/complaints');
  router.post('/', createComplaint);
}
router.put('/:id', roleAtLeast('manager'), updateComplaint);
router.delete('/:id', roleAtLeast('admin'), deleteComplaint);
router.post('/:id/assign', requireLogin, assignComplaint);
router.post('/:id/unassign', requireLogin, unassignComplaint);
router.post('/:id/auto-assign', roleAtLeast('manager'), autoAssign);
router.get('/:id/suggested-engineers', roleAtLeast('manager'), getSuggestedEngineers);
router.post('/:id/complete', roleAtLeast('engineer'), completeComplaint);
router.post('/:id/close', roleAtLeast('engineer'), closeComplaint);
router.put('/:id/status', requireLogin, updateStatus);
router.post('/:id/start-work', roleAtLeast('engineer'), startWork);

module.exports = router;