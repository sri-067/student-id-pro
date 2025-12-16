// backend/src/models/Student.js
const mongoose = require('mongoose');

const qrHistorySchema = new mongoose.Schema({
  qrId: String,
  qrSig: String,
  issuedAt: Date
}, { _id: false });

const studentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  department: String,
  year: String,
  email: String,
  phone: String,
  password: String, // for student login
  photoUrl: String,
  cardNumber: { type: String, unique: true },
  qrId: { type: String, index: true },
  qrSig: String,
  qrHistory: [qrHistorySchema], // keeps previous qr meta
  cardIssuedAt: Date,
  cardExpiry: Date,
  status: { type: String, enum: ['active','expired','suspended'], default: 'active' },
  deleted: { type: Boolean, default: false }, // soft-delete flag
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
