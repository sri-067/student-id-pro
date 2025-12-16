// backend/scripts/migrate-qr.js
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const { createQrId, generateQRCodeDataUrlForId } = require('../src/utils/qr');

(async function(){
  await mongoose.connect(process.env.MONGO_URI);
  const students = await Student.find({ qrId: { $exists: false } });
  console.log('Found', students.length, 'students to migrate');
  for (const s of students) {
    const qrId = createQrId();
    const { sig } = await generateQRCodeDataUrlForId(qrId, process.env.APP_URL, process.env.JWT_SECRET);
    s.qrId = qrId;
    s.qrSig = sig;
    await s.save();
    console.log('Migrated', s.regNo);
  }
  console.log('Done');
  process.exit(0);
})();
