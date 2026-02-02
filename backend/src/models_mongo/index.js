const mongoose = require('mongoose');
const User = require('./User');

// Do NOT require model files here. Models should be required only after DB connection in server.js

module.exports = {
  mongoose,
  User, // Export the User model explicitly
};
