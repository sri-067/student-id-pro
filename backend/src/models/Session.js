const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,
    browser: String,
    os: String
  },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  loginTime: { type: Date, default: Date.now },
  logoutTime: Date,
  logoutReason: { 
    type: String, 
    enum: ['manual', 'timeout', 'concurrent_limit', 'admin_force'] 
  }
}, { timestamps: true });

// Auto-expire sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);