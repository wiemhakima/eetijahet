/**
 * Backfill script: generate tracking_token for deliveries that don't have one.
 * Run once: node src/scripts/backfillTrackingTokens.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Delivery = require('../models/Delivery');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const cursor = Delivery.find({ tracking_token: { $exists: false } }).cursor();
  let updated = 0;

  for await (const doc of cursor) {
    doc.tracking_token = randomUUID();
    await doc.save({ validateModifiedOnly: true });
    updated++;
    if (updated % 100 === 0) console.log(`  ${updated} updated…`);
  }

  console.log(`Done — ${updated} deliveries backfilled.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
