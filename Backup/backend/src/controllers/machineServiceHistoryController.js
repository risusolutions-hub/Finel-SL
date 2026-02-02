const { MachineServiceHistory: SQLMachineServiceHistory, Machine: SQLMachine, Complaint: SQLComplaint, User: SQLUser } = require('../models');
const { mongoose, User, Machine, Complaint } = require('../models_mongo');
const HistoryModel = mongoose.models.MachineServiceHistory || mongoose.model('MachineServiceHistory', new mongoose.Schema({}, { strict: false, timestamps: true }));
let Op;
try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }

// Add machine service history
exports.addServiceHistory = async (req, res) => {
  try {
    const {
      machineId,
      complaintId,
      serviceType,
      issueDescription,
      resolutionDescription,
      partsReplaced,
      downtime,
      cost,
      nextScheduledMaintenance
    } = req.body;
    const engineerId = req.currentUser.id;

    const doc = new HistoryModel({
      machineId,
      complaintId,
      serviceType,
      issueDescription,
      resolutionDescription,
      partsReplaced,
      downtime,
      cost,
      engineerId,
      completedAt: new Date(),
      nextScheduledMaintenance
    });
    await doc.save();
    const out = doc.toObject();
    out.machine = await Machine.findById(machineId).select('name type').lean().exec().catch(()=>null) || null;
    out.engineer = await User.findById(engineerId).select('name email').lean().exec().catch(()=>null) || null;
    res.status(201).json({ success: true, history: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get machine service history
exports.getMachineServiceHistory = async (req, res) => {
  try {
    const { machineId } = req.params;

    let history = [];
    try{
      history = await HistoryModel.find({ machineId }).sort({ serviceDate: -1 }).lean().exec();
      // populate engineer and complaint
      const uIds = history.map(h => h.engineerId).filter(Boolean);
      const users = await User.find({ _id: { $in: uIds } }).select('name email').lean().exec().catch(()=>[]);
      const userMap = {};
      users.forEach(u => { userMap[(u._id||u.id).toString()] = u; });
      const cIds = history.map(h => h.complaintId).filter(Boolean);
      const complaints = await Complaint.find({ _id: { $in: cIds } }).select('complaintId problem status').lean().exec().catch(()=>[]);
      const compMap = {};
      complaints.forEach(c => { compMap[(c._id||c.id).toString()] = c; });
      history = history.map(h => ({ ...h, engineer: userMap[(h.engineerId||'').toString()]||null, complaint: compMap[(h.complaintId||'').toString()]||null }));
    }catch(e){
      history = await SQLMachineServiceHistory.findAll({ where: { machineId }, include: [ { model: SQLUser, as: 'engineer', attributes: ['id','name','email'] }, { model: SQLComplaint, attributes: ['id','title','status'] } ], order: [['serviceDate','DESC']] });
    }

    // Calculate pattern detection - frequent failures on same component
    const patterns = {};
    history.forEach(service => {
      if (service.partsReplaced && Array.isArray(service.partsReplaced)) {
        service.partsReplaced.forEach(part => {
          patterns[part.partName] = (patterns[part.partName] || 0) + 1;
        });
      }
    });

    const frequentFailures = Object.entries(patterns)
      .filter(([_, count]) => count > 2)
      .map(([partName, count]) => ({ partName, failureCount: count }))
      .sort((a, b) => b.failureCount - a.failureCount);

    res.json({ success: true, history, frequentFailures });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get service history details
exports.getServiceHistoryDetail = async (req, res) => {
  try {
    const { historyId } = req.params;

    let history = await HistoryModel.findById(historyId).lean().exec().catch(()=>null);
    if(!history){
      history = await SQLMachineServiceHistory.findByPk(historyId, { include: [ { model: SQLMachine, attributes: ['id','name','type','serialNumber'] }, { model: SQLUser, as: 'engineer', attributes: ['id','name','email'] }, { model: SQLComplaint, attributes: ['id','title','description','priority'] } ] }).catch(()=>null);
      if(!history) return res.status(404).json({ error: 'Service history not found' });
      return res.json({ success: true, history });
    }
    history.machine = await Machine.findById(history.machineId).select('name type serialNumber').lean().exec().catch(()=>null);
    history.engineer = await User.findById(history.engineerId).select('name email').lean().exec().catch(()=>null);
    history.complaint = await Complaint.findById(history.complaintId).select('complaintId problem priority').lean().exec().catch(()=>null);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update service history
exports.updateServiceHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const {
      serviceType,
      issueDescription,
      resolutionDescription,
      partsReplaced,
      downtime,
      cost,
      nextScheduledMaintenance
    } = req.body;

    let history = await HistoryModel.findById(historyId).exec().catch(()=>null);
    if(!history){
      history = await SQLMachineServiceHistory.findByPk(historyId).catch(()=>null);
      if(!history) return res.status(404).json({ error: 'Service history not found' });
      await history.update({ serviceType, issueDescription, resolutionDescription, partsReplaced, downtime, cost, nextScheduledMaintenance });
      await history.reload({ include: [{ model: SQLMachine }, { model: SQLUser, as: 'engineer' }] });
      return res.json({ success: true, history });
    }
    if(serviceType) history.serviceType = serviceType;
    if(issueDescription) history.issueDescription = issueDescription;
    if(resolutionDescription) history.resolutionDescription = resolutionDescription;
    if(partsReplaced !== undefined) history.partsReplaced = partsReplaced;
    if(downtime !== undefined) history.downtime = downtime;
    if(cost !== undefined) history.cost = cost;
    if(nextScheduledMaintenance !== undefined) history.nextScheduledMaintenance = nextScheduledMaintenance;
    await history.save();
    const out = history.toObject ? history.toObject() : history;
    out.machine = await Machine.findById(out.machineId).select('name type').lean().exec().catch(()=>null);
    out.engineer = await User.findById(out.engineerId).select('name email').lean().exec().catch(()=>null);
    res.json({ success: true, history: out });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get machines requiring maintenance (based on service history)
exports.getMachinesRequiringMaintenance = async (req, res) => {
  try {
    try{
      const machines = await Machine.find().lean().exec();
      const requiring = [];
      for(const m of machines){
        const latest = await HistoryModel.findOne({ machineId: m._id }).sort({ serviceDate: -1 }).lean().exec().catch(()=>null);
        if(!latest || !latest.nextScheduledMaintenance) continue;
        if(new Date(latest.nextScheduledMaintenance) <= new Date()) requiring.push({ machine: m, latest });
      }
      return res.json({ success: true, machinesRequiringMaintenance: requiring });
    }catch(e){
      const machines = await SQLMachine.findAll({ include: [{ model: SQLMachineServiceHistory, as: 'serviceHistory', required: true, attributes: ['nextScheduledMaintenance','serviceDate'] }] });
      const requiring = machines.filter(machine => { const latest = machine.serviceHistory[machine.serviceHistory.length-1]; if(!latest || !latest.nextScheduledMaintenance) return false; return new Date(latest.nextScheduledMaintenance) <= new Date(); });
      return res.json({ success: true, machinesRequiringMaintenance: requiring });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get service trends
exports.getServiceTrends = async (req, res) => {
  try {
    const { machineId, days = 90 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let history = [];
    try{
      const q = { serviceDate: { $gte: startDate } };
      if(machineId) q.machineId = machineId;
      history = await HistoryModel.find(q).sort({ serviceDate: 1 }).lean().exec();
    }catch(e){
      const query = { serviceDate: { [Op.gte]: startDate } };
      if (machineId) query.machineId = machineId;
      history = await SQLMachineServiceHistory.findAll({ where: query, order: [['serviceDate', 'ASC']] });
    }

    // Group by month
    const trends = {};
    history.forEach(service => {
      const month = new Date(service.serviceDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
      trends[month] = (trends[month] || 0) + 1;
    });

    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
