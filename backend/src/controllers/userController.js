const User = require('../models_mongo/User');
const { DailyWorkTime } = require('../models');
const { canManageTarget } = require('../middleware/auth');

async function listUsers(req, res){
  const users = await User.find().select('-passwordHash').exec();
  res.json({ users });
}

async function createUser(req, res){
  const actor = req.currentUser;
  const { name, email, password, role } = req.body;
  if(!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if(!canManageTarget(actor.role, role || 'engineer')) return res.status(403).json({ error: 'Cannot create user of this role' });

  // Validate name uniqueness
  const existingUser = await User.findOne({ name }).exec();
  if(existingUser) return res.status(400).json({ error: 'Name already exists' });

  try{
    const user = new User({ name, email, passwordHash: password, role: role || 'engineer' });
    await user.save();
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  }catch(err){
    res.status(400).json({ error: err.message });
  }
}

async function updateUser(req, res){
  const actor = req.currentUser;
  const { id } = req.params;
  const target = await User.findById(id).exec();
  if(!target) return res.status(404).json({ error: 'Not found' });
  if(!canManageTarget(actor.role, target.role)) return res.status(403).json({ error: 'Forbidden' });

  const { name, email, password, role } = req.body;
  if(role && !canManageTarget(actor.role, role)) return res.status(403).json({ error: 'Cannot set that role' });

  // Validate name uniqueness if name is being changed
  if(name && name !== target.name){
    const existingUser = await User.findOne({ name }).exec();
    if(existingUser) return res.status(400).json({ error: 'Name already exists' });
  }

  if(name) target.name = name;
  if(email) target.email = email;
  if(password) target.passwordHash = password;
  if(role) target.role = role;
  await target.save();
  res.json({ id: target._id, name: target.name, email: target.email, role: target.role });
}

async function deleteUser(req, res){
  const actor = req.currentUser;
  const { id } = req.params;
  const target = await User.findById(id).exec();
  if(!target) return res.status(404).json({ error: 'Not found' });
  if(!canManageTarget(actor.role, target.role)) return res.status(403).json({ error: 'Forbidden' });
  await target.remove();
  res.json({ ok: true });
}

async function checkIn(req, res){
  const uid = req.currentUser && (req.currentUser._id || req.currentUser.id);
  const user = await User.findById(uid).exec();
  if(user.isCheckedIn) return res.status(400).json({ error: 'Already checked in' });

  // Check if current time is between 9am and 7pm
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute; // Convert to minutes since midnight
  const nineAM = 9 * 60; // 540 minutes
  const sevenPM = 19 * 60; // 1140 minutes

  if(currentTime < nineAM || currentTime >= sevenPM){
    const validTime = currentTime < nineAM ? '9:00 AM' : 'before 7:00 PM';
    return res.status(400).json({ error: `Check-in is only allowed between 9:00 AM and 7:00 PM. Please check in ${validTime}` });
  }

  user.lastCheckIn = new Date();
  user.isCheckedIn = true;

  // If this is the first check-in of the day, set dailyFirstCheckIn
  const today = new Date(user.dailyFirstCheckIn || '').toDateString();
  const nowString = now.toDateString();
  
  if (!user.dailyFirstCheckIn || today !== nowString) {
    // New day, reset daily fields
    user.dailyFirstCheckIn = user.lastCheckIn;
    user.dailyLastCheckOut = null;
    user.dailyTotalWorkTime = 0;
  }

  await user.save();
  res.json(user);
}

async function checkOut(req, res){
  const uid = req.currentUser && (req.currentUser._id || req.currentUser.id);
  const user = await User.findById(uid).exec();
  if(!user.isCheckedIn) return res.status(400).json({ error: 'Not checked in' });

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;
  const sevenPM = 19 * 60; // 1140 minutes (7:00 PM)

  // If after 7pm, cap checkout time to 7pm
  const isAutoCheckout = currentTime >= sevenPM;
  
  let checkoutTime;
  if (isAutoCheckout) {
    // Set checkout time to 7:00 PM today
    checkoutTime = new Date(now);
    checkoutTime.setHours(19, 0, 0, 0);
  } else {
    checkoutTime = new Date();
  }

  user.lastCheckOut = checkoutTime;
  user.isCheckedIn = false;

  // Calculate duration from check-in to checkout (capped at 7pm if after)
  const checkInTime = new Date(user.lastCheckIn);
  const duration = Math.floor((checkoutTime - checkInTime) / 60000);

  // Update daily tracking
  user.dailyLastCheckOut = checkoutTime;
  user.dailyTotalWorkTime = (user.dailyTotalWorkTime || 0) + duration;

  // Also update activeTime for backward compatibility
  const lastCheckOutDate = user.lastCheckOut ? new Date(user.lastCheckOut) : now;
  if(now.toDateString() !== lastCheckOutDate.toDateString()){
    user.activeTime = 0;
  }
  user.activeTime = (user.activeTime || 0) + duration;

  await user.save();
  // Note: DailyWorkTime (SQL) writes are skipped for Mongo-backed users during incremental migration.
  
  const response = { ...user.toObject() };
  if(isAutoCheckout) {
    response.autoCheckout = true;
    response.message = 'Checkout time capped at 7:00 PM';
  }
  res.json(response);
}

async function blockUser(req, res) {
  const actor = req.currentUser;
  const { id } = req.params;
  const target = await User.findById(id).exec();

  if (!target) return res.status(404).json({ error: 'User not found' });
  if (!canManageTarget(actor.role, target.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }

  target.status = 'blocked';
  await target.save();
  res.json(target);
}

async function unblockUser(req, res) {
  const actor = req.currentUser;
  const { id } = req.params;
  const target = await User.findById(id).exec();

  if (!target) return res.status(404).json({ error: 'User not found' });
  if (!canManageTarget(actor.role, target.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }
  
  target.status = 'active';
  await target.save();
  res.json(target);
}

async function updateProfile(req, res){
  const uid = req.currentUser && (req.currentUser._id || req.currentUser.id);
  const user = await User.findById(uid).exec();
  if(!user) return res.status(404).json({ error: 'User not found' });

  const { name } = req.body;
  if(!name) return res.status(400).json({ error: 'Name is required' });
  if(name.trim() === '') return res.status(400).json({ error: 'Name cannot be empty' });

  // Validate name uniqueness if name is being changed
  if(name !== user.name){
    const existingUser = await User.findOne({ name }).exec();
    if(existingUser) return res.status(400).json({ error: 'Name already exists' });
  }

  user.name = name;
  await user.save();
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
}

module.exports = { listUsers, createUser, updateUser, deleteUser, checkIn, checkOut, blockUser, unblockUser, updateProfile };
