const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, index: true },
  problem: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  attachments: { type: Array, default: [] },
  issueCategories: { type: Array, default: [] },
  customerId: { type: mongoose.Schema.Types.Mixed },
  machineId: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.Mixed, default: null },
  assignedBy: { type: mongoose.Schema.Types.Mixed, default: null },
  assignedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.Mixed, default: null },
  startedAt: { type: Date },
  completedAt: { type: Date },
  closedAt: { type: Date },
  checkInTime: { type: Date },
  workStatus: { type: String },
  solutionNotes: { type: String },
  sparesUsed: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
