const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, // ←🔥 this was missing
  address: String,
  city: String,
  state: String,
  long: Number,
  lat: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  pincode: {
    type: String,
  },
  pincodeLock: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
