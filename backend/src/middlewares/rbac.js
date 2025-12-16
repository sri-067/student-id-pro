// Role-Based Access Control Middleware
const User = require('../models/User');

const ROLE_PERMISSIONS = {
  super_admin: {
    students: ['create', 'read', 'update', 'delete', 'reissue'],
    users: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    logs: ['read', 'export'],
    reports: ['generate', 'export'],
    system: ['configure', 'backup']
  },
  admin: {
    students: ['create', 'read', 'update', 'reissue'],
    events: ['create', 'read', 'update'],
    logs: ['read', 'export'],
    reports: ['generate']
  },
  staff: {
    students: ['read', 'update'],
    events: ['read', 'update'],
    logs: ['read']
  },
  security: {
    students: ['read'],
    events: ['read'],
    verify: ['scan']
  }
};

function hasPermission(userRole, resource, action) {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions && permissions[resource] && permissions[resource].includes(action);
}

function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!hasPermission(user.role, resource, action)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: `${resource}:${action}`,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

module.exports = { hasPermission, requirePermission, ROLE_PERMISSIONS };