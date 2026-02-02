const mongoose = require('mongoose');

// Require model files (they register themselves with mongoose)

const User = require('./User');
const Settings = require('./Settings');

const DailyWorkTime = require('./DailyWorkTime');
const Complaint = require('./Complaint');
const ApiLog = require('./ApiLog');
const Session = require('./Session');

module.exports = {
  mongoose,
  User,
  Settings,
  DailyWorkTime,
  Complaint,
  ApiLog,
  Session
};
