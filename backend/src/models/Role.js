const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    enum: ['super_admin', 'admin', 'staff', 'security'],
    unique: true 
  },
  permissions: [{
    resource: { type: String, required: true }, // students, logs, events, users
    actions: [{ type: String, required: true }] // create, read, update, delete, verify
  }],
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);