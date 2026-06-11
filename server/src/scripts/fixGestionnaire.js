/**
 * One-time fix: link gestionnaire "new new" (emihakima@gmail.com)
 * to the aramax agency so they can see its merchants.
 *
 * Run from the server/ directory:
 *   node src/scripts/fixGestionnaire.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
require('../models/UserApiSettings');
const User   = require('../models/User');
const Agency = require('../models/Agency');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armada-directions';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  // ── 1. Find the gestionnaire user ────────────────────────────────────────────
  const user = await User.findOne({ email: 'emihakima@gmail.com' });
  if (!user) {
    console.error('❌ User emihakima@gmail.com not found');
    process.exit(1);
  }
  console.log('\nUser found:');
  console.log('  _id:   ', user._id);
  console.log('  name:  ', user.firstName, user.lastName);
  console.log('  role:  ', user.role);
  console.log('  agency:', user.agency ?? 'NULL');

  // ── 2. Find the aramax agency ─────────────────────────────────────────────────
  const agency = await Agency.findOne({ name: /aramax/i });
  if (!agency) {
    console.error('❌ No agency matching /aramax/i found. Available agencies:');
    const all = await Agency.find({}, 'name _id').limit(10);
    all.forEach(a => console.log(' -', a.name, a._id));
    process.exit(1);
  }
  console.log('\nAgency found:');
  console.log('  _id: ', agency._id);
  console.log('  name:', agency.name);

  // ── 3. Check if already linked ────────────────────────────────────────────────
  if (user.agency?.toString() === agency._id.toString()) {
    console.log('\n✅ User already linked to the correct agency — no change needed.');
    process.exit(0);
  }

  // ── 4. Apply the fix ──────────────────────────────────────────────────────────
  const prevAgency = user.agency;
  user.agency = agency._id;
  if (user.role !== 'gestionnaire_agency') {
    console.log(`  role was "${user.role}" → setting to "gestionnaire_agency"`);
    user.role = 'gestionnaire_agency';
  }
  await user.save();

  console.log('\n✅ Fixed!');
  console.log('  agency:', prevAgency ?? 'NULL', '→', user.agency.toString());
  console.log('  role:  ', user.role);

  // ── 5. Confirm team membership ────────────────────────────────────────────────
  const inTeam = agency.team?.some(t => t.user?.toString() === user._id.toString());
  if (!inTeam) {
    console.log('\n⚠️  User is NOT in agency.team — adding them now...');
    await Agency.findByIdAndUpdate(agency._id, {
      $push: {
        team: {
          user:        user._id,
          role:        'manager',
          permissions: {
            merchants:  true,
            drivers:    true,
            deliveries: true,
            statistics: false,
            finances:   false,
            settings:   false,
            team:       false,
          },
          addedAt: new Date(),
        },
      },
    });
    console.log('  ✅ Added to team.');
  } else {
    console.log('\n✅ User is already in agency.team.');
  }
}

run()
  .catch(err => {
    console.error('Script failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
