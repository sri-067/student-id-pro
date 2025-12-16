const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  eventDate: { type: Date, required: true },
  location: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  maxAttendees: Number,
  currentAttendees: { type: Number, default: 0 },
  qrCode: String, // Event-specific QR for check-ins
  checkInEnabled: { type: Boolean, default: true },
  attendees: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    checkInTime: { type: Date, default: Date.now },
    checkInMethod: { type: String, enum: ['qr', 'manual'], default: 'qr' }
  }],
  settings: {
    allowMultipleCheckIns: { type: Boolean, default: false },
    requirePreRegistration: { type: Boolean, default: false },
    sendNotifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);