'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

const MONGO_URI    = process.env.MONGODB_URI || 'mongodb://localhost:27017/armada-directions';
const TARGET_EMAIL = 'admin@armada123.com';
const NEW_PASSWORD = 'Admin123!';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', MONGO_URI);

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.error(`No user found with email: ${TARGET_EMAIL}`);
    process.exit(1);
  }
  console.log(`User: ${user.firstName} ${user.lastName} (${user.email}) — role: ${user.role}`);

  // Hash explicitly then write with updateOne — same approach as resetPassword controller.
  // Avoids any Mongoose pre-save hook or dirty-tracking issue with select:false fields.
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(NEW_PASSWORD, salt);

  await User.updateOne(
    { _id: user._id },
    {
      $set:   { password: hash },
      $unset: { resetPasswordToken: '', resetPasswordExpiry: '' },
    }
  );

  // Verify the write
  const updated = await User.findOne({ email: TARGET_EMAIL }).select('+password');
  const ok = await bcrypt.compare(NEW_PASSWORD, updated.password);
  if (!ok) {
    console.error('Hash mismatch after write — something is wrong');
    process.exit(1);
  }

  console.log(`\n✅  Password reset for ${TARGET_EMAIL}`);
  console.log(`    Temporary password: ${NEW_PASSWORD}`);
  console.log('    Change it after logging in.\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
