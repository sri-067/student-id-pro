// backend/src/routes/logs.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth')(['admin']);
const { listLogs } = require('../controllers/logs.controller');

router.get('/', auth, listLogs); // supports pagination and export=csv

module.exports = router;
