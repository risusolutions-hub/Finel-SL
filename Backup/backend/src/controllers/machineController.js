const { Machine: SQLMachine, Customer: SQLCustomer } = require('../models');
const { mongoose, Machine, Customer } = require('../models_mongo');
const MachineModel = mongoose.models.Machine || mongoose.model('Machine', new mongoose.Schema({}, { strict: false }));
const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));

async function listMachines(req, res){
  try{
    const docs = await MachineModel.find().lean().exec();
    return res.json({ machines: docs });
  }catch(e){
    const machines = await SQLMachine.findAll({ include: SQLCustomer });
    return res.json({ machines });
  }
}

async function createMachine(req, res){
  const { model, serialNumber, installationDate, warrantyAmc, customerId } = req.body;
  if(!model || !serialNumber || !installationDate || !customerId) return res.status(400).json({ error: 'Missing fields' });

  try{
    const doc = new MachineModel({ model, serialNumber, installationDate: new Date(installationDate), warrantyAmc, customerId });
    await doc.save();
    return res.status(201).json(doc);
  }catch(err){
    const machine = await SQLMachine.create({ model, serialNumber, installationDate, warrantyAmc, customerId });
    return res.status(201).json(machine);
  }
}

async function updateMachine(req, res){
  const { id } = req.params;
  let machine = await MachineModel.findById(id).exec().catch(()=>null);
  let source = 'mongo';
  if(!machine){ machine = await SQLMachine.findByPk(id).catch(()=>null); source='sql'; }
  if(!machine) return res.status(404).json({ error: 'Not found' });

  const { model, serialNumber, installationDate, warrantyAmc, customerId } = req.body;
  if(source === 'mongo'){
    if(model) machine.model = model;
    if(serialNumber) machine.serialNumber = serialNumber;
    if(installationDate) machine.installationDate = new Date(installationDate);
    if(warrantyAmc !== undefined) machine.warrantyAmc = warrantyAmc;
    if(customerId) machine.customerId = customerId;
    await machine.save();
    return res.json(machine);
  }else{
    if(model) machine.model = model;
    if(serialNumber) machine.serialNumber = serialNumber;
    if(installationDate) machine.installationDate = installationDate;
    if(warrantyAmc !== undefined) machine.warrantyAmc = warrantyAmc;
    if(customerId) machine.customerId = customerId;
    await machine.save();
    return res.json(machine);
  }
}

async function deleteMachine(req, res){
  const { id } = req.params;
  let machine = await MachineModel.findById(id).exec().catch(()=>null);
  if(machine){ await machine.remove(); return res.json({ ok: true }); }
  machine = await SQLMachine.findByPk(id).catch(()=>null);
  if(!machine) return res.status(404).json({ error: 'Not found' });
  await machine.destroy();
  res.json({ ok: true });
}

module.exports = { listMachines, createMachine, updateMachine, deleteMachine };