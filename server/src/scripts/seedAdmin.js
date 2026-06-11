'use strict';
// Creates (or re-creates) the platform admin account.
// Safe to run multiple times — updates in place if the email already exists.
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armada-directions';

const ADMIN = {
  email:     'admin@armada123.com',
  password:  'Admin123!',
  firstName: 'admin',
  lastName:  'Hakima123',
  role:      'admin',
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', MONGO_URI);

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(ADMIN.password, salt);

  const existing = await User.findOne({ email: ADMIN.email });

  if (existing) {
    // Update password and clear any stale reset tokens
    await User.updateOne(
      { _id: existing._id },
      {
        $set:   { password: hash, firstName: ADMIN.firstName, lastName: ADMIN.lastName, role: ADMIN.role },
        $unset: { resetPasswordToken: '', resetPasswordExpiry: '' },
      }
    );
    console.log(`✅  Updated existing admin: ${ADMIN.email}`);
  } else {
    // Create fresh admin user (agency: null is correct for role=admin)
    await User.create({
      firstName: ADMIN.firstName,
      lastName:  ADMIN.lastName,
      email:     ADMIN.email,
      password:  ADMIN.password, // pre-save hook hashes on create
      role:      ADMIN.role,
      agency:    null,
    });
    console.log(`✅  Created new admin: ${ADMIN.email}`);
  }

  // Final verification
  const saved = await User.findOne({ email: ADMIN.email }).select('+password');
  const ok    = await bcrypt.compare(ADMIN.password, saved.password);
  console.log(`    bcrypt verify: ${ok ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`\n    Email:    ${ADMIN.email}`);
  console.log(`    Password: ${ADMIN.password}\n`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
