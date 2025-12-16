// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { registerAdmin, login } = require('../controllers/auth.controller');

router.post(
  '/register',
  [
    body('name').isLength({ min: 2 }).withMessage('name required'),
    body('email').isEmail().withMessage('valid email required'),
    body('password').isLength({ min: 6 }).withMessage('password min 6 chars')
  ],
  validate,
  registerAdmin
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('valid email required'),
    body('password').exists().withMessage('password required')
  ],
  validate,
  login
);

router.post(
  '/student-login',
  [
    body('regNo').notEmpty().withMessage('registration number required'),
    body('password').exists().withMessage('password required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { regNo, password } = req.body;
      const Student = require('../models/Student');
      const bcrypt = require('bcrypt');
      const jwt = require('jsonwebtoken');
      
      const student = await Student.findOne({ regNo, deleted: { $ne: true } });
      if (!student || !student.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, student.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { id: student._id, regNo: student.regNo, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        token,
        student: {
          id: student._id,
          regNo: student.regNo,
          name: student.name,
          department: student.department,
          year: student.year
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
