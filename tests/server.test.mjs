import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { makeServer, priceOrder, validSignature } from '../server.mjs';

const enrollment = { name: 'Test Doodler', phone: '+91 9876543210', age: '25', plan: 'lifetime', kit: false, tshirt: false, terms: 'on', coupon: '', attempt: 'test-attempt-12345678' };
const env = { RAZORPAY_KEY_ID: 'rzp_test_example', RAZORPAY_KEY_SECRET: 'test-secret', SITE_ORIGIN: 'http://localhost:8000' };
test('server calculates course, discount and every add-on combination', () => {
  for (const coupon of ['', 'FIRSTMARK']) for (const kit of [false, true]) for (const tshirt of [false, true]) {
    const result = priceOrder({ ...enrollment, coupon, kit, tshirt, tshirt_size: 'M', address: 'Test street', city: 'Kochi', state: 'Kerala', pin: '682001', amount: 1 });
    assert.equal(result.amount, 149900 - (coupon ? 15000 : 0) + (kit ? 49900 : 0) + (tshirt ? 49900 : 0));
  }
});
test('rejects invalid contact, tampered plans and incomplete delivery', () => {
  for (const change of [{ name: ' ' }, { phone: '123' }, { age: '0' }, { age: '2.5' }, { plan: 'free' }, { coupon: 'EVERYTHINGFREE' }, { terms: false }, { kit: 'false' }, { tshirt: true }, { kit: true, address: 'x', city: 'x', state: 'x', pin: '123' }]) assert.throws(() => priceOrder({ ...enrollment, ...change }));
});
test('payment signature must match both order and payment', () => {
  const signature = createHmac('sha256', env.RAZORPAY_KEY_SECRET).update('order_123|pay_123').digest('hex');
  assert.ok(validSignature('order_123', 'pay_123', signature, env.RAZORPAY_KEY_SECRET));
  assert.equal(validSignature('order_999', 'pay_123', signature, env.RAZORPAY_KEY_SECRET), false);
  assert.equal(validSignature('order_123', 'pay_123', 'bad', env.RAZORPAY_KEY_SECRET), false);
});
test('does not silently truncate delivery addresses in gateway notes', () => {
  assert.throws(() => priceOrder({ ...enrollment, kit: true, address: 'a'.repeat(257), city: 'Kochi', state: 'Kerala', pin: '682001' }), /256 characters/);
});

async function serve(t, options) {
  const server = makeServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  return { base, post: (path, data, origin = env.SITE_ORIGIN) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(data) }) };
}
test('static server exposes pages and assets but never private files', async t => {
  const { base, post } = await serve(t, { env: {} });
  for (const path of ['/', '/webinar/', '/workshop/', '/assets/features.js', '/assets/gallery/d7m9owb9ynclua3rpbqq.webp']) assert.equal((await fetch(base + path)).status, 200, path);
  for (const path of ['/.env', '/server.mjs', '/tests/server.test.mjs', '/assets/../.env', '/assets/%2e%2e%2f.env']) assert.equal((await fetch(base + path)).status, 404, path);
  assert.equal((await post('/api/orders', enrollment)).status, 503);
});
test('creates gateway orders once per attempt and rejects changed data and origins', async t => {
  let calls = 0;
  const { post } = await serve(t, { env, fetchImpl: async (url, options) => { calls++; const body = JSON.parse(options.body); assert.equal(body.amount, 149900); return Response.json({ id: 'order_123', amount: body.amount }); } });
  for (let i = 0; i < 2; i++) { const response = await post('/api/orders', enrollment); assert.equal(response.status, 200); assert.equal((await response.json()).id, 'order_123'); }
  assert.equal(calls, 1);
  assert.equal((await post('/api/orders', { ...enrollment, coupon: 'FIRSTMARK' })).status, 409);
  assert.equal((await post('/api/orders', enrollment, 'https://untrusted.example')).status, 403);
});
test('confirms captured payments only, verifies amounts and exports once', async t => {
  let captured = false, mismatch = false, exports = 0;
  const { post } = await serve(t, { env: { ...env, ENROLLMENT_SCRIPT_URL: 'https://example.test/export' }, fetchImpl: async url => {
    if (url.endsWith('/export')) { exports++; return new Response('ok'); }
    if (url.includes('/orders/')) return Response.json({ amount: 149900, notes: { source: 'doodoodle-website', name: 'Test' } });
    return Response.json({ order_id: 'order_123', amount: mismatch ? 1 : 149900, currency: 'INR', status: captured ? 'captured' : 'authorized' });
  } });
  const payload = { razorpay_order_id: 'order_123', razorpay_payment_id: 'pay_123', razorpay_signature: createHmac('sha256', env.RAZORPAY_KEY_SECRET).update('order_123|pay_123').digest('hex') };
  assert.equal((await (await post('/api/verify', payload)).json()).captured, false);
  assert.equal(exports, 0);
  captured = true;
  for (let i = 0; i < 2; i++) assert.equal((await (await post('/api/verify', payload)).json()).captured, true);
  assert.equal(exports, 1);
  mismatch = true;
  assert.equal((await post('/api/verify', payload)).status, 400);
  assert.equal((await post('/api/verify', { ...payload, razorpay_signature: 'bad' })).status, 400);
});
test('gateway errors remain retryable', async t => {
  let fails = true;
  const { post } = await serve(t, { env, fetchImpl: async () => fails ? new Response('', { status: 502 }) : Response.json({ id: 'order_123', amount: 149900 }) });
  assert.equal((await post('/api/orders', enrollment)).status, 502);
  fails = false;
  assert.equal((await post('/api/orders', enrollment)).status, 200);
});
