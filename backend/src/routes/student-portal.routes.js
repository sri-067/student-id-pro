const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { generateQRCodeDataUrlForId } = require('../utils/qr');

// Middleware to verify student token
const studentAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'student') return res.status(403).json({ error: 'Student access only' });
    req.student = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get student profile and QR
router.get('/profile', studentAuth, async (req, res, next) => {
  try {
    const student = await Student.findById(req.student.id).select('-password');
    if (!student || student.deleted) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { qrDataUrl, signedUrl } = await generateQRCodeDataUrlForId(
      student.qrId,
      process.env.APP_URL || 'http://localhost:5000',
      process.env.JWT_SECRET
    );

    res.json({
      student: {
        name: student.name,
        regNo: student.regNo,
        department: student.department,
        year: student.year,
        email: student.email,
        phone: student.phone,
        photoUrl: student.photoUrl,
        cardNumber: student.cardNumber,
        status: student.status,
        cardIssuedAt: student.cardIssuedAt,
        cardExpiry: student.cardExpiry
      },
      qrDataUrl,
      signedUrl
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;