require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.routes');
const studentsRoutes = require('./routes/students.routes');
const verifyRoutes = require('./routes/verify.routes');
const studentPortalRoutes = require('./routes/student-portal.routes');

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Handle ngrok warning bypass
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const logsRoutes = require('./routes/logs.routes');
app.use('/api/logs', logsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/', verifyRoutes); // public verify route mounted at /verify/:token

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});


// (inside src/index.js) — rate limiters area
const rateLimit = require('express-rate-limit');

// verify: stronger limits to prevent brute-force / spam
const verifyLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10,             // max 10 requests per IP per 30s
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verify requests, slow down' }
});

app.use('/verify', verifyLimiter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

console.log('Starting server...');
console.log('PORT:', PORT);
console.log('MONGO_URI exists:', !!MONGO_URI);

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
