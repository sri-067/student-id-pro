// backend/src/controllers/students.controller.js
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { createQrId, generateQRCodeDataUrlForId } = require('../utils/qr');

async function createStudent(req, res, next) {
  try {
    const { regNo, name, department, year, email, phone, password } = req.body;
    const existing = await Student.findOne({ regNo, deleted: { $ne: true } });
    if (existing) return res.status(400).json({ error: 'regNo exists' });

    const bcrypt = require('bcrypt');
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash(regNo, 10); // default password is regNo

    const student = new Student({
      regNo, name, department, year, email, phone,
      password: hashedPassword,
      cardNumber: `CARD-${regNo}-${Date.now()}`,
      cardIssuedAt: new Date(),
      cardExpiry: new Date(Date.now() + (process.env.TOKEN_LIFE_DAYS || 365) * 24*3600*1000)
    });

    if (req.file) {
      student.photoUrl = `${process.env.APP_URL.replace(/\/$/, '')}/uploads/${req.file.filename}`;
    } else {
      // Default placeholder image
      student.photoUrl = 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=Student';
    }

    const qrId = createQrId();
    student.qrId = qrId;
    const { qrDataUrl, signedUrl, sig } = await generateQRCodeDataUrlForId(qrId, process.env.APP_URL || 'http://localhost:5000', process.env.JWT_SECRET);
    student.qrSig = sig;

    await student.save();
    res.json({ student, qrDataUrl, signedUrl });
  } catch (err) { next(err); }
}

async function listStudents(req, res, next) {
  try {
    const { page = 1, limit = 200, search } = req.query;
    const q = { deleted: { $ne: true } };
    if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { regNo: { $regex: search, $options: 'i' } }];
    const students = await Student.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Student.countDocuments(q);
    res.json({ students, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function reissueStudent(req, res, next) {
  try {
    const id = req.params.id;
    const admin = req.user; // from auth middleware
    const student = await Student.findById(id);
    if (!student || student.deleted) return res.status(404).json({ error: 'student not found' });

    // save old QR to history
    student.qrHistory = student.qrHistory || [];
    student.qrHistory.push({ qrId: student.qrId, qrSig: student.qrSig, issuedAt: new Date() });

    // generate new qr
    const qrId = createQrId();
    const { qrDataUrl, signedUrl, sig } = await generateQRCodeDataUrlForId(qrId, process.env.APP_URL || 'http://localhost:5000', process.env.JWT_SECRET);
    const old = { qrId: student.qrId, qrSig: student.qrSig };

    student.qrId = qrId;
    student.qrSig = sig;
    student.updatedAt = new Date();
    await student.save();

    // audit log
    await AuditLog.create({
      adminId: admin?.id,
      adminEmail: admin?.email,
      action: 'REISSUE',
      targetStudentId: student._id,
      details: { old, new: { qrId, qrSig: sig } }
    });

    res.json({ message: 'reissued', student, qrDataUrl, signedUrl });
  } catch (err) { next(err); }
}

async function deactivateStudent(req, res, next) {
  try {
    const id = req.params.id;
    const admin = req.user;
    const student = await Student.findById(id);
    if (!student || student.deleted) return res.status(404).json({ error: 'student not found' });

    const oldStatus = student.status;
    student.status = 'suspended';
    await student.save();

    await AuditLog.create({
      adminId: admin?.id,
      adminEmail: admin?.email,
      action: 'DEACTIVATE',
      targetStudentId: student._id,
      details: { oldStatus, newStatus: student.status }
    });

    res.json({ message: 'deactivated', student });
  } catch (err) { next(err); }
}

async function reactivateStudent(req, res, next) {
  try {
    const id = req.params.id;
    const admin = req.user;
    const student = await Student.findById(id);
    if (!student || student.deleted) return res.status(404).json({ error: 'student not found' });

    const oldStatus = student.status;
    student.status = 'active';
    await student.save();

    await AuditLog.create({
      adminId: admin?.id,
      adminEmail: admin?.email,
      action: 'REACTIVATE',
      targetStudentId: student._id,
      details: { oldStatus, newStatus: student.status }
    });

    res.json({ message: 'reactivated', student });
  } catch (err) { next(err); }
}

async function softDeleteStudent(req, res, next) {
  try {
    const id = req.params.id;
    const admin = req.user;
    const student = await Student.findById(id);
    if (!student || student.deleted) return res.status(404).json({ error: 'student not found' });

    student.deleted = true;
    await student.save();

    await AuditLog.create({
      adminId: admin?.id,
      adminEmail: admin?.email,
      action: 'DELETE_SOFT',
      targetStudentId: student._id,
      details: { }
    });

    res.json({ message: 'deleted', student });
  } catch (err) { next(err); }
}

async function renewStudentExpiry(req, res, next) {
  try {
    const id = req.params.id;
    const admin = req.user;
    const { extraDays = 365 } = req.body;
    const student = await Student.findById(id);
    if (!student || student.deleted) return res.status(404).json({ error: 'student not found' });

    const oldExpiry = student.cardExpiry;
    const newExpiry = new Date(Date.now() + Number(extraDays) * 24*3600*1000);
    student.cardExpiry = newExpiry;
    await student.save();

    await AuditLog.create({
      adminId: admin?.id,
      adminEmail: admin?.email,
      action: 'RENEW',
      targetStudentId: student._id,
      details: { oldExpiry, newExpiry }
    });

    res.json({ message: 'renewed', student });
  } catch (err) { next(err); }
}

async function downloadQR(req, res, next) {
  try {
    const id = req.params.id;
    const student = await Student.findById(id);
    if (!student || student.deleted) return res.status(404).json({ error: 'student not found' });

    const { qrDataUrl, signedUrl } = await generateQRCodeDataUrlForId(
      student.qrId, 
      process.env.APP_URL || 'http://localhost:5000', 
      process.env.JWT_SECRET
    );

    res.json({ qrDataUrl, signedUrl, student: { name: student.name, regNo: student.regNo } });
  } catch (err) { next(err); }
}

module.exports = {
  createStudent,
  listStudents,
  reissueStudent,
  deactivateStudent,
  reactivateStudent,
  softDeleteStudent,
  renewStudentExpiry,
  downloadQR
};
