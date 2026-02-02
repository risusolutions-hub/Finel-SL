const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  model: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  mobileNumbers: { type: [String], default: [] },
  installationDate: { type: Date },
  warrantyAmc: { type: String },
  customerId: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Machine', MachineSchema);
