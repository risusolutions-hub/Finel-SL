const mongoose = require('mongoose');

const DailyWorkTimeSchema = new mongoose.Schema({
  engineerId: { type: mongoose.Schema.Types.Mixed, required: true },
  workDate: { type: String, required: true },
  firstCheckIn: { type: Date },
  lastCheckOut: { type: Date },
  totalWorkTimeMinutes: { type: Number, default: 0 },
  checkInCheckOutLog: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('DailyWorkTime', DailyWorkTimeSchema);
