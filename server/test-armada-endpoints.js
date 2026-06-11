/**
 * Run: node test-armada-endpoints.js
 * api.armadadelivery.com IS the real API — now finding the correct path.
 */
const axios = require('axios');

const API_KEY = 'main_2c0ac0f0c7804c9ae457b37mo75ua3y';
const BASE    = 'https://api.armadadelivery.com';

const BODY = {
  customer_name:  'Test Client',
  customer_phone: '+96550000000',
  city:           'Kuwait City',
  amount:         10,
  payment_type:   'paid',
};

const HEADERS_BEARER = {
  Authorization:  `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Accept:         'application/json',
};

async function tryPost(path, headers = HEADERS_BEARER) {
  const url = `${BASE}${path}`;
  try {
    const res = await axios({ method: 'POST', url, headers, data: BODY, timeout: 8000 });
    console.log(`  ✅ ${res.status} POST ${path}`, JSON.stringify(res.data).substring(0, 300));
    return true;
  } catch (err) {
    const s    = err.response?.status ?? err.code ?? 'ERR';
    const body = JSON.stringify(err.response?.data ?? err.message).substring(0, 200);
    console.log(`  ❌ ${s} POST ${path}  ${body}`);
    return false;
  }
}

async function tryGet(path) {
  const url = `${BASE}${path}`;
  try {
    const res = await axios({ method: 'GET', url, headers: HEADERS_BEARER, timeout: 8000 });
    console.log(`  ✅ ${res.status} GET  ${path}`, JSON.stringify(res.data).substring(0, 200));
  } catch (err) {
    const s    = err.response?.status ?? err.code ?? 'ERR';
    const body = JSON.stringify(err.response?.data ?? err.message).substring(0, 200);
    console.log(`  ❌ ${s} GET  ${path}  ${body}`);
  }
}

(async () => {
  console.log(`Base: ${BASE}\n`);

  // -- Discover what paths exist (GET probe) --
  console.log('=== GET probes (discover available paths) ===');
  for (const p of ['/', '/v1', '/v2', '/api', '/orders', '/deliveries', '/health', '/ping']) {
    await tryGet(p);
  }

  // -- POST on every plausible path --
  console.log('\n=== POST attempts ===');
  const paths = [
    '/orders',
    '/deliveries',
    '/v1/orders',
    '/v1/deliveries',
    '/v2/orders',
    '/v2/deliveries',
    '/api/orders',
    '/api/deliveries',
    '/api/v1/orders',
    '/api/v1/deliveries',
    '/api/v2/orders',
    '/api/v2/deliveries',
  ];

  for (const p of paths) {
    const ok = await tryPost(p);
    if (ok) { console.log(`\n🎯  WORKING:  POST ${BASE}${p}`); break; }
  }

  // -- Try alternative auth on the most likely path --
  console.log('\n=== Auth variants on /api/v2/orders ===');
  await tryPost('/api/v2/orders', { 'X-API-Key': API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' });
  await tryPost('/api/v2/orders', { Authorization: API_KEY,    'Content-Type': 'application/json', Accept: 'application/json' });
  await tryPost('/api/v2/orders', { Authorization: `Token ${API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' });
})();
