require('dotenv').config();
const { connectMongo } = require('./src/config/mongo');
const { Complaint, User, Customer, Machine } = require('./src/models_mongo');

async function migrateTestComplaints() {
  await connectMongo();
  const engineers = await User.find({ role: 'engineer' }).exec();
  const customers = await Customer.find().exec();
  const machines = await Machine.find().exec();
  if (!engineers.length || !customers.length || !machines.length) {
    console.error('Need at least one engineer, customer, and machine to create test complaints.');
    process.exit(1);
  }
  const engineer = engineers[0];
  const customer = customers[0];
  const machine = machines[0];
  const complaints = [];
  for (let i = 0; i < 25; i++) {
    complaints.push({
      complaintId: `TKT-TEST-${Date.now()}-${i}`,
      problem: `Test problem #${i+1}`,
      description: `Auto-generated test complaint ${i+1}`,
      priority: ['low','medium','high'][i%3],
      status: i < 20 ? 'assigned' : 'pending',
      assignedTo: i < 20 ? String(engineer._id) : null,
      customerId: customer._id,
      machineId: machine._id,
      issueCategories: [],
      attachments: [],
      workStatus: 'pending',
      sparesUsed: []
    });
  }
  await Complaint.insertMany(complaints);
  console.log('Inserted', complaints.length, 'test complaints.');
  process.exit(0);
}

migrateTestComplaints();
