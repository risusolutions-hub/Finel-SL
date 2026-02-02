const { Complaint: SQLComplaint, Customer, Machine, User: SQLUser, ServiceHistory, EngineerStatus, sequelize } = require('../models');
let Op, fn, col;
try{ ({ Op, fn, col } = require('sequelize')); }catch(e){
  Op = {};
  fn = (...a)=>null;
  col = (c)=>c;
}
const { Complaint } = require('../models_mongo');
const { User } = require('../models_mongo');

async function resolveComplaintById(id){
  // Try Mongo first
  try{
    const doc = await Complaint.findById(id).exec();
    if(doc) return { doc, source: 'mongo' };
  }catch(e){}

  // Fallback to SQL numeric id
  if(!isNaN(Number(id))){
    const sql = await SQLComplaint.findByPk(id);
    if(sql) return { doc: sql, source: 'sql' };
  }
  return { doc: null };
}

function parseSpares(sparesUsed){
  if(!sparesUsed) return null;
  if(Array.isArray(sparesUsed)) return sparesUsed;
  if(typeof sparesUsed === 'string'){
    return sparesUsed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return null;
}

async function listComplaints(req, res){
  const where = {};
  if(req.query.status) where.status = req.query.status;
  if(req.query.assignedTo) where.assignedTo = req.query.assignedTo;

  if(req.currentUser.role === 'engineer'){
    if(req.query.open){
      where.status = 'pending';
    }else{
      where.assignedTo = req.currentUser.id;
    }
  }

  // Query Mongo complaints with simple filters
  const q = {};
  if(where.status) q.status = where.status;
  if(where.assignedTo) q.assignedTo = where.assignedTo;
  if(req.currentUser.role === 'engineer'){
    if(req.query.open) q.status = 'pending';
    else q.assignedTo = req.currentUser._id || req.currentUser.id;
  }

  const complaints = await Complaint.find(q).exec();

  // Populate customer and machine from SQL for compatibility
  const populated = await Promise.all(complaints.map(async c => {
    const obj = c.toObject();
    if(obj.customerId){ obj.Customer = await Customer.findByPk(obj.customerId).catch(()=>null); }
    if(obj.machineId){ obj.Machine = await Machine.findByPk(obj.machineId).catch(()=>null); }
    if(obj.assignedTo){
      // assignedTo might be SQL id or mongo id; try Mongo user first
      let eng = null;
      try{ eng = await User.findById(obj.assignedTo).select('-passwordHash').exec(); }catch(e){}
      if(!eng && obj.assignedTo){ eng = await SQLUser.findByPk(obj.assignedTo).catch(()=>null); }
      obj.engineer = eng || null;
    }
    return obj;
  }));

  res.json({ complaints: populated });
}

async function createComplaint(req, res){
  const { 
    problem, 
    priority, 
    attachments, 
    customerId, 
    machineId, 
    issueCategories,
    customIssue,
    isNewCustomer,
    isNewMachine,
    customerData,
    machineData,
    serviceNo
  } = req.body;

  try {
    let finalCustomerId = customerId;
    let finalMachineId = machineId;

    // Create new customer if needed
    if (isNewCustomer && customerData) {
      const newCustomer = await Customer.create({
        name: customerData.companyName,
        companyName: customerData.companyName,
        company: customerData.companyName,
        contactPerson: customerData.contactPerson || null,
        email: customerData.email || null,
        phone: customerData.phones?.[0] || customerData.phone || null,
        phones: customerData.phones?.filter(p => p.trim()) || [],
        city: customerData.city || null,
        address: customerData.address || null,
        serviceNo: customerData.serviceNo || serviceNo || null
      });
      finalCustomerId = newCustomer.id;
    }

    // Create new machine if needed
    if (isNewMachine && machineData) {
      if (!machineData.model || !machineData.serialNumber) {
        return res.status(400).json({ error: 'Machine model and serial number are required' });
      }
      
      const newMachine = await Machine.create({
        model: machineData.model,
        serialNumber: machineData.serialNumber,
        mobileNumbers: machineData.mobileNumbers?.filter(m => m.trim()) || [],
        customerId: finalCustomerId
      });
      finalMachineId = newMachine.id;
    }

    if (!problem || !finalCustomerId || !finalMachineId) {
      return res.status(400).json({ error: 'Missing required fields: problem, customer, and machine are required' });
    }

    // Combine issue categories
    let allIssues = issueCategories || [];
    if (customIssue && customIssue.trim()) {
      allIssues = [...allIssues, `custom:${customIssue.trim()}`];
    }

    const complaintId = 'TKT-' + Date.now(); // auto-generated

    const doc = new Complaint({
      complaintId,
      problem,
      priority: priority || 'medium',
      attachments: attachments || [],
      issueCategories: allIssues.length > 0 ? allIssues : [],
      customerId: finalCustomerId,
      machineId: finalMachineId,
      status: 'pending'
    });
    await doc.save();

    const created = doc.toObject();
    created.Customer = await Customer.findByPk(finalCustomerId).catch(()=>null);
    created.Machine = await Machine.findByPk(finalMachineId).catch(()=>null);
    res.status(201).json(created);
  } catch(err) {
    console.error('Error creating complaint:', err);
    res.status(400).json({ error: err.message });
  }
}

async function updateComplaint(req, res){
  const { id } = req.params;
  const { doc, source } = await resolveComplaintById(id);
  if(!doc) return res.status(404).json({ error: 'Not found' });

  const { problem, priority, attachments, status, assignedTo, description } = req.body;
  if(problem) doc.problem = problem;
  if(priority) doc.priority = priority;
  if(attachments) doc.attachments = attachments;
  if(description) doc.description = description;
  if(status) doc.status = status;
  if(assignedTo !== undefined) doc.assignedTo = assignedTo;
  if(source === 'mongo') await doc.save(); else await doc.save();
  res.json(doc);
}

async function assignComplaint(req, res){
  const { id } = req.params;
  const engineerId = req.body.engineerId || req.body.assignedTo || req.currentUser._id || req.currentUser.id;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  if(!engineerId) return res.status(400).json({ error: 'engineerId required' });

  const role = req.currentUser.role;
  const isEngineer = role === 'engineer';
  const canAssignOthers = ['manager','admin','superadmin'].includes(role);

  // Engineers can only assign tickets to themselves
  if(isEngineer && engineerId !== req.currentUser.id){
    return res.status(403).json({ error: 'Forbidden' });
  }
  if(!isEngineer && !canAssignOthers){
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Only pending tickets can be taken by engineers, managers can reassign
  if(complaint.status !== 'pending' && !canAssignOthers){
    return res.status(400).json({ error: 'Ticket is not pending' });
  }

  complaint.assignedTo = engineerId;
  complaint.status = 'assigned';
  if(source === 'mongo') await complaint.save(); else await complaint.save();

  const status = await EngineerStatus.findOne({ where: { engineerId } });
  if(status){
    status.status = 'busy';
    await status.save();
  }

  res.json(complaint);
}

async function unassignComplaint(req, res) {
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if (!complaint) return res.status(404).json({ error: 'Not found' });

  const isAssignedEngineer = parseInt(complaint.assignedTo) === parseInt(req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  
  if (!isAssignedEngineer && !canManage) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const engineerId = complaint.assignedTo;
  complaint.assignedTo = null;
  complaint.status = 'pending';
  if(source === 'mongo') await complaint.save(); else await complaint.save();

  const status = await EngineerStatus.findOne({ where: { engineerId } });
  if (status) {
    status.status = 'free';
    await status.save();
  }

  res.json(complaint);
}

async function updateStatus(req, res){
  const { id } = req.params;
  const { status, description } = req.body;
  const allowed = ['pending','assigned','in_progress','completed','closed'];
  if(!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  // Only assigned engineer or higher roles can transition
  const isAssignedEngineer = parseInt(complaint.assignedTo) === parseInt(req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if(!isAssignedEngineer && !canManage){
    return res.status(403).json({ error: 'Forbidden' });
  }

  complaint.status = status;
  if(status === 'in_progress'){
    complaint.checkInTime = new Date();
    if(description) complaint.description = description;
    // engineer is now busy
    const engStatus = await EngineerStatus.findOne({ where: { engineerId: complaint.assignedTo } });
    if(engStatus){
      engStatus.status = 'busy';
      engStatus.checkInTime = new Date();
      await engStatus.save();
    }
  }
  if(source === 'mongo') await complaint.save(); else await complaint.save();
  res.json(complaint);
}

async function completeComplaint(req, res){
  const { id } = req.params;
  const { workPerformed, solutionNotes, sparesUsed } = req.body;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  const isAssignedEngineer = parseInt(complaint.assignedTo) === parseInt(req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if(!isAssignedEngineer && !canManage){
    return res.status(403).json({ error: 'Forbidden' });
  }

  complaint.status = 'completed';
  if(solutionNotes) complaint.solutionNotes = solutionNotes;
  if(workPerformed) complaint.description = workPerformed;
  complaint.sparesUsed = parseSpares(sparesUsed);
  if(source === 'mongo') await complaint.save(); else await complaint.save();

  await ServiceHistory.create({
    complaintId: id,
    workPerformed,
    solutionNotes: solutionNotes || workPerformed,
    sparesUsed: parseSpares(sparesUsed),
    engineerId: complaint.assignedTo
  });

  const engStatus = await EngineerStatus.findOne({ where: { engineerId: complaint.assignedTo } });
  if(engStatus){
    engStatus.status = 'free';
    engStatus.checkOutTime = new Date();
    await engStatus.save();
  }

  res.json(complaint);
}

async function closeComplaint(req, res){
  const { id } = req.params;
  const { solutionNotes } = req.body;
  if(!solutionNotes) return res.status(400).json({ error: 'Notes required for closing' });

  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  const isAssignedEngineer = parseInt(complaint.assignedTo) === parseInt(req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if(!isAssignedEngineer && !canManage){
    return res.status(403).json({ error: 'Forbidden' });
  }

  complaint.status = 'closed';
  complaint.solutionNotes = solutionNotes;
  if(source === 'mongo') await complaint.save(); else await complaint.save();

  await ServiceHistory.create({
    complaintId: id,
    solutionNotes,
    engineerId: complaint.assignedTo
  });

  const engStatus = await EngineerStatus.findOne({ where: { engineerId: complaint.assignedTo } });
  if(engStatus){
    engStatus.status = 'free';
    engStatus.checkOutTime = new Date();
    await engStatus.save();
  }

  res.json(complaint);
}

async function deleteComplaint(req, res){
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });
  if(source === 'mongo') await complaint.remove(); else await complaint.destroy();
  res.json({ ok: true });
}

async function summary(req, res){
  try{
    // Use Mongo aggregation for summaries
    const statusCounts = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec();

    const cityCounts = await Complaint.aggregate([
      { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'cust' } },
      { $unwind: { path: '$cust', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$cust.city', count: { $sum: 1 } } }
    ]).exec();

    const engineerCounts = await Complaint.aggregate([
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'engineer' } },
      { $unwind: { path: '$engineer', preserveNullAndEmptyArrays: true } },
      { $project: { assignedTo: '$_id', count: 1, engineer: { id: '$engineer._id', name: '$engineer.name', role: '$engineer.role' } } }
    ]).exec();

    res.json({ statusCounts, cityCounts, engineerCounts });
  }catch(e){
    // Fallback to SQL if aggregation fails
    const statusCounts = await SQLComplaint.findAll({ attributes: ['status', [fn('COUNT', col('status')), 'count']], group: ['status'] });
    const cityCounts = await SQLComplaint.findAll({ attributes: [[col('Customer.city'), 'city'], [fn('COUNT', col('Complaint.id')), 'count']], include: [{ model: Customer, attributes: [] }], group: ['Customer.city'] });
    const engineerCounts = await SQLComplaint.findAll({ attributes: ['assignedTo', [fn('COUNT', col('assignedTo')), 'count']], group: ['assignedTo'], include: [{ model: SQLUser, as: 'engineer', attributes: ['id','name','role'] }] });
    res.json({ statusCounts, cityCounts, engineerCounts });
  }
}

async function startWork(req, res){
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  complaint.workStatus = 'started';
  if(source === 'mongo') await complaint.save(); else await complaint.save();
  res.json(complaint);
}

// Auto-assign complaint to best qualified engineer
async function autoAssign(req, res) {
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if (!complaint) return res.status(404).json({ error: 'Not found' });

  try {
    const { EngineerSkill, EngineerStatus: EngStatus } = require('../models');

    // Prefer Mongoose engineers, fallback to SQL
    let engineers = [];
    try{
      engineers = await User.find({ role: 'engineer', status: 'active' }).lean().exec();
      // Normalize Mongoose shape to expected fields
      engineers = engineers.map(e => ({ id: e._id || e.id, name: e.name, email: e.email, skills: e.skills || [], EngineerStatus: e.engineerStatus || {} }));
    }catch(e){
      engineers = await require('../models').User.findAll({
        where: { role: 'engineer', status: 'active' },
        include: [ { model: EngineerSkill, as: 'skills' }, { model: EngStatus } ]
      });
    }

    // Get machine type to match skills
    let machineType = '';
    if(complaint.Machine && complaint.Machine.model) machineType = complaint.Machine.model;
    else if(complaint.machineId){
      try{ const mdoc = await MMachine.findById(complaint.machineId).lean().exec(); if(mdoc) machineType = mdoc.model || ''; }catch(e){}
    }
    const issueCategories = complaint.issueCategories || [];

    // Score each engineer
    const scoredEngineers = engineers.map(eng => {
      let score = 0;
      const status = eng.EngineerStatus;
      
      // Prefer free engineers (+10)
      if (status?.status === 'free') score += 10;
      else if (status?.status === 'busy') score -= 5;
      
      // Check skills match
      const skills = eng.skills || [];
      skills.forEach(skill => {
        // Machine type match
        if (machineType.toLowerCase().includes(skill.skillName.toLowerCase())) {
          score += 5;
          if (skill.proficiencyLevel === 'expert') score += 3;
          else if (skill.proficiencyLevel === 'advanced') score += 2;
        }
        
        // Issue category match
        if (issueCategories.some(cat => 
          skill.skillName.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(skill.skillName.toLowerCase())
        )) {
          score += 4;
        }
      });

      // Experience bonus
      const totalYears = skills.reduce((sum, s) => sum + (s.yearsOfExperience || 0), 0);
      score += Math.min(totalYears / 2, 5); // Max 5 bonus points

      return { engineer: eng, score };
    });

    // Sort by score descending
    scoredEngineers.sort((a, b) => b.score - a.score);

    if (scoredEngineers.length === 0) {
      return res.status(404).json({ error: 'No available engineers found' });
    }

    // Get best match
    const bestMatch = scoredEngineers[0];
    
    // Assign the complaint
    complaint.assignedTo = bestMatch.engineer.id;
    complaint.status = 'assigned';
    await complaint.save();

    // Update engineer status
    const engStatus = await EngStatus.findOne({ where: { engineerId: bestMatch.engineer.id } }).catch(()=>null);
    if (engStatus) {
      engStatus.status = 'busy';
      await engStatus.save();
    }

    res.json({
      success: true,
      complaint,
      assignedTo: {
        id: bestMatch.engineer.id,
        name: bestMatch.engineer.name,
        score: bestMatch.score
      },
      alternatives: scoredEngineers.slice(1, 4).map(e => ({
        id: e.engineer.id,
        name: e.engineer.name,
        score: e.score
      }))
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    res.status(500).json({ error: 'Failed to auto-assign' });
  }
}

// Get suggested engineer for a complaint
async function getSuggestedEngineers(req, res) {
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if (!complaint) return res.status(404).json({ error: 'Not found' });

  try {
    const { EngineerSkill, EngineerStatus: EngStatus } = require('../models');
    
    // Prefer Mongoose engineers, fallback to SQL
    let engineers = [];
    try{
      engineers = await User.find({ role: 'engineer', status: 'active' }).lean().exec();
      engineers = engineers.map(e => ({ id: e._id || e.id, name: e.name, email: e.email, skills: e.skills || [], EngineerStatus: e.engineerStatus || {} }));
    }catch(e){
      engineers = await require('../models').User.findAll({
        where: { role: 'engineer', status: 'active' },
        include: [ { model: EngineerSkill, as: 'skills' }, { model: EngStatus } ]
      });
    }

    const issueCategories = complaint.issueCategories || [];

    const suggestions = engineers.map(eng => {
      const skills = eng.skills || [];
      const matchingSkills = skills.filter(skill => 
        machineType.toLowerCase().includes(skill.skillName.toLowerCase()) ||
        issueCategories.some(cat => skill.skillName.toLowerCase().includes(cat.toLowerCase()))
      );

      const status = eng.EngineerStatus;
      
      return {
        id: eng.id,
        name: eng.name,
        email: eng.email,
        status: status?.status || 'unknown',
        matchingSkills: matchingSkills.map(s => ({
          name: s.skillName,
          level: s.proficiencyLevel,
          years: s.yearsOfExperience
        })),
        totalSkills: skills.length,
        isAvailable: status?.status === 'free'
      };
    });

    // Sort by matching skills count and availability
    suggestions.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return b.matchingSkills.length - a.matchingSkills.length;
    });

    res.json({ success: true, suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}

module.exports = { listComplaints, createComplaint, updateComplaint, deleteComplaint, assignComplaint, unassignComplaint, updateStatus, completeComplaint, closeComplaint, summary, startWork, autoAssign, getSuggestedEngineers };