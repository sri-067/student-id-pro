// backend/src/routes/students.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middlewares/auth')(['admin']);
const validate = require('../middlewares/validate');
const {
  createStudent,
  listStudents,
  reissueStudent,
  deactivateStudent,
  reactivateStudent,
  softDeleteStudent,
  renewStudentExpiry,
  downloadQR
} = require('../controllers/students.controller');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(8).toString('hex');
    cb(null, `${name}${ext}`);
  }
});
const upload = multer({ storage });

// Create student
router.post(
  '/',
  auth,
  upload.single('photo'),
  [
    body('regNo').notEmpty().withMessage('regNo required'),
    body('name').notEmpty().withMessage('name required'),
    body('email').optional().isEmail().withMessage('valid email'),
    body('phone').optional().isMobilePhone('any').withMessage('valid phone')
  ],
  validate,
  createStudent
);

// list students
router.get('/', auth, listStudents);

// Reissue QR
router.put('/:id/reissue', auth, reissueStudent);

// Deactivate / Reactivate (admin)
router.put('/:id/deactivate', auth, deactivateStudent);
router.put('/:id/reactivate', auth, reactivateStudent);

// Soft-delete student
router.delete('/:id', auth, softDeleteStudent);

// Renew expiry
router.put('/:id/renew', auth, renewStudentExpiry);

// Download QR
router.get('/:id/qr', auth, downloadQR);

module.exports = router;
