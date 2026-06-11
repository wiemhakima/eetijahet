/**
 * Isolated email test — run from /server:
 *   node test-email.js
 *
 * Tests sendDispatchedEmail() directly, bypassing all HTTP/driver logic.
 * If this succeeds → SMTP config is fine, bug is in the trigger (hook).
 * If this fails    → SMTP config is broken, fix .env / Gmail settings first.
 */
require('dotenv').config();

console.log('─── SMTP Config ───────────────────────────────────');
console.log('EMAIL_HOST :', process.env.EMAIL_HOST  || '(not set)');
console.log('EMAIL_PORT :', process.env.EMAIL_PORT  || '(not set)');
console.log('EMAIL_USER :', process.env.EMAIL_USER  || '(not set)');
console.log('EMAIL_PASS :', process.env.EMAIL_PASS  ? `${process.env.EMAIL_PASS.slice(0,4)}…` : '(not set)');
console.log('EMAIL_FROM :', process.env.EMAIL_FROM  || '(not set)');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '(not set)');
console.log('───────────────────────────────────────────────────\n');

const emailService = require('./src/services/emailService');

const TEST_EMAIL = process.env.EMAIL_USER; // sends to yourself
const FAKE_TOKEN = 'test-token-00000000-0000-0000-0000-000000000000';

async function run() {
  console.log(`Sending test email to: ${TEST_EMAIL} …\n`);

  const result = await emailService.sendDispatchedEmail(
    TEST_EMAIL,
    'Test Client',
    FAKE_TOKEN
  );

  if (result.success) {
    console.log('\n✅ SUCCESS — email sent.');
    console.log('→ SMTP config is working.');
    console.log('→ If you still get no email in workflow, bug is in the trigger (hook).');
  } else {
    console.log('\n❌ FAILED:', result.error);
    console.log('→ Fix SMTP config before debugging the trigger.');
  }
}

run().catch((err) => {
  console.error('\n❌ Unexpected error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
