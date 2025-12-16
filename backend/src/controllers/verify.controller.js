const Student = require('../models/Student');
const VerificationLog = require('../models/VerificationLog');
const { verify } = require('../utils/hmac');

async function verifyByToken(req, res, next) {
  try {
    // token expected: "qrId:sig"
    const token = req.params.token || '';
    const [qrId, sig] = token.split(':');

    const logCommon = {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    // validate input
    if (!qrId || !sig) {
      await VerificationLog.create({ ...logCommon, result: 'invalid', notes: 'malformed token' });
      return res.send(getErrorHTML('Malformed QR Code', 'The QR code format is invalid.'));
    }

    // verify signature first (fast)
    const okSig = verify(qrId, sig, process.env.JWT_SECRET);
    if (!okSig) {
      await VerificationLog.create({ ...logCommon, result: 'invalid', notes: 'bad signature', studentId: null });
      return res.send(getErrorHTML('Invalid QR Code', 'This QR code has been tampered with or is fake.'));
    }

    // lookup student by indexed qrId
    const matched = await Student.findOne({ qrId });
    if (!matched) {
      await VerificationLog.create({ ...logCommon, result: 'invalid', notes: 'qrId not found' });
      return res.send(getErrorHTML('Student Not Found', 'This QR code does not match any student record.'));
    }

    // determine result (active/expired/suspended)
    const now = new Date();
    let result = 'success';
    if (matched.status !== 'active') result = matched.status;
    else if (matched.cardExpiry && matched.cardExpiry < now) result = 'expired';

    await VerificationLog.create({
      studentId: matched._id,
      scannedAt: new Date(),
      ...logCommon,
      result
    });

    // Return HTML page for mobile-friendly display
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="ngrok-skip-browser-warning" content="true">
      <title>Student ID Verification</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body class="${
      result === 'success' ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
      result === 'expired' ? 'bg-gradient-to-br from-yellow-50 to-orange-100' :
      'bg-gradient-to-br from-red-50 to-pink-100'
    } min-h-screen p-4">
      <div class="max-w-md mx-auto">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="${
            result === 'success' ? 'bg-green-500' :
            result === 'expired' ? 'bg-yellow-500' :
            'bg-red-500'
          } p-6 text-center">
            <div class="mx-auto h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
              <i class="${
                result === 'success' ? 'fas fa-check-circle' :
                result === 'expired' ? 'fas fa-clock' :
                'fas fa-times-circle'
              } text-white text-2xl"></i>
            </div>
            <h2 class="text-xl font-bold text-white">
              ${result === 'success' ? 'Valid ID' : result === 'expired' ? 'Expired ID' : 'Invalid ID'}
            </h2>
          </div>
          <div class="p-6">
            <div class="text-center mb-6">
              ${matched.photoUrl ? 
                `<img src="${matched.photoUrl}" alt="Student Photo" class="w-24 h-24 object-cover rounded-full mx-auto mb-4 border-4 border-gray-200">` :
                `<div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-gray-200">
                  <i class="fas fa-user text-gray-400 text-3xl"></i>
                </div>`
              }
              <h3 class="text-2xl font-bold text-gray-900 mb-1">${matched.name}</h3>
              <p class="text-gray-600 mb-4">${matched.regNo}</p>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-600">Department</span>
                <span class="font-medium text-gray-900">${matched.department}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-600">Year</span>
                <span class="font-medium text-gray-900">${matched.year}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-600">Status</span>
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                  result === 'success' ? 'bg-green-100 text-green-800' :
                  result === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }">${result}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-600">Issued</span>
                <span class="font-medium text-gray-900">${new Date(matched.cardIssuedAt).toLocaleDateString()}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-600">Expires</span>
                <span class="font-medium text-gray-900">${new Date(matched.cardExpiry).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-100 text-center">
              <p class="text-xs text-gray-500">Verified at ${new Date().toLocaleString()}</p>
              <p class="text-xs text-gray-400 mt-1">Student ID Verification System</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    next(err);
  }
  }

function getErrorHTML(title, message) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Failed</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body class="bg-gradient-to-br from-red-50 to-pink-100 min-h-screen p-4">
    <div class="max-w-md mx-auto">
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <div class="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">${title}</h2>
        <p class="text-red-600 mb-4">${message}</p>
        <div class="text-sm text-gray-500">
          Please contact the administrator if you believe this is an error.
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

module.exports = { verifyByToken };
