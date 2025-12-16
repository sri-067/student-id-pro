// backend/scripts/cleanup-uploads.js
// Usage: node backend/scripts/cleanup-uploads.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Student = require('../src/models/Student');

const UPLOADS = path.join(__dirname, '..', 'uploads');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const students = await Student.find({}, 'photoUrl').lean();
  const used = new Set();

  students.forEach(s => {
    if (s.photoUrl) {
      try {
        const url = s.photoUrl;
        // assume photoUrl is like http://host/uploads/filename.jpg
        const filename = url.split('/').pop();
        if (filename) used.add(filename);
      } catch (e) {}
    }
  });

  const files = fs.readdirSync(UPLOADS);
  const orphan = files.filter(f => !used.has(f));

  console.log('Found', orphan.length, 'orphan files:');
  orphan.forEach(f => console.log('  ', f));

  // confirm deletion from console
  if (orphan.length === 0) {
    console.log('No orphan files to delete.');
    process.exit(0);
  }

  // delete after confirmation (for safety)
  const prompt = require('prompt-sync')({ sigint: true });
  const yn = prompt('Delete these files? (yes/no) ');
  if (yn.toLowerCase().startsWith('y')) {
    orphan.forEach(f => fs.unlinkSync(path.join(UPLOADS, f)));
    console.log('Deleted', orphan.length, 'files.');
  } else {
    console.log('Aborted. No files deleted.');
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
