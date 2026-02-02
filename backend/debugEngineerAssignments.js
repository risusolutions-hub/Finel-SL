require('dotenv').config();
const { connectMongo } = require('./src/config/mongo');
const { User, Complaint } = require('./src/models_mongo');

async function debugEngineerAssignments() {
  await connectMongo();
  const zx1 = await User.findOne({ email: 'zx1@example.com' });
  if (!zx1) {
    console.error('Engineer zx1 not found.');
    process.exit(1);
  }
  const zx1Id = String(zx1._id);
  console.log('zx1 _id:', zx1Id);
  const assignedComplaints = await Complaint.find({ assignedTo: zx1Id }).exec();
  console.log('Complaints assigned to zx1:', assignedComplaints.length);
  assignedComplaints.forEach(c => {
    console.log('Complaint:', c.complaintId, 'assignedTo:', c.assignedTo);
  });
  // Show all unique assignedTo values for assigned complaints
  const allAssigned = await Complaint.find({ assignedTo: { $ne: null } }).exec();
  const uniqueAssigned = [...new Set(allAssigned.map(c => c.assignedTo))];
  console.log('Unique assignedTo values in complaints:', uniqueAssigned);
  process.exit(0);
}

debugEngineerAssignments();
