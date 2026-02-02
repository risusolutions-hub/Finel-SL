const { Customer, Machine } = require('../models');
const { mongoose, Customer: MCustomer } = require('../models_mongo');
const MachineModel = mongoose.models.Machine || mongoose.model('Machine', new mongoose.Schema({}, { strict: false }));

let Op;
try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }

async function listCustomers(req, res){
  // Prefer Mongo customers when available
  try{
    const docs = await MCustomer.find().lean().exec();
    return res.json({ customers: docs });
  }catch(e){
    const customers = await Customer.findAll();
    return res.json({ customers });
  }
}

// Search customer by service number - used in complaint form
async function searchByServiceNo(req, res){
  const { serviceNo } = req.query;
  if (!serviceNo) {
    return res.status(400).json({ error: 'Service number is required' });
  }

  try {
    // Try Mongo find first
    let customer = await MCustomer.findOne({ serviceNo: { $regex: serviceNo, $options: 'i' } }).lean().exec().catch(()=>null);
    if(customer){
      const machines = await MachineModel.find({ customerId: customer._id }).lean().exec().catch(()=>[]);
      return res.json({ found: true, customer, machines });
    }

    // Fallback to SQL
    customer = await Customer.findOne({ where: { serviceNo: { [Op.like]: serviceNo } } });
    if(!customer) return res.json({ found: false, customer: null, machines: [] });
    const machines = await Machine.findAll({ where: { customerId: customer.id } });
    return res.json({ found: true, customer, machines });
  } catch(err) {
    console.error('Service number search error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function createCustomer(req, res){
  const { name, company, city, contact, serviceNo, companyName, contactPerson, phones, phone, address, email } = req.body;
  
  // Use companyName or name or company
  const finalName = companyName || name || company;
  // Use contact or phone or first from phones array
  const finalContact = contact || phone || (phones && phones.length > 0 ? phones[0] : null);
  
  if(!finalName) return res.status(400).json({ error: 'Company/Customer name is required' });

  try{
    // Create in Mongo
    try{
      const doc = new MCustomer({
        name: finalName,
        company: finalName,
        companyName: finalName,
        city: city || 'Unknown',
        contact: finalContact || 'N/A',
        phone: finalContact,
        phones: phones || (finalContact ? [finalContact] : []),
        serviceNo,
        contactPerson,
        address,
        email
      });
      await doc.save();
      return res.status(201).json(doc);
    }catch(e){
      const customer = await Customer.create({ 
        name: finalName, 
        company: finalName,
        companyName: finalName,
        city: city || 'Unknown', 
        contact: finalContact || 'N/A',
        phone: finalContact,
        phones: phones || (finalContact ? [finalContact] : []),
        serviceNo,
        contactPerson,
        address,
        email
      });
      return res.status(201).json(customer);
    }
  }catch(err){
    res.status(400).json({ error: err.message });
  }
}

async function updateCustomer(req, res){
  const { id } = req.params;
  // Try mongo id first
  let customer = await MCustomer.findById(id).exec().catch(()=>null);
  let source = 'mongo';
  if(!customer){
    customer = await Customer.findByPk(id);
    source = 'sql';
  }
  if(!customer) return res.status(404).json({ error: 'Not found' });

  const { name, company, city, contact, serviceNo, companyName, contactPerson, phones, phone, address, email } = req.body;
  if(name) customer.name = name;
  if(company !== undefined) customer.company = company;
  if(companyName !== undefined) customer.companyName = companyName;
  if(city) customer.city = city;
  if(contact) customer.contact = contact;
  if(phone) customer.phone = phone;
  if(phones !== undefined) customer.phones = phones;
  if(serviceNo !== undefined) customer.serviceNo = serviceNo;
  if(contactPerson !== undefined) customer.contactPerson = contactPerson;
  if(address !== undefined) customer.address = address;
  if(email !== undefined) customer.email = email;
  if(source === 'mongo'){
    Object.assign(customer, { name, company, companyName, city, contact, phone, phones, serviceNo, contactPerson, address, email });
    await customer.save();
    res.json(customer);
  }else{
    if(name) customer.name = name;
    if(company !== undefined) customer.company = company;
    if(companyName !== undefined) customer.companyName = companyName;
    if(city) customer.city = city;
    if(contact) customer.contact = contact;
    if(phone) customer.phone = phone;
    if(phones !== undefined) customer.phones = phones;
    if(serviceNo !== undefined) customer.serviceNo = serviceNo;
    if(contactPerson !== undefined) customer.contactPerson = contactPerson;
    if(address !== undefined) customer.address = address;
    if(email !== undefined) customer.email = email;
    await customer.save();
    res.json(customer);
  }
}

async function deleteCustomer(req, res){
  const { id } = req.params;
  let customer = await MCustomer.findById(id).exec().catch(()=>null);
  if(customer){ await customer.remove(); return res.json({ ok: true }); }
  customer = await Customer.findByPk(id);
  if(!customer) return res.status(404).json({ error: 'Not found' });
  await customer.destroy();
  res.json({ ok: true });
}

module.exports = { listCustomers, searchByServiceNo, createCustomer, updateCustomer, deleteCustomer };