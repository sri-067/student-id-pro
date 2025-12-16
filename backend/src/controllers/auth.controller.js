// backend/src/controllers/auth.controller.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function registerAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role: 'admin' });
    await user.save();
    res.json({ message: 'admin created', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // If user not found or no password stored, return same 401 to avoid leaking info
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // safe compare; bcrypt.compare will receive valid strings
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerAdmin, login };
