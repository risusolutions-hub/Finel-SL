const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sparkel';

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose;
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('MongoDB connected');
  return mongoose;
}

module.exports = { connectMongo, mongoose };
