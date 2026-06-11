const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Agency = require('../models/Agency');
require('dotenv').config();

const seedTestUsers = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const password = await bcrypt.hash('test123', 12);

  // 1. Create Test Agency
  let agency = await Agency.findOne({ email: 'agency@test.com' });
  if (!agency) {
    agency = await Agency.create({
      name: 'Test Agency',
      email: 'agency@test.com',
      phone: '+216 71 000 000',
      status: 'active',
      subscription: { plan: 'pro', status: 'active' }
    });
    console.log('✅ Agency created');
  }

  // 2. Create Agency Admin
  let agencyAdmin = await User.findOne({ email: 'admin@test.com' });
  if (!agencyAdmin) {
    agencyAdmin = await User.create({
      firstName: 'Agency',
      lastName: 'Admin',
      email: 'admin@test.com',
      phone: '+216 55 111 111',
      password,
      role: 'agency_admin',
      agency: agency._id,
      isActive: true
    });
    agency.owner = agencyAdmin._id;
    await agency.save();
    console.log('✅ Agency Admin created: admin@test.com / test123');
  }

  // 3. Create Test Client
  let client = await User.findOne({ email: 'client@test.com' });
  if (!client) {
    client = await User.create({
      firstName: 'Sami',
      lastName: 'Client',
      email: 'client@test.com',
      phone: '+216 55 333 333',
      password,
      role: 'user',
      agency: null,
      isActive: true
    });
    console.log('✅ Client created: client@test.com / test123');
  }

  console.log('\n========== TEST ACCOUNTS ==========');
  console.log('Agency Admin: admin@test.com / test123');
  console.log('Client:       client@test.com / test123');
  console.log('====================================\n');

  await mongoose.disconnect();
  console.log('Done!');
};

seedTestUsers().catch(console.error);
