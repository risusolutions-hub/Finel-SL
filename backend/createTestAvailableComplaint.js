// Script to create a test available complaint (unassigned, pending)
const mongoose = require('mongoose');
const Complaint = require('./src/models_mongo/Complaint');

async function createAvailableComplaint() {
  await mongoose.connect('mongodb://localhost:27017/sparkel');
  const complaint = new Complaint({
    complaintId: 'TKT-' + Date.now(),
    problem: 'Test available ticket',
    priority: 'medium',
    status: 'pending',
    assignedTo: null,
    customerId: null,
    machineId: null,
    issueCategories: ['test']
  });
  await complaint.save();
  console.log('Test available complaint created:', complaint);
  await mongoose.disconnect();
}

createAvailableComplaint().catch(console.error);
