const express = require('express');
const router = express.Router();
const { verifyByToken } = require('../controllers/verify.controller');

// Public verify endpoint used by QR scans
router.get('/verify/:token', verifyByToken);

module.exports = router;
