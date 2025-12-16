// backend/src/models/AuditLog.js
const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminEmail: String,
  action: { type: String, required: true }, // e.g., REISSUE, DEACTIVATE, RENEW, DELETE
  targetStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  details: mongoose.Schema.Types.Mixed, // old/new values
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditSchema);
