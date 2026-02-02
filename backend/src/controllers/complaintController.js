// List all available (unassigned, pending) complaints for engineers
async function listAvailableComplaints(req, res) {
  try {
    let complaints = await Complaint.find({ status: 'pending', $or: [ { assignedTo: null }, { assignedTo: '' } ] }).exec();
    complaints = await Promise.all(complaints.map(async c => {
      const obj = c.toObject();
      obj.engineer = null;
      return obj;
    }));
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available complaints' });
  }
}
const Complaint = require('../models_mongo/Complaint');
const MMachine = require('../models_mongo/Machine');
const User = require('../models_mongo/User');
const Customer = require('../models_mongo/Customer');
const mongoose = require('mongoose');

async function resolveComplaintById(id){
  if (!id || id === 'undefined') return { doc: null };
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        const doc = await Complaint.findById(id).exec();
        if (doc) return { doc, source: 'mongo' };
      } catch (e) {}
    }
    try {
      const doc = await Complaint.findOne({ complaintId: id }).exec();
      if (doc) return { doc, source: 'mongo', by: 'complaintId' };
    } catch (e) {}
  } catch (e) {}
  return { doc: null };
}

async function listComplaints(req, res) {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.assignedTo) q.assignedTo = req.query.assignedTo;

  // Allow fetching open/pending complaints publicly using ?open=1 or ?open=true
  if (req.query.open === '1' || String(req.query.open).toLowerCase() === 'true') {
    q.status = 'pending';
  }

  // If current user is an engineer and no explicit "open" query and no assignedTo query, restrict to assigned tickets
  if (!req.query.assignedTo && req.currentUser && req.currentUser.role === 'engineer' && !(req.query.open === '1' || String(req.query.open).toLowerCase() === 'true')) {
    q.assignedTo = req.currentUser._id || req.currentUser.id;
  }

  try {
    let complaints = await Complaint.find(q).exec();
    complaints = await Promise.all(complaints.map(async c => {
      const obj = c.toObject();
      if (obj.assignedTo) {
        try {
          obj.engineer = await User.findById(obj.assignedTo).select('id _id name email role').lean().exec();
        } catch (e) { obj.engineer = null; }
      } else {
        obj.engineer = null;
      }
      return obj;
    }));
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
}

async function listMyComplaints(req, res) {
  // Only engineers can access this route
  if (!req.currentUser || req.currentUser.role !== 'engineer') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Find all complaints assigned to this engineer (now public, so no user context)
    let complaints = await Complaint.find({ assignedTo: { $ne: null, $ne: '' } }).exec();
    complaints = await Promise.all(complaints.map(async c => {
      const obj = c.toObject();
      if (obj.assignedTo) {
        try {
          obj.engineer = await User.findById(obj.assignedTo).select('id _id name email role').lean().exec();
        } catch (e) { obj.engineer = null; }
      } else {
        obj.engineer = null;
      }
      return obj;
    }));
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
}

async function createComplaint(req, res) {
  const { 
    problem, 
    priority, 
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
  const missingFields = [];
  const normalizedCustomerId = (customerId && String(customerId).trim()) ? customerId : undefined;
  const normalizedMachineId = (machineId && String(machineId).trim()) ? machineId : undefined;
  if (!problem) missingFields.push('problem');
  const hasCustomerData = customerData && customerData.companyName;
  if (!normalizedCustomerId && !isNewCustomer && !hasCustomerData) missingFields.push('customerId');
  const hasMachineData = machineData && machineData.model && machineData.serialNumber;
  if (!normalizedMachineId && !isNewMachine && !hasMachineData) missingFields.push('machineId');
  if (isNewCustomer && (!customerData || !customerData.companyName)) missingFields.push('customerData.companyName');
  if (isNewMachine && (!machineData || !machineData.model || !machineData.serialNumber)) {
    missingFields.push('machineData.model', 'machineData.serialNumber');
  }
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required field(s): ${missingFields.join(', ')}` });
  }

  try {
    let finalCustomerId = normalizedCustomerId;
    let finalMachineId = normalizedMachineId;
    if ((isNewCustomer && customerData) || (!finalCustomerId && hasCustomerData)) {
      const newCustomer = new Customer({
        name: customerData.companyName,
        companyName: customerData.companyName,
        contactPerson: customerData.contactPerson || null,
        email: customerData.email || null,
        phone: customerData.phone || null,
        city: customerData.city || null,
        address: customerData.address || null,
        serviceNo: customerData.serviceNo || serviceNo || null
      });
      await newCustomer.save();
      finalCustomerId = newCustomer._id;
    }

    if ((isNewMachine && machineData) || (!finalMachineId && hasMachineData)) {
      try {
        const newMachine = new MMachine({
          model: machineData.model,
          serialNumber: machineData.serialNumber,
          customerId: finalCustomerId
        });
        await newMachine.save();
        finalMachineId = newMachine._id;
      } catch (machineError) {
        if (machineError && machineError.code === 11000) {
          try {
            const existing = await MMachine.findOne({ serialNumber: machineData.serialNumber }).lean().exec();
            if (existing) {
              const existingCustomerId = existing.customerId ? String(existing.customerId) : null;
              const newCustomerId = finalCustomerId ? String(finalCustomerId) : null;
              if (existingCustomerId && newCustomerId && existingCustomerId !== newCustomerId) {
                let existingCustomer = null;
                try { existingCustomer = await Customer.findById(existingCustomerId).lean().exec().catch(()=>null); } catch(e){}
                return res.status(409).json({ error: 'Machine serial belongs to another customer', existingMachine: existing, existingCustomer });
              }
              finalMachineId = existing._id;
            }
          } catch (e) {
            return res.status(500).json({ error: 'Failed to handle machine duplicate', details: e.message });
          }
        } else {
          return res.status(500).json({ error: 'Failed to create machine', details: machineError.message });
        }
      }
    }
    if (!finalMachineId) {
      finalMachineId = null;
    }

    const complaintId = 'TKT-' + Date.now();
    const complaint = new Complaint({
      complaintId,
      problem,
      priority: priority || 'medium',
      issueCategories: issueCategories || [],
      customerId: finalCustomerId,
      machineId: finalMachineId,
      status: 'pending',
      createdBy: req.currentUser ? (req.currentUser._id || req.currentUser.id) : null
    });
    await complaint.save();
    let populatedCustomer = null;
    let populatedMachine = null;
    try{
      if(finalCustomerId) populatedCustomer = await Customer.findById(finalCustomerId).lean().exec().catch(()=>null);
      if(finalMachineId) populatedMachine = await MMachine.findById(finalMachineId).lean().exec().catch(()=>null);
    }catch(e){}
    let complaintObj = complaint && typeof complaint.toObject === 'function' ? complaint.toObject() : (complaint || {});
    complaintObj.id = complaintObj._id ? String(complaintObj._id) : null;
    complaintObj.customerId = complaintObj.customerId ? String(complaintObj.customerId) : null;
    complaintObj.machineId = complaintObj.machineId ? String(complaintObj.machineId) : null;
    complaintObj.displayId = complaintObj.complaintId || (complaintObj.id ? `TKT-${String(complaintObj.id).slice(0,8)}` : null);
    res.status(201).json({ complaint: complaintObj, customer: populatedCustomer || null, machine: populatedMachine || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create complaint' });
  }
}

async function updateComplaint(req, res){
  const { id } = req.params;
  const { doc, source } = await resolveComplaintById(id);
  if(!doc) return res.status(404).json({ error: 'Not found' });

  const { problem, priority, status, assignedTo, description } = req.body;
  if(problem) doc.problem = problem;
  if(priority) doc.priority = priority;
  if(description) doc.description = description;
  if(status) doc.status = status;
  if(assignedTo !== undefined) doc.assignedTo = String(assignedTo);
  if(source === 'mongo') await doc.save(); else await doc.save();
  // Populate engineer object for response
  let obj = doc.toObject ? doc.toObject() : doc;
  if (obj.assignedTo) {
    try {
      obj.engineer = await User.findById(obj.assignedTo).select('id _id name email role').lean().exec();
    } catch (e) { obj.engineer = null; }
  } else {
    obj.engineer = null;
  }
  res.json(obj);
}

async function assignComplaint(req, res){
  const { id } = req.params;
  let engineerId = req.body.engineerId || req.body.assignedTo || req.currentUser._id || req.currentUser.id;
  // Defensive: reject string literal 'undefined' or 'null'
  if (engineerId === 'undefined' || engineerId === 'null') engineerId = undefined;

  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  if(!engineerId) return res.status(400).json({ error: 'engineerId required' });

  const role = req.currentUser.role;
  const isEngineer = role === 'engineer';
  const canAssignOthers = ['manager','admin','superadmin'].includes(role);

  // Engineers can only assign tickets to themselves
  const currentUserId = String(req.currentUser._id || req.currentUser.id);
  if(isEngineer && String(engineerId) !== currentUserId){
    return res.status(403).json({ error: 'Forbidden' });
  }
  if(!isEngineer && !canAssignOthers){
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Only pending tickets can be taken by engineers, managers can reassign
  if(complaint.status !== 'pending' && !canAssignOthers){
    return res.status(400).json({ error: 'Ticket is not pending' });
  }


  // For Mongo: always store assignedTo as string ObjectId
  if (source === 'mongo') {
    console.log('[ASSIGN] Assigning complaint', id, 'to engineerId:', engineerId, 'as string:', String(engineerId));
    complaint.assignedTo = String(engineerId);
    complaint.status = 'assigned';
    complaint.assignedBy = req.currentUser ? (req.currentUser._id || req.currentUser.id) : null;
    complaint.assignedAt = new Date();
    await complaint.save();
    console.log('[ASSIGN] Complaint assigned. Complaint.assignedTo:', complaint.assignedTo);
  } else {
    complaint.assignedTo = engineerId;
    complaint.status = 'assigned';
    complaint.assignedBy = req.currentUser ? (req.currentUser._id || req.currentUser.id) : null;
    complaint.assignedAt = new Date();
    await complaint.save();
  }

  // Update engineer status if SQL model present - proceed defensively
  try{
    const status = await EngineerStatus.findOne({ where: { engineerId } });
    if(status){
      status.status = 'busy';
      await status.save();
    }
  }catch(e){ /* ignore if SQL models not present */ }

  // Populate engineer object for response
  let obj = complaint.toObject ? complaint.toObject() : complaint;
  if (obj.assignedTo) {
    try {
      obj.engineer = await User.findById(obj.assignedTo).select('id _id name email role').lean().exec();
    } catch (e) { obj.engineer = null; }
  } else {
    obj.engineer = null;
  }
  res.json(obj);
}

async function unassignComplaint(req, res) {
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if (!complaint) return res.status(404).json({ error: 'Not found' });

  const isAssignedEngineer = String(complaint.assignedTo) === String(req.currentUser._id || req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if (!isAssignedEngineer && !canManage) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  complaint.assignedTo = null;
  complaint.status = 'pending';
  await complaint.save();
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
  const isAssignedEngineer = String(complaint.assignedTo) === String(req.currentUser._id || req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if(!isAssignedEngineer && !canManage){
    return res.status(403).json({ error: 'Forbidden' });
  }
  complaint.status = status;
  if(status === 'in_progress'){
    complaint.checkInTime = new Date();
    if(description) complaint.description = description;
  }
  await complaint.save();
  res.json(complaint);
}

async function completeComplaint(req, res){
  const { id } = req.params;
  const { workPerformed, solutionNotes, sparesUsed } = req.body;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  const isAssignedEngineer = String(complaint.assignedTo) === String(req.currentUser._id || req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if(!isAssignedEngineer && !canManage){
    return res.status(403).json({ error: 'Forbidden' });
  }
  complaint.status = 'completed';
  complaint.completedAt = new Date();
  if(solutionNotes) complaint.solutionNotes = solutionNotes;
  if(workPerformed) complaint.description = workPerformed;
  complaint.sparesUsed = parseSpares(sparesUsed);
  await complaint.save();
  // Optionally, add a MongoDB-native service history if needed
  res.json(complaint);
}

async function closeComplaint(req, res){
  const { id } = req.params;
  const { solutionNotes } = req.body;
  if(!solutionNotes) return res.status(400).json({ error: 'Notes required for closing' });

  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  const isAssignedEngineer = String(complaint.assignedTo) === String(req.currentUser._id || req.currentUser.id);
  const canManage = ['manager','admin','superadmin'].includes(req.currentUser.role);
  if(!isAssignedEngineer && !canManage){
    return res.status(403).json({ error: 'Forbidden' });
  }
  complaint.status = 'closed';
  complaint.closedAt = new Date();
  complaint.solutionNotes = solutionNotes;
  await complaint.save();
  // Optionally, add a MongoDB-native service history if needed
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
    console.error('Error generating summary:', e);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
}

async function startWork(req, res){
  const { id } = req.params;
  const { doc: complaint, source } = await resolveComplaintById(id);
  if(!complaint) return res.status(404).json({ error: 'Not found' });

  complaint.workStatus = 'started';
  complaint.startedAt = new Date();
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
    complaint.assignedBy = req.currentUser ? (req.currentUser._id || req.currentUser.id) : null;
    complaint.assignedAt = new Date();
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

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { listComplaints, listMyComplaints, listAvailableComplaints, createComplaint, updateComplaint, deleteComplaint, assignComplaint, unassignComplaint, updateStatus, completeComplaint, closeComplaint, summary, startWork, autoAssign, getSuggestedEngineers };

function parseSpares(sparesUsed) {
  if (!sparesUsed) return null;
  if (Array.isArray(sparesUsed)) return sparesUsed;
  if (typeof sparesUsed === 'string') {
    return sparesUsed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return null;
}