const { ServiceChecklist: SQLServiceChecklist, Complaint: SQLComplaint, User: SQLUser } = require('../models');
const { mongoose, ServiceChecklist: MServiceChecklist, Complaint, User } = require('../models_mongo');

const ChecklistModel = mongoose.models.ServiceChecklist || mongoose.model('ServiceChecklist', new mongoose.Schema({}, { strict: false, timestamps: true }));

// Create service checklist
exports.createChecklist = async (req, res) => {
  try {
    const { complaintId, checklistType, items } = req.body;
    const completedByEngineerId = req.currentUser.id;

    const doc = new ChecklistModel({
      complaintId,
      checklistType,
      items: (items||[]).map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        name: item.name,
        completed: false,
        notes: '',
        completedAt: null
      })),
      completedByEngineerId
    });
    await doc.save();
    const out = doc.toObject();
    out.complaint = await Complaint.findById(complaintId).select('title').lean().exec().catch(()=>null) || null;
    out.completedBy = await User.findById(completedByEngineerId).select('name email').lean().exec().catch(()=>null) || null;
    return res.status(201).json({ success: true, checklist: out });
  } catch (e) {
    try{
      const checklist = await SQLServiceChecklist.create({
        complaintId: req.body.complaintId,
        checklistType: req.body.checklistType,
        items: req.body.items,
        completedByEngineerId: req.currentUser.id
      });
      await checklist.reload({ include: [ { model: SQLComplaint }, { model: SQLUser, as: 'completedBy' } ] });
      return res.status(201).json({ success: true, checklist });
    }catch(error){
      return res.status(500).json({ error: error.message });
    }
  }
};

// Get complaint checklist
exports.getComplaintChecklist = async (req, res) => {
  try {
    const { complaintId } = req.params;
    let checklist = await ChecklistModel.findOne({ complaintId }).lean().exec().catch(()=>null);
    if(!checklist){
      checklist = await SQLServiceChecklist.findOne({ where: { complaintId }, include: [ { model: SQLComplaint }, { model: SQLUser, as: 'completedBy' } ] }).catch(()=>null);
      if(!checklist) return res.status(404).json({ error: 'Checklist not found' });
      return res.json({ success: true, checklist });
    }
    checklist.complaint = await Complaint.findById(checklist.complaintId).select('title status').lean().exec().catch(()=>null);
    checklist.completedBy = await User.findById(checklist.completedByEngineerId).select('name email').lean().exec().catch(()=>null);
    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update checklist item
exports.updateChecklistItem = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { itemId, completed, notes } = req.body;

    const checklist = await ChecklistModel.findById(checklistId).exec().catch(()=>null);
    if(!checklist){
      const sc = await SQLServiceChecklist.findByPk(checklistId).catch(()=>null);
      if(!sc) return res.status(404).json({ error: 'Checklist not found' });
      const items = sc.items.map(item => item.id === itemId ? { ...item, completed, notes, completedAt: completed ? new Date() : null } : item);
      await sc.update({ items });
      return res.json({ success: true, checklist: sc });
    }

    checklist.items = checklist.items.map(item => {
      if (item.id === itemId) {
        item.completed = completed;
        item.notes = notes;
        item.completedAt = completed ? new Date() : null;
      }
      return item;
    });
    await checklist.save();
    return res.json({ success: true, checklist: checklist.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete checklist
exports.completeChecklist = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { photoEvidenceUrls } = req.body;

    const checklist = await ChecklistModel.findById(checklistId).exec().catch(()=>null);
    if(!checklist){
      const sc = await SQLServiceChecklist.findByPk(checklistId).catch(()=>null);
      if(!sc) return res.status(404).json({ error: 'Checklist not found' });
      const allCompleted = sc.items.every(i => i.completed);
      if(!allCompleted) return res.status(400).json({ error: 'All checklist items must be completed' });
      await sc.update({ isCompleted: true, completedAt: new Date(), photoEvidenceUrls: photoEvidenceUrls || [] });
      await sc.reload({ include: [ { model: SQLComplaint }, { model: SQLUser, as: 'completedBy' } ] });
      return res.json({ success: true, checklist: sc });
    }

    const allCompleted = checklist.items.every(i => i.completed);
    if(!allCompleted) return res.status(400).json({ error: 'All checklist items must be completed' });
    checklist.isCompleted = true;
    checklist.completedAt = new Date();
    checklist.photoEvidenceUrls = photoEvidenceUrls || [];
    await checklist.save();
    const out = checklist.toObject();
    out.complaint = await Complaint.findById(out.complaintId).lean().exec().catch(()=>null);
    out.completedBy = await User.findById(out.completedByEngineerId).select('name email').lean().exec().catch(()=>null);
    return res.json({ success: true, checklist: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Review checklist (manager only)
exports.reviewChecklist = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { reviewNotes, approved } = req.body;
    const reviewedByManagerId = req.currentUser.id;

    const checklist = await ChecklistModel.findById(checklistId).exec().catch(()=>null);
    if(!checklist){
      const sc = await SQLServiceChecklist.findByPk(checklistId).catch(()=>null);
      if(!sc) return res.status(404).json({ error: 'Checklist not found' });
      await sc.update({ reviewedByManagerId, reviewedAt: new Date(), reviewNotes, status: approved ? 'approved' : 'needs_revision' });
      await sc.reload({ include: [ { model: SQLComplaint }, { model: SQLUser, as: 'completedBy' } ] });
      return res.json({ success: true, checklist: sc });
    }

    checklist.reviewedByManagerId = reviewedByManagerId;
    checklist.reviewedAt = new Date();
    checklist.reviewNotes = reviewNotes;
    checklist.status = approved ? 'approved' : 'needs_revision';
    await checklist.save();
    const out = checklist.toObject();
    out.complaint = await Complaint.findById(out.complaintId).lean().exec().catch(()=>null);
    out.completedBy = await User.findById(out.completedByEngineerId).select('name email').lean().exec().catch(()=>null);
    return res.json({ success: true, checklist: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending checklists for review
exports.getPendingChecklists = async (req, res) => {
  try {
    const checklists = await ChecklistModel.find({ isCompleted: true, reviewedAt: null }).sort({ completedAt: -1 }).lean().exec().catch(()=>null);
    if(!checklists){
      const scs = await SQLServiceChecklist.findAll({ where: { isCompleted: true, reviewedAt: null }, include: [ { model: SQLComplaint }, { model: SQLUser, as: 'completedBy' } ], order: [['completedAt','DESC']] }).catch(()=>[]);
      return res.json({ success: true, checklists: scs });
    }
    // populate complaint and completedBy
    const cIds = checklists.map(c => c.complaintId).filter(Boolean);
    const complaints = await Complaint.find({ _id: { $in: cIds } }).select('title customerName').lean().exec().catch(()=>[]);
    const users = await User.find({ _id: { $in: checklists.map(c => c.completedByEngineerId).filter(Boolean) } }).select('name').lean().exec().catch(()=>[]);
    const cMap = {}; complaints.forEach(c => { cMap[(c._id||c.id).toString()] = c; });
    const uMap = {}; users.forEach(u => { uMap[(u._id||u.id).toString()] = u; });
    const out = checklists.map(ch => ({ ...ch, complaint: cMap[(ch.complaintId||'').toString()]||null, completedBy: uMap[(ch.completedByEngineerId||'').toString()]||null }));
    res.json({ success: true, checklists: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get common checklist items (templates)
exports.getCommonChecklistItems = async (req, res) => {
  try {
    const { checklistType } = req.query;

    // Common templates
    const templates = {
      'Electrical Inspection': [
        'Check voltage levels',
        'Test circuit breakers',
        'Inspect wiring for damage',
        'Check grounding',
        'Test all outlets',
        'Document any issues'
      ],
      'Refrigeration Service': [
        'Check refrigerant level',
        'Inspect compressor',
        'Clean coils',
        'Check thermostat calibration',
        'Test temperature',
        'Check for leaks',
        'Document pressure readings'
      ],
      'HVAC Maintenance': [
        'Clean filters',
        'Check refrigerant charge',
        'Inspect ductwork',
        'Test thermostat',
        'Check compressor operation',
        'Clean outdoor unit',
        'Document system performance'
      ],
      'Plumbing Service': [
        'Check for leaks',
        'Test water pressure',
        'Inspect pipes',
        'Check drain function',
        'Test hot water',
        'Inspect fixtures'
      ]
    };

    const items = templates[checklistType] || [];
    const formattedItems = items.map((name, idx) => ({
      id: `item_${idx}`,
      name,
      completed: false,
      notes: ''
    }));

    res.json({ success: true, items: formattedItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
