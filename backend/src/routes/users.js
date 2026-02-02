const express = require('express');
const router = express.Router();
const { requireLogin, loadCurrentUser, roleAtLeast } = require('../middleware/auth');
const { listUsers, createUser, updateUser, deleteUser, checkIn, checkOut, blockUser, unblockUser, updateProfile } = require('../controllers/userController');

router.use(loadCurrentUser);
router.use(requireLogin);

router.get('/', roleAtLeast('manager'), listUsers);
router.post('/', roleAtLeast('manager'), createUser);
router.put('/:id', roleAtLeast('manager'), updateUser);
router.delete('/:id', roleAtLeast('admin'), deleteUser);
router.post('/check-in', requireLogin, checkIn);
router.post('/check-out', requireLogin, checkOut);
router.post('/:id/block', roleAtLeast('admin'), blockUser);
router.post('/:id/unblock', roleAtLeast('admin'), unblockUser);
router.put('/profile/update-name', requireLogin, updateProfile);

module.exports = router;
