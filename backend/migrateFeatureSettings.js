require('dotenv').config();
const { connectMongo } = require('./src/config/mongo');
const Settings = require('./src/models_mongo/Settings');

async function migrateFeatureSettings() {
  try {
    console.log('Connecting to MongoDB...');
    await connectMongo();
    await Settings.initializeDefaults();
    console.log('Feature settings migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Feature settings migration failed:', err);
    process.exit(1);
  }
}

migrateFeatureSettings();
