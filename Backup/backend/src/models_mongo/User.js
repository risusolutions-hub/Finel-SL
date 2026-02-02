const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String },
  passwordLastChanged: { type: Date, default: Date.now },
  passwordExpiresAt: { type: Date },
  passwordStrength: { type: String, default: 'unknown' },
  failedLoginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  role: { type: String, enum: ['superadmin','admin','manager','engineer'], default: 'engineer' },
  status: { type: String, enum: ['active','blocked'], default: 'active' },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date },
  lastLoginAt: { type: Date },
  activeTime: { type: Number, default: 0 },
  isCheckedIn: { type: Boolean, default: false },
  dailyFirstCheckIn: { type: Date },
  dailyLastCheckOut: { type: Date },
  dailyTotalWorkTime: { type: Number, default: 0 }
}, { timestamps: true });

UserSchema.methods.verifyPassword = async function(password){
  if(!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
}

UserSchema.pre('save', async function(next){
  if(this.isModified('passwordHash') && this.passwordHash){
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
