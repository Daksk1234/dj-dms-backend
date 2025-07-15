const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Unit', unitSchema);