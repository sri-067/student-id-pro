const Session = require('../models/Session');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

class SessionManager {
  static async createSession(user, deviceInfo) {
    // Check concurrent session limit
    const activeSessions = await Session.countDocuments({
      userId: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (activeSessions >= user.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = await Session.findOne({
        userId: user._id,
        isActive: true
      }).sort({ lastActivity: 1 });
      
      if (oldestSession) {
        await this.endSession(oldestSession._id, 'concurrent_limit');
      }
    }

    // Create new session
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const session = new Session({
      userId: user._id,
      token,
      deviceInfo,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await session.save();
    
    // Add session to user
    user.sessions.push(session._id);
    user.lastLogin = new Date();
    await user.save();

    return { session, token };
  }

  static async validateSession(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await Session.findOne({
        token,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).populate('userId');

      if (!session) {
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();

      return session.userId;
    } catch (error) {
      return null;
    }
  }

  static async endSession(sessionId, reason = 'manual') {
    await Session.findByIdAndUpdate(sessionId, {
      isActive: false,
      logoutTime: new Date(),
      logoutReason: reason
    });
  }

  static async endAllUserSessions(userId, reason = 'admin_force') {
    await Session.updateMany(
      { userId, isActive: true },
      {
        isActive: false,
        logoutTime: new Date(),
        logoutReason: reason
      }
    );
  }

  static async cleanupExpiredSessions() {
    await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}

// Auto-logout middleware
const autoLogout = (timeoutMinutes = 30) => {
  return async (req, res, next) => {
    if (req.user && req.session) {
      const lastActivity = new Date(req.session.lastActivity);
      const now = new Date();
      const diffMinutes = (now - lastActivity) / (1000 * 60);

      if (diffMinutes > timeoutMinutes) {
        await SessionManager.endSession(req.session._id, 'timeout');
        return res.status(401).json({ error: 'Session expired due to inactivity' });
      }
    }
    next();
  };
};

module.exports = { SessionManager, autoLogout };