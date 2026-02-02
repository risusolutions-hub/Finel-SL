const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: String },
  type: { type: String, enum: ['boolean','string','number','json'], default: 'boolean' },
  category: { type: String, default: 'features' },
  label: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const defaultSettings = [
  { key: 'feature_skills', value: 'true', type: 'boolean', category: 'features', label: 'Skills Management', description: 'Enable/disable skills tracking and management for engineers' },
  { key: 'feature_certifications', value: 'true', type: 'boolean', category: 'features', label: 'Certifications', description: 'Enable/disable certification tracking for engineers' },
  { key: 'feature_checklists', value: 'true', type: 'boolean', category: 'features', label: 'Service Checklists', description: 'Enable/disable service checklists for tickets' },
  { key: 'feature_customization', value: 'true', type: 'boolean', category: 'features', label: 'UI Customization', description: 'Enable/disable user interface customization options' },
  { key: 'feature_leave_management', value: 'true', type: 'boolean', category: 'features', label: 'Leave Management', description: 'Enable/disable leave request and approval system' },
  { key: 'feature_analytics', value: 'true', type: 'boolean', category: 'features', label: 'Analytics Dashboard', description: 'Enable/disable analytics and reporting features' },
  { key: 'feature_notifications', value: 'true', type: 'boolean', category: 'features', label: 'Notifications', description: 'Enable/disable system notifications' }
];

SettingsSchema.statics.initializeDefaults = async function(){
  try{
    for(const s of defaultSettings){
      await this.updateOne({ key: s.key }, { $setOnInsert: s }, { upsert: true });
    }
    console.log('Default settings initialized (mongo)');
  }catch(err){
    console.error('Failed to initialize default settings (mongo):', err);
  }
}

module.exports = mongoose.model('Settings', SettingsSchema);
