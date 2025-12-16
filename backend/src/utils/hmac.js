const crypto = require('crypto');

function sign(qrId, secret) {
  return crypto.createHmac('sha256', secret).update(qrId).digest('hex');
}

function verify(qrId, sig, secret) {
  if (!qrId || !sig || !secret) return false;
  try {
    const expectedHex = sign(qrId, secret);
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const providedBuf = Buffer.from(sig, 'hex');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (e) {
    return false;
  }
}

module.exports = { sign, verify };
