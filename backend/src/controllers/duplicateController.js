const { DuplicateComplaint: SQLDuplicateComplaint, Complaint: SQLComplaint, Customer: SQLCustomer } = require('../models');
const { mongoose } = require('../models_mongo');
const DuplicateModel = mongoose.models.DuplicateComplaint || mongoose.model('DuplicateComplaint', new mongoose.Schema({}, { strict: false, timestamps: true }));
const ComplaintModel = mongoose.models.Complaint || mongoose.model('Complaint', new mongoose.Schema({}, { strict: false, timestamps: true }));
const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', new mongoose.Schema({}, { strict: false, timestamps: true }));
let Op;
try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }

// Calculate text similarity (simple implementation)
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Simple word overlap calculation
  const words1 = s1.split(/\s+/).filter(w => w.length > 3);
  const words2 = s2.split(/\s+/).filter(w => w.length > 3);

  const overlap = words1.filter(w => words2.includes(w)).length;
  const total = Math.max(words1.length, words2.length);

  return overlap / total;
};

// Detect potential duplicates when creating complaint
exports.detectDuplicates = async (req, res) => {
  try {
    const { customerId, description, title } = req.body;
    const thresholdDays = 30;
    const thresholdSimilarity = 0.4;

    // Get recent complaints for this customer
    const recentDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
    let recentComplaints = [];
    try{
      recentComplaints = await ComplaintModel.find({ customerId, createdAt: { $gte: recentDate } }).limit(10).lean().exec();
    }catch(e){
      recentComplaints = await SQLComplaint.findAll({ where: { customerId, createdAt: { [Op.gte]: recentDate } }, attributes: ['id','title','description','status','createdAt'], limit: 10 });
      recentComplaints = recentComplaints.map(r=> r.dataValues || r);
    }

    // Find similar complaints
    const potentialDuplicates = recentComplaints
      .map(complaint => ({ complaint, similarity: Math.max(calculateSimilarity(description, complaint.description || ''), calculateSimilarity(title, complaint.title || '')) }))
      .filter(item => item.similarity >= thresholdSimilarity)
      .sort((a,b) => b.similarity - a.similarity)
      .slice(0,5)
      .map(item => ({ ...(item.complaint.dataValues||item.complaint), similarityScore: (item.similarity*100).toFixed(0) }));

    res.json({
      success: true,
      potentialDuplicates,
      hasDuplicates: potentialDuplicates.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Link complaints as duplicates
exports.linkDuplicates = async (req, res) => {
  try {
    const { primaryComplaintId, duplicateComplaintId, linkReason, consolidationNotes } = req.body;
    const detectedBy = req.currentUser.id;

    // Calculate similarity score
    try{
      const primary = await ComplaintModel.findById(primaryComplaintId).exec().catch(()=>null);
      const duplicate = await ComplaintModel.findById(duplicateComplaintId).exec().catch(()=>null);
      if(!primary || !duplicate){
        const p = await SQLComplaint.findByPk(primaryComplaintId).catch(()=>null);
        const d = await SQLComplaint.findByPk(duplicateComplaintId).catch(()=>null);
        if(!p || !d) return res.status(404).json({ error: 'Complaint not found' });
        const similarity = calculateSimilarity(p.description||'', d.description||'');
        const link = await SQLDuplicateComplaint.create({ primaryComplaintId, duplicateComplaintId, similarityScore: similarity, linkReason, detectedBy, consolidationNotes });
        await d.update({ status: 'duplicate', relatedComplaintId: primaryComplaintId });
        return res.status(201).json({ success: true, link });
      }
      const similarity = calculateSimilarity(primary.description||'', duplicate.description||'');
      const link = await DuplicateModel.create({ primaryComplaintId, duplicateComplaintId, similarityScore: similarity, linkReason, detectedBy, consolidationNotes });
      duplicate.status = 'duplicate'; duplicate.relatedComplaintId = primaryComplaintId; await duplicate.save();
      return res.status(201).json({ success: true, link });
    }catch(error){
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get duplicates for a complaint
exports.getComplaintDuplicates = async (req, res) => {
  try {
    const { complaintId } = req.params;

    try{
      let duplicates = await DuplicateModel.find({ $or: [ { primaryComplaintId: complaintId }, { duplicateComplaintId: complaintId } ] }).lean().exec();
      if(!duplicates || duplicates.length === 0){
        duplicates = await SQLDuplicateComplaint.findAll({ where: { [Op.or]: [ { primaryComplaintId: complaintId }, { duplicateComplaintId: complaintId } ] }, include: [ { model: SQLComplaint, as: 'primaryComplaint' }, { model: SQLComplaint, as: 'duplicateComplaint' } ] });
        return res.json({ success: true, duplicates });
      }
      return res.json({ success: true, duplicates });
    }catch(error){
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Merge complaints
exports.mergeComplaints = async (req, res) => {
  try {
    const { primaryComplaintId, duplicateComplaintId, mergeNotes } = req.body;

    try{
      const primary = await ComplaintModel.findById(primaryComplaintId).exec().catch(()=>null);
      const duplicate = await ComplaintModel.findById(duplicateComplaintId).exec().catch(()=>null);
      if(!primary || !duplicate){
        const p = await SQLComplaint.findByPk(primaryComplaintId).catch(()=>null);
        const d = await SQLComplaint.findByPk(duplicateComplaintId).catch(()=>null);
        if(!p || !d) return res.status(404).json({ error: 'Complaint not found' });
        const combinedNotes = `${p.notes||''}\n\n[MERGED FROM DUPLICATE ID: ${duplicateComplaintId}]\n${d.notes||''}\n${mergeNotes||''}`;
        await p.update({ notes: combinedNotes, updatedAt: new Date() });
        await d.update({ status: 'merged', relatedComplaintId: primaryComplaintId });
        await SQLDuplicateComplaint.create({ primaryComplaintId, duplicateComplaintId, linkReason: 'Manually merged by user', detectedBy: req.currentUser.id, consolidationNotes: mergeNotes });
        return res.json({ success: true, message: 'Complaints merged successfully', primary: p });
      }
      const combinedNotes = `${primary.notes||''}\n\n[MERGED FROM DUPLICATE ID: ${duplicateComplaintId}]\n${duplicate.notes||''}\n${mergeNotes||''}`;
      primary.notes = combinedNotes; primary.updatedAt = new Date(); await primary.save();
      duplicate.status = 'merged'; duplicate.relatedComplaintId = primaryComplaintId; await duplicate.save();
      await DuplicateModel.create({ primaryComplaintId, duplicateComplaintId, linkReason: 'Manually merged by user', detectedBy: req.currentUser.id, consolidationNotes: mergeNotes });
      return res.json({ success: true, message: 'Complaints merged successfully', primary });
    }catch(error){
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get duplicate statistics
exports.getDuplicateStats = async (req, res) => {
  try {
    try{
      const totalDuplicates = await DuplicateModel.countDocuments().catch(()=>0);
      const duplicatesByReasonAgg = await DuplicateModel.aggregate([{ $group: { _id: '$linkReason', count: { $sum: 1 } } }]).catch(()=>[]);
      const duplicatesByReason = duplicatesByReasonAgg.map(r=> ({ linkReason: r._id, count: r.count }));
      const duplicateComplaints = await ComplaintModel.countDocuments({ status: { $in: ['duplicate','merged'] } }).catch(async ()=> (await SQLComplaint.count({ where: { status: { [Op.in]: ['duplicate','merged'] } } })) );
      return res.json({ success: true, stats: { totalDuplicateLinks: totalDuplicates, totalAffectedComplaints: duplicateComplaints, duplicatesByReason } });
    }catch(error){
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unlink duplicates
exports.unlinkDuplicates = async (req, res) => {
  try {
    const { linkId } = req.params;

    try{
      const link = await DuplicateModel.findById(linkId).exec().catch(()=>null);
      if(!link){
        const l = await SQLDuplicateComplaint.findByPk(linkId).catch(()=>null);
        if(!l) return res.status(404).json({ error: 'Link not found' });
        const duplicate = await SQLComplaint.findByPk(l.duplicateComplaintId).catch(()=>null);
        if(duplicate) await duplicate.update({ status: 'pending', relatedComplaintId: null });
        await l.destroy();
        return res.json({ success: true, message: 'Link removed' });
      }
      const duplicate = await ComplaintModel.findById(link.duplicateComplaintId).exec().catch(()=>null);
      if(duplicate){ duplicate.status = 'pending'; duplicate.relatedComplaintId = null; await duplicate.save(); }
      await link.remove();
      return res.json({ success: true, message: 'Link removed' });
    }catch(error){
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
