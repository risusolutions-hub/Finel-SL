const { mongoose, User, Settings, DailyWorkTime } = require('../models_mongo');
const mongooseModels = { User, Settings, DailyWorkTime };

// Helper to create a flexible mongoose model for legacy names if not present
const createFlexibleModel = (name, collection) => {
  if(mongooseModels[name]) return mongooseModels[name];
  try{
    return require(`../models_mongo/${name}`);
  }catch(e){
    const schema = new mongoose.Schema({}, { strict: false, collection });
    const model = mongoose.models[name] || mongoose.model(name, schema);
    mongooseModels[name] = model;
    return model;
  }
};

// Expose a lightweight compatibility layer that maps common Sequelize methods to Mongoose
const wrap = (M) => {
  return {
    findByPk: (id, opts) => M.findById(id).exec(),
    findOne: (q) => {
      const where = q && q.where ? q.where : q || {};
      return M.findOne(where).exec();
    },
    findAll: (q) => {
      const where = q && q.where ? q.where : (q || {});
      return M.find(where).exec();
    },
    findOrCreate: async ({ where, defaults }) => {
      let doc = await M.findOne(where).exec();
      if(doc) return [doc, false];
      doc = new M(Object.assign({}, defaults, where));
      await doc.save();
      return [doc, true];
    },
    create: (obj) => {
      const d = new M(obj);
      return d.save();
    }
  };
};

module.exports = {
  // Keep a dummy sequelize compatibility object with no-op methods
  sequelize: { authenticate: async ()=>{}, sync: async ()=>{} },
  User: wrap(createFlexibleModel('User','users')),
  Customer: wrap(createFlexibleModel('Customer','customers')),
  Machine: wrap(createFlexibleModel('Machine','machines')),
  Complaint: wrap(createFlexibleModel('Complaint','complaints')),
  ServiceHistory: wrap(createFlexibleModel('ServiceHistory','service_histories')),
  EngineerStatus: wrap(createFlexibleModel('EngineerStatus','engineer_statuses')),
  Leave: wrap(createFlexibleModel('Leave','leaves')),
  DailyWorkTime: wrap(createFlexibleModel('DailyWorkTime','daily_work_times')),
  Message: wrap(createFlexibleModel('Message','messages')),
  EngineerSkill: wrap(createFlexibleModel('EngineerSkill','engineer_skills')),
  Certification: wrap(createFlexibleModel('Certification','certifications')),
  MachineServiceHistory: wrap(createFlexibleModel('MachineServiceHistory','machine_service_histories')),
  ServiceChecklist: wrap(createFlexibleModel('ServiceChecklist','service_checklists')),
  DuplicateComplaint: wrap(createFlexibleModel('DuplicateComplaint','duplicate_complaints')),
  DashboardWidget: wrap(createFlexibleModel('DashboardWidget','dashboard_widgets')),
  Settings: wrap(createFlexibleModel('Settings','settings')),
  AuditLog: wrap(createFlexibleModel('AuditLog','audit_logs')),
  ApiLog: wrap(createFlexibleModel('ApiLog','api_logs')),
  SystemConfig: wrap(createFlexibleModel('SystemConfig','system_configs'))
};

