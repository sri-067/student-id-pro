const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  verifierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  scannedAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  location: { lat: Number, lng: Number },
  result: { type: String, enum: ['success','expired','suspended','invalid'] },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('VerificationLog', logSchema);
    