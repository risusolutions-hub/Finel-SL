const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  city: { type: String },
  contact: { type: String },
  serviceNo: { type: String, index: true },
  companyName: { type: String },
  contactPerson: { type: String },
  phones: { type: [String] },
  phone: { type: String },
  address: { type: String },
  email: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);