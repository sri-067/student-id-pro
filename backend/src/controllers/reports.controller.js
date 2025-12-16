const Student = require('../models/Student');
const VerificationLog = require('../models/VerificationLog');
const Event = require('../models/Event');
const { Parser } = require('json2csv');

// Generate Custom Reports
async function generateReport(req, res, next) {
  try {
    const { 
      type, 
      startDate, 
      endDate, 
      department, 
      year, 
      status,
      format = 'json' 
    } = req.query;

    let data = [];
    let fields = [];

    switch (type) {
      case 'students':
        data = await generateStudentReport({ department, year, status });
        fields = ['regNo', 'name', 'department', 'year', 'status', 'cardIssuedAt', 'cardExpiry'];
        break;

      case 'verifications':
        data = await generateVerificationReport({ startDate, endDate, department });
        fields = ['studentName', 'regNo', 'department', 'scannedAt', 'result', 'ip'];
        break;

      case 'events':
        data = await generateEventReport({ startDate, endDate });
        fields = ['eventName', 'eventDate', 'totalAttendees', 'maxAttendees', 'status'];
        break;

      case 'analytics':
        data = await generateAnalyticsReport({ startDate, endDate });
        fields = Object.keys(data);
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'csv') {
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
      return res.send(csv);
    }

    res.json({
      reportType: type,
      generatedAt: new Date(),
      totalRecords: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function generateStudentReport({ department, year, status }) {
  const query = { deleted: { $ne: true } };
  
  if (department) query.department = new RegExp(department, 'i');
  if (year) query.year = year;
  if (status) query.status = status;

  return await Student.find(query)
    .select('regNo name department year status cardIssuedAt cardExpiry')
    .sort({ createdAt: -1 });
}

async function generateVerificationReport({ startDate, endDate, department }) {
  const query = {};
  
  if (startDate || endDate) {
    query.scannedAt = {};
    if (startDate) query.scannedAt.$gte = new Date(startDate);
    if (endDate) query.scannedAt.$lte = new Date(endDate);
  }

  const logs = await VerificationLog.find(query)
    .populate('studentId', 'name regNo department')
    .sort({ scannedAt: -1 });

  return logs.map(log => ({
    studentName: log.studentId?.name || 'Unknown',
    regNo: log.studentId?.regNo || 'Unknown',
    department: log.studentId?.department || 'Unknown',
    scannedAt: log.scannedAt,
    result: log.result,
    ip: log.ip
  })).filter(item => {
    if (department) {
      return item.department.toLowerCase().includes(department.toLowerCase());
    }
    return true;
  });
}

async function generateEventReport({ startDate, endDate }) {
  const query = {};
  
  if (startDate || endDate) {
    query.eventDate = {};
    if (startDate) query.eventDate.$gte = new Date(startDate);
    if (endDate) query.eventDate.$lte = new Date(endDate);
  }

  const events = await Event.find(query)
    .select('name eventDate currentAttendees maxAttendees status')
    .sort({ eventDate: -1 });

  return events.map(event => ({
    eventName: event.name,
    eventDate: event.eventDate,
    totalAttendees: event.currentAttendees,
    maxAttendees: event.maxAttendees || 'Unlimited',
    status: event.status,
    attendanceRate: event.maxAttendees ? 
      `${((event.currentAttendees / event.maxAttendees) * 100).toFixed(1)}%` : 'N/A'
  }));
}

async function generateAnalyticsReport({ startDate, endDate }) {
  const dateQuery = {};
  if (startDate || endDate) {
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
  }

  // Student statistics
  const totalStudents = await Student.countDocuments({ deleted: { $ne: true } });
  const activeStudents = await Student.countDocuments({ 
    deleted: { $ne: true }, 
    status: 'active' 
  });

  // Verification statistics
  const verificationQuery = dateQuery.createdAt ? { scannedAt: dateQuery } : {};
  const totalVerifications = await VerificationLog.countDocuments(verificationQuery);
  const successfulVerifications = await VerificationLog.countDocuments({
    ...verificationQuery,
    result: 'valid'
  });

  // Department breakdown
  const departmentStats = await Student.aggregate([
    { $match: { deleted: { $ne: true } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Recent activity
  const recentVerifications = await VerificationLog.countDocuments({
    scannedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  return {
    totalStudents,
    activeStudents,
    suspendedStudents: totalStudents - activeStudents,
    totalVerifications,
    successfulVerifications,
    verificationSuccessRate: totalVerifications > 0 ? 
      `${((successfulVerifications / totalVerifications) * 100).toFixed(1)}%` : '0%',
    recentVerifications,
    departmentBreakdown: departmentStats.reduce((acc, dept) => {
      acc[dept._id || 'Unknown'] = dept.count;
      return acc;
    }, {}),
    generatedAt: new Date()
  };
}

module.exports = {
  generateReport
};