const { Leave: SQLLeave } = require('../models');
const { mongoose, User } = require('../models_mongo');
const LeaveModel = mongoose.models.Leave || mongoose.model('Leave', new mongoose.Schema({}, { strict: false, timestamps: true }));
let Op;
try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }

async function createLeaveRequest(req, res) {
  const engineerId = req.currentUser.id;
  const { leaveType, reason, startDate, endDate } = req.body;

  if (!leaveType || !reason || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Calculate number of days (excluding weekends)
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    try{
      const doc = new LeaveModel({ engineerId, leaveType, reason, startDate: start, endDate: end, numDays: count, status: 'pending' });
      await doc.save();
      return res.status(201).json(doc.toObject());
    }catch(e){
      const leave = await SQLLeave.create({ engineerId, leaveType, reason, startDate: start, endDate: end, numDays: count, status: 'pending' });
      return res.status(201).json(leave);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listLeaves(req, res) {
  try {
    const where = {};
    
    if (req.currentUser.role === 'engineer') {
      where.engineerId = req.currentUser.id;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    try{
      const q = { ...(where || {}) };
      const docs = await LeaveModel.find(q).sort({ createdAt: -1 }).lean().exec();
      // populate users
      const userIds = docs.map(d => d.engineerId).filter(Boolean);
      const users = await User.find({ _id: { $in: userIds } }).select('name email').lean().exec().catch(()=>[]);
      const uMap = {}; users.forEach(u=>{ uMap[(u._id||u.id).toString()] = u; });
      const out = docs.map(d=> ({ ...d, engineer: uMap[(d.engineerId||'').toString()]||null }));
      return res.json({ leaves: out });
    }catch(e){
      const leaves = await SQLLeave.findAll({ where, include: [ { model: require('../models').User, as: 'engineer' }, { model: require('../models').User, as: 'approver' } ], order: [['createdAt','DESC']] });
      return res.json({ leaves });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function approveLeave(req, res) {
  const { id } = req.params;
  const { approvalNotes } = req.body;
  const actor = req.currentUser;

  // Only manager and admin can approve
  if (!['manager', 'admin', 'superadmin'].includes(actor.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    try{
      const leave = await LeaveModel.findById(id).exec().catch(()=>null);
      if(!leave){
        const l = await SQLLeave.findByPk(id).catch(()=>null);
        if(!l) return res.status(404).json({ error: 'Leave request not found' });
        if(l.status !== 'pending') return res.status(400).json({ error: 'Leave request already processed' });
        l.status = 'approved'; l.approvedBy = actor.id; l.approvalNotes = approvalNotes||''; l.approvalDate = new Date(); await l.save();
        const updated = await SQLLeave.findByPk(id, { include: [ { model: require('../models').User, as: 'engineer' }, { model: require('../models').User, as: 'approver' } ] });
        return res.json(updated);
      }
      if(leave.status !== 'pending') return res.status(400).json({ error: 'Leave request already processed' });
      leave.status = 'approved'; leave.approvedBy = actor.id; leave.approvalNotes = approvalNotes||''; leave.approvalDate = new Date(); await leave.save();
      return res.json(leave.toObject());
    }catch(err){
      return res.status(400).json({ error: err.message });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function rejectLeave(req, res) {
  const { id } = req.params;
  const { approvalNotes } = req.body;
  const actor = req.currentUser;

  // Only manager and admin can reject
  if (!['manager', 'admin', 'superadmin'].includes(actor.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    try{
      const leave = await LeaveModel.findById(id).exec().catch(()=>null);
      if(!leave){
        const l = await SQLLeave.findByPk(id).catch(()=>null);
        if(!l) return res.status(404).json({ error: 'Leave request not found' });
        if(l.status !== 'pending') return res.status(400).json({ error: 'Leave request already processed' });
        l.status = 'rejected'; l.approvedBy = actor.id; l.approvalNotes = approvalNotes||'Leave request rejected'; l.approvalDate = new Date(); await l.save();
        const updated = await SQLLeave.findByPk(id, { include: [ { model: require('../models').User, as: 'engineer' }, { model: require('../models').User, as: 'approver' } ] });
        return res.json(updated);
      }
      if(leave.status !== 'pending') return res.status(400).json({ error: 'Leave request already processed' });
      leave.status = 'rejected'; leave.approvedBy = actor.id; leave.approvalNotes = approvalNotes||'Leave request rejected'; leave.approvalDate = new Date(); await leave.save();
      return res.json(leave.toObject());
    }catch(err){
      return res.status(400).json({ error: err.message });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteLeaveRequest(req, res) {
  const { id } = req.params;
  const actor = req.currentUser;

  try {
    try{
      const leave = await LeaveModel.findById(id).exec().catch(()=>null);
      if(!leave){
        const l = await SQLLeave.findByPk(id).catch(()=>null);
        if(!l) return res.status(404).json({ error: 'Leave request not found' });
        if(l.engineerId !== actor.id && !['admin','superadmin'].includes(actor.role)) return res.status(403).json({ error: 'Forbidden' });
        if(l.status !== 'pending') return res.status(400).json({ error: 'Can only delete pending leave requests' });
        await l.destroy();
        return res.json({ ok: true });
      }
      if(leave.engineerId.toString() !== (actor.id||'').toString() && !['admin','superadmin'].includes(actor.role)) return res.status(403).json({ error: 'Forbidden' });
      if(leave.status !== 'pending') return res.status(400).json({ error: 'Can only delete pending leave requests' });
      await leave.remove();
      return res.json({ ok: true });
    }catch(err){
      return res.status(400).json({ error: err.message });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createLeaveRequest,
  listLeaves,
  approveLeave,
  rejectLeave,
  deleteLeaveRequest
};
