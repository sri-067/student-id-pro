// backend/src/middlewares/ensureAdmin.js
module.exports = function ensureAdmin(req, res, next) {
  // auth middleware should already set req.user
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};
