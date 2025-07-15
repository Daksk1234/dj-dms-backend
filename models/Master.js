const mongoose = require('mongoose');
const masterSchema = new mongoose.Schema({
  email: String,
  password: String, // In production: hash this!
});
module.exports = mongoose.model('Master', masterSchema);
