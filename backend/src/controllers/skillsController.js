const { EngineerSkill: SQLEngineerSkill, Certification: SQLCertification } = require('../models');
const { mongoose, User } = require('../models_mongo');

const EngineerSkillModel = mongoose.models.EngineerSkill || mongoose.model('EngineerSkill', new mongoose.Schema({}, { strict: false, timestamps: true }));
const CertificationModel = mongoose.models.Certification || mongoose.model('Certification', new mongoose.Schema({}, { strict: false, timestamps: true }));

// Add skill to engineer
exports.addSkill = async (req, res) => {
  try {
    const { engineerId, skillName, proficiencyLevel, yearsOfExperience } = req.body;
    const verifiedBy = req.currentUser.role === 'manager' ? req.currentUser.id : null;

    try{
      const doc = new EngineerSkillModel({ engineerId, skillName, proficiencyLevel, yearsOfExperience, verifiedBy, verifiedAt: verifiedBy ? new Date() : null });
      await doc.save();
      return res.status(201).json({ success: true, skill: doc.toObject() });
    }catch(e){
      const skill = await SQLEngineerSkill.create({ engineerId, skillName, proficiencyLevel, yearsOfExperience, verifiedBy, verifiedAt: verifiedBy ? new Date() : null });
      return res.status(201).json({ success: true, skill });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get engineer skills
exports.getEngineerSkills = async (req, res) => {
  try {
    const { engineerId } = req.params;
    try{
      const skills = await EngineerSkillModel.find({ engineerId }).lean().exec();
      return res.json({ success: true, skills });
    }catch(e){
      const skills = await SQLEngineerSkill.findAll({ where: { engineerId }, include: [{ model: require('../models').User, as: 'User' }] });
      return res.json({ success: true, skills });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update skill
exports.updateSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { proficiencyLevel, yearsOfExperience } = req.body;
    try{
      const skill = await EngineerSkillModel.findById(skillId).exec().catch(()=>null);
      if(!skill){
        const s = await SQLEngineerSkill.findByPk(skillId).catch(()=>null);
        if(!s) return res.status(404).json({ error: 'Skill not found' });
        await s.update({ proficiencyLevel, yearsOfExperience });
        return res.json({ success: true, skill: s });
      }
      skill.proficiencyLevel = proficiencyLevel; skill.yearsOfExperience = yearsOfExperience; await skill.save();
      return res.json({ success: true, skill: skill.toObject() });
    }catch(e){
      return res.status(500).json({ error: e.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete skill
exports.deleteSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    try{
      const skill = await EngineerSkillModel.findById(skillId).exec().catch(()=>null);
      if(!skill){
        const s = await SQLEngineerSkill.findByPk(skillId).catch(()=>null);
        if(!s) return res.status(404).json({ error: 'Skill not found' });
        await s.destroy();
        return res.json({ success: true });
      }
      await skill.remove();
      return res.json({ success: true });
    }catch(e){
      return res.status(500).json({ error: e.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add certification
exports.addCertification = async (req, res) => {
  try {
    const { engineerId, certificationName, issuingBody, certificationNumber, issuedAt, expiresAt, documentUrl } = req.body;
    try{
      const doc = new CertificationModel({ engineerId, certificationName, issuingBody, certificationNumber, issuedAt, expiresAt, documentUrl, status: expiresAt ? (new Date(expiresAt) < new Date() ? 'expired' : 'active') : 'active' });
      await doc.save();
      return res.status(201).json({ success: true, certification: doc.toObject() });
    }catch(e){
      const certification = await SQLCertification.create({ engineerId, certificationName, issuingBody, certificationNumber, issuedAt, expiresAt, documentUrl, status: expiresAt ? (new Date(expiresAt) < new Date() ? 'expired' : 'active') : 'active' });
      return res.status(201).json({ success: true, certification });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get engineer certifications
exports.getEngineerCertifications = async (req, res) => {
  try {
    const { engineerId } = req.params;
    try{
      const certs = await CertificationModel.find({ engineerId }).sort({ expiresAt: 1 }).lean().exec();
      const updated = certs.map(cert => { const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date(); const expiringIn30Days = cert.expiresAt && ((new Date(cert.expiresAt) - new Date()) < 30*24*60*60*1000); return { ...cert, isExpired, expiringIn30Days }; });
      return res.json({ success: true, certifications: updated });
    }catch(e){
      const certifications = await SQLCertification.findAll({ where: { engineerId }, order: [['expiresAt','ASC']] });
      const updated = certifications.map(cert => { const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date(); const expiringIn30Days = cert.expiresAt && ((new Date(cert.expiresAt) - new Date()) < 30*24*60*60*1000); return { ...cert.dataValues, isExpired, expiringIn30Days }; });
      return res.json({ success: true, certifications: updated });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expiring certifications (for notifications)
exports.getExpiringCertifications = async (req, res) => {
  try {
    let Op;
    try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    try{
      const certs = await CertificationModel.find({ expiresAt: { $gte: new Date(), $lte: thirtyDaysFromNow }, status: { $ne: 'expired' } }).sort({ expiresAt: 1 }).lean().exec();
      return res.json({ success: true, certifications: certs });
    }catch(e){
      const certifications = await SQLCertification.findAll({ where: { expiresAt: { [Op.between]: [new Date(), thirtyDaysFromNow] }, status: { [Op.ne]: 'expired' } }, include: [{ model: require('../models').User }], order: [['expiresAt','ASC']] });
      return res.json({ success: true, certifications });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update certification
exports.updateCertification = async (req, res) => {
  try {
    const { certificationId } = req.params;
    const { certificationName, issuingBody, issuedAt, expiresAt, documentUrl } = req.body;
    try{
      const cert = await CertificationModel.findById(certificationId).exec().catch(()=>null);
      if(!cert){
        const c = await SQLCertification.findByPk(certificationId).catch(()=>null);
        if(!c) return res.status(404).json({ error: 'Certification not found' });
        await c.update({ certificationName, issuingBody, issuedAt, expiresAt, documentUrl, status: expiresAt ? (new Date(expiresAt) < new Date() ? 'expired' : 'active') : 'active' });
        return res.json({ success: true, certification: c });
      }
      cert.certificationName = certificationName; cert.issuingBody = issuingBody; cert.issuedAt = issuedAt; cert.expiresAt = expiresAt; cert.documentUrl = documentUrl; cert.status = expiresAt ? (new Date(expiresAt) < new Date() ? 'expired' : 'active') : 'active';
      await cert.save();
      return res.json({ success: true, certification: cert.toObject() });
    }catch(e){
      return res.status(500).json({ error: e.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete certification
exports.deleteCertification = async (req, res) => {
  try {
    const { certificationId } = req.params;
    try{
      const cert = await CertificationModel.findById(certificationId).exec().catch(()=>null);
      if(!cert){
        const c = await SQLCertification.findByPk(certificationId).catch(()=>null);
        if(!c) return res.status(404).json({ error: 'Certification not found' });
        await c.destroy();
        return res.json({ success: true });
      }
      await cert.remove();
      return res.json({ success: true });
    }catch(e){
      return res.status(500).json({ error: e.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
