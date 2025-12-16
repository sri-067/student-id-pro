// backend/src/controllers/logs.controller.js
const VerificationLog = require('../models/VerificationLog');
const { Parser } = require('json2csv');

async function listLogs(req, res, next) {
  try {
    const { page = 1, limit = 20, studentId, result, from, to, export: doExport } = req.query;
    const q = {};
    if (studentId) q.studentId = studentId;
    if (result) q.result = result;
    if (from || to) q.scannedAt = {};
    if (from) q.scannedAt.$gte = new Date(from);
    if (to) q.scannedAt.$lte = new Date(to);

    const logs = await VerificationLog.find(q)
      .sort({ scannedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('studentId', 'regNo name department');

    const total = await VerificationLog.countDocuments(q);

    // If request asks for export=csv, stream CSV
    if (doExport === 'csv') {
      const flat = logs.map(l => ({
        scannedAt: l.scannedAt,
        studentReg: l.studentId?.regNo || '',
        studentName: l.studentId?.name || '',
        result: l.result,
        ip: l.ip,
        userAgent: l.userAgent,
        notes: l.notes || ''
      }));
      const parser = new Parser();
      const csv = parser.parse(flat);
      res.header('Content-Type', 'text/csv');
      res.attachment('verification-logs.csv');
      return res.send(csv);
    }

    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

module.exports = { listLogs };
