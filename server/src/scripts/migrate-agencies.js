/**
 * Migration: bootstrap the SaaS agency model.
 *
 * What this script does:
 *   1. Creates a default Agency "Société Etijahat"
 *   2. Creates an Enterprise subscription for that agency (active, no expiry)
 *   3. Assigns ALL existing drivers (role: 'driver') to that agency
 *   4. Does NOT touch users, developers, or admins
 *
 * Run once after deploying the new schema:
 *   node src/scripts/migrate-agencies.js
 *
 * Safe to re-run: uses upsert / idempotent checks.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Load models ────────────────────────────────────────────────────────────────
// Register all models so refs resolve correctly
require('../models/UserApiSettings');
const User         = require('../models/User');
const Agency       = require('../models/Agency');
const Subscription = require('../models/Subscription');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armada-directions';
const DEFAULT_AGENCY_NAME  = 'Société Etijahat';
const DEFAULT_AGENCY_EMAIL = 'admin@etijahat.com';
const DEFAULT_PLAN = 'enterprise';

async function run() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected.\n');

  // ── 1. Find or create the default agency ──────────────────────────────────

  let agency = await Agency.findOne({ email: DEFAULT_AGENCY_EMAIL });

  if (agency) {
    console.log(`[SKIP] Agency already exists: "${agency.name}" (${agency._id})`);
  } else {
    // Find an existing admin user to set as owner, or use null
    const adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });

    agency = await Agency.create({
      name:   DEFAULT_AGENCY_NAME,
      email:  DEFAULT_AGENCY_EMAIL,
      slug:   'societe-etijahat',
      status: 'active',
      owner:  adminUser ? adminUser._id : new mongoose.Types.ObjectId(), // placeholder if no admin
      settings: {
        maxDrivers:       -1,   // unlimited (Enterprise)
        maxDeliveries:    -1,
        apiAccess:        true,
        apiRequestsLimit: -1,
      },
    });
    console.log(`[CREATE] Agency created: "${agency.name}" (${agency._id})`);
  }

  // ── 2. Find or create Enterprise subscription for that agency ─────────────

  let subscription = await Subscription.findOne({ agency: agency._id });

  if (subscription) {
    console.log(`[SKIP] Subscription already exists for this agency: ${subscription.plan} / ${subscription.status}`);
  } else {
    const far = new Date('2099-12-31');
    subscription = await Subscription.create({
      agency:             agency._id,
      plan:               DEFAULT_PLAN,
      billing:            'annual',
      status:             'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd:   far,
    });
    console.log(`[CREATE] Subscription created: ${DEFAULT_PLAN} / active until ${far.toDateString()}`);

    // Link subscription back to agency
    agency.subscription = subscription._id;
    await agency.save();
  }

  // ── 3. Attach all existing drivers to this agency ─────────────────────────

  // Temporarily disable the agency-required validator so we can bulk-update
  // (drivers with agency=null would fail the new validator in a normal .save())
  const result = await User.updateMany(
    { role: 'driver', $or: [{ agency: null }, { agency: { $exists: false } }] },
    { $set: { agency: agency._id } }
  );

  console.log(`[UPDATE] ${result.modifiedCount} driver(s) linked to "${DEFAULT_AGENCY_NAME}"`);

  // ── 4. Verify — print summary ──────────────────────────────────────────────

  const [totalDrivers, linkedDrivers, totalClients, totalDevs] = await Promise.all([
    User.countDocuments({ role: 'driver' }),
    User.countDocuments({ role: 'driver', agency: agency._id }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'developer' }),
  ]);

  console.log('\n── Summary ──────────────────────────────────────────────');
  console.log(`  Agency       : ${agency.name} (${agency._id})`);
  console.log(`  Subscription : ${subscription.plan} / ${subscription.status}`);
  console.log(`  Drivers total: ${totalDrivers}  →  linked: ${linkedDrivers}`);
  console.log(`  Clients      : ${totalClients}  (untouched)`);
  console.log(`  Developers   : ${totalDevs}  (untouched)`);
  console.log('─────────────────────────────────────────────────────────\n');
  console.log('Migration complete.');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
