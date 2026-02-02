const express = require('express');
const router = express.Router();
const { requireLogin, loadCurrentUser, roleAtLeast } = require('../middleware/auth');
const { listCustomers, searchByServiceNo, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');

router.use(loadCurrentUser);
router.use(requireLogin);

router.get('/', roleAtLeast('manager'), listCustomers);
// Allow public search by service number (used by complaint forms) when enabled
// Allow public lookup by service number unless explicitly disabled by ALLOW_PUBLIC_COMPLAINTS='false'
if (process.env.ALLOW_PUBLIC_COMPLAINTS === 'false') {
  router.get('/search-by-service', requireLogin, searchByServiceNo);
} else {
  router.get('/search-by-service', searchByServiceNo);
}
router.post('/', requireLogin, createCustomer);
router.put('/:id', roleAtLeast('manager'), updateCustomer);
router.delete('/:id', roleAtLeast('admin'), deleteCustomer);

module.exports = router;