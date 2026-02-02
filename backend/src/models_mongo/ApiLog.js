const mongoose = require('mongoose');

const ApiLogSchema = new mongoose.Schema({
  method: { type: String, required: true },
  endpoint: { type: String, required: true },
  statusCode: { type: Number },
  userId: { type: mongoose.Schema.Types.Mixed, default: null },
  requestBody: { type: String, default: null },
  responseTime: { type: Number },
  ipAddress: { type: String },
  userAgent: { type: String },
  errorMessage: { type: String, default: null }
}, { timestamps: true, collection: 'api_logs' });

module.exports = mongoose.model('ApiLog', ApiLogSchema);