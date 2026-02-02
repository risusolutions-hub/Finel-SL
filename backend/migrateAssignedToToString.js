require('dotenv').config();
const { connectMongo } = require('./src/config/mongo');
const { Complaint } = require('./src/models_mongo');

async function migrateAssignedToToString() {
  await connectMongo();
  const complaints = await Complaint.find({ assignedTo: { $ne: null } }).exec();
  let updated = 0;
  for (const c of complaints) {
    if (typeof c.assignedTo === 'object' && c.assignedTo._id) {
      c.assignedTo = String(c.assignedTo._id);
      await c.save();
      updated++;
      console.log('Updated complaint', c.complaintId, 'assignedTo:', c.assignedTo);
    }
  }
  console.log('Migration complete. Updated', updated, 'complaints.');
  process.exit(0);
}

migrateAssignedToToString();
