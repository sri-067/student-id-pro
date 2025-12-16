const crypto = require('crypto');
const bcrypt = require('bcrypt');

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function hashToken(token) {
  if (!token) throw new Error('token required to hash');
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(token, salt);
}

async function compareToken(token, hash) {
  // Defensive: if either is missing, return false instead of letting bcrypt throw
  if (!token || !hash) return false;
  try {
    return await bcrypt.compare(token, hash);
  } catch (err) {
    // any error -> treat as non-match
    return false;
  }
}

module.exports = { createToken, hashToken, compareToken };
