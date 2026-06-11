'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const User     = require('../models/User');
const UserApiSettings = require('../models/UserApiSettings');

const MONGO_URI  = process.env.MONGODB_URI || 'mongodb://localhost:27017/armada-directions';
const WRONG_VAL  = 7000;
const CORRECT_VAL = 1000;

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', MONGO_URI, '\n');

  // 1. Find all UserApiSettings docs with the wrong totalCredits
  const wrongDocs = await UserApiSettings.find({ totalCredits: WRONG_VAL });

  if (wrongDocs.length === 0) {
    console.log(`No UserApiSettings found with totalCredits = ${WRONG_VAL}.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${wrongDocs.length} doc(s) with totalCredits = ${WRONG_VAL}:\n`);

  // 2. For each wrong doc, show the linked user before updating
  for (const doc of wrongDocs) {
    const user = await User.findOne({ activeApiSettings: doc._id }).select('firstName lastName email role');
    console.log('  ApiSettings ID :', doc._id.toString());
    console.log('  Linked user    :', user ? `${user.firstName} ${user.lastName} <${user.email}> (${user.role})` : 'No linked user');
    console.log('  totalCredits   :', doc.totalCredits, '→', CORRECT_VAL);
    console.log('  usedCredits    :', doc.usedCredits);
    console.log();
  }

  // 3. Apply the update
  const result = await UserApiSettings.updateMany(
    { totalCredits: WRONG_VAL },
    { $set: { totalCredits: CORRECT_VAL } }
  );
  console.log(`✅  Updated ${result.modifiedCount} document(s).`);

  // 4. Verify
  const verify = await UserApiSettings.find({ totalCredits: CORRECT_VAL });
  console.log(`    Verification: ${verify.length} doc(s) now have totalCredits = ${CORRECT_VAL}.`);

  const remaining = await UserApiSettings.find({ totalCredits: WRONG_VAL });
  if (remaining.length > 0) {
    console.error(`❌  ${remaining.length} doc(s) still have totalCredits = ${WRONG_VAL}.`);
  } else {
    console.log(`    No doc with totalCredits = ${WRONG_VAL} remains. ✅`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
