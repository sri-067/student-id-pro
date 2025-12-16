const Event = require('../models/Event');
const Student = require('../models/Student');
const { generateQRCodeDataUrlForId } = require('../utils/qr');
const crypto = require('crypto');

// Create Event
async function createEvent(req, res, next) {
  try {
    const { name, description, eventDate, location, maxAttendees, settings } = req.body;
    
    // Generate unique event QR code
    const eventQrId = crypto.randomBytes(16).toString('hex');
    
    const event = new Event({
      name,
      description,
      eventDate: new Date(eventDate),
      location,
      maxAttendees,
      organizer: req.user.id,
      qrCode: eventQrId,
      settings: settings || {}
    });

    await event.save();

    // Generate QR code for event check-in
    const { qrDataUrl, signedUrl } = await generateQRCodeDataUrlForId(
      `event:${eventQrId}`,
      process.env.APP_URL || 'http://localhost:5000',
      process.env.JWT_SECRET
    );

    res.status(201).json({
      event,
      qrDataUrl,
      checkInUrl: signedUrl
    });
  } catch (error) {
    next(error);
  }
}

// List Events
async function listEvents(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ eventDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// Event Check-in via QR
async function eventCheckIn(req, res, next) {
  try {
    const { eventId, studentId } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'ongoing' && event.status !== 'upcoming') {
      return res.status(400).json({ error: 'Event is not active for check-ins' });
    }

    const student = await Student.findById(studentId);
    if (!student || student.deleted) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if already checked in
    const existingCheckIn = event.attendees.find(
      a => a.studentId.toString() === studentId
    );

    if (existingCheckIn && !event.settings.allowMultipleCheckIns) {
      return res.status(400).json({ 
        error: 'Student already checked in',
        checkInTime: existingCheckIn.checkInTime
      });
    }

    // Check capacity
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is at full capacity' });
    }

    // Add check-in
    event.attendees.push({
      studentId,
      checkInTime: new Date(),
      checkInMethod: 'qr'
    });
    event.currentAttendees = event.attendees.length;

    await event.save();

    res.json({
      message: 'Check-in successful',
      student: {
        name: student.name,
        regNo: student.regNo,
        department: student.department
      },
      checkInTime: new Date()
    });
  } catch (error) {
    next(error);
  }
}

// Get Event Analytics
async function getEventAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id)
      .populate('attendees.studentId', 'name regNo department year');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Analytics data
    const analytics = {
      totalAttendees: event.currentAttendees,
      checkInRate: event.maxAttendees ? 
        ((event.currentAttendees / event.maxAttendees) * 100).toFixed(2) : 100,
      departmentBreakdown: {},
      yearBreakdown: {},
      checkInTimeline: []
    };

    // Process attendee data
    event.attendees.forEach(attendee => {
      if (attendee.studentId) {
        const dept = attendee.studentId.department || 'Unknown';
        const year = attendee.studentId.year || 'Unknown';
        
        analytics.departmentBreakdown[dept] = 
          (analytics.departmentBreakdown[dept] || 0) + 1;
        analytics.yearBreakdown[year] = 
          (analytics.yearBreakdown[year] || 0) + 1;
        
        analytics.checkInTimeline.push({
          time: attendee.checkInTime,
          student: attendee.studentId.name,
          regNo: attendee.studentId.regNo
        });
      }
    });

    res.json({ event, analytics });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  listEvents,
  eventCheckIn,
  getEventAnalytics
};