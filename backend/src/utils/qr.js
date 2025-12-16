const QRCode = require('qrcode');
const crypto = require('crypto');
const { sign } = require('./hmac');

function createQrId() {
  return crypto.randomBytes(8).toString('hex'); // 16 hex chars
}

async function generateQRCodeDataUrlForId(qrId, appUrl, secret) {
  // URL format: {APP_URL}/verify/{qrId}:{sig}
  const sig = sign(qrId, secret);
  const verifyUrl = `${appUrl.replace(/\/$/, '')}/verify/${qrId}:${sig}`;
  return {
    qrDataUrl: await QRCode.toDataURL(verifyUrl),
    signedUrl: verifyUrl,
    sig
  };
}

module.exports = { createQrId, generateQRCodeDataUrlForId };
