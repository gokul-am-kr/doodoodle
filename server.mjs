import { createServer } from 'node:http';
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const sizes = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8', '.PNG': 'image/png' };
const compress = promisify(gzip);
class RequestError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function priceOrder(data) {
  const clean = (key, max = 160) => typeof data[key] === 'string' ? data[key].trim().slice(0, max) : '';
  const name = clean('name', 100), phone = clean('phone', 20), age = Number(data.age);
  if (!name || !Number.isInteger(age) || age < 1 || age > 120 || !/^\+?[\d\s()-]{10,20}$/.test(phone) || phone.replace(/\D/g, '').length < 10) throw new RequestError('Enter a valid name, age and mobile number.');
  if (data.plan !== 'lifetime' || !['', 'FIRSTMARK'].includes(data.coupon || '')) throw new RequestError('Choose a valid course and discount.');
  if (data.terms !== 'on' && data.terms !== true) throw new RequestError('Please accept the course terms.');
  if (typeof data.kit !== 'boolean' || typeof data.tshirt !== 'boolean') throw new RequestError('Choose valid add-ons.');
  if (data.tshirt && !sizes.has(data.tshirt_size)) throw new RequestError('Choose a T-shirt size.');
  const shipping = data.kit || data.tshirt;
  if (shipping && clean('address', 501).length > 256) throw new RequestError('Keep the street address within 256 characters; enter the city and state separately.');
  if (shipping && (!clean('address', 500) || !clean('city', 100) || !clean('state', 100) || !/^\d{6}$/.test(clean('pin')))) throw new RequestError('Complete the delivery address and six-digit PIN code.');
  const amount = 149900 - (data.coupon === 'FIRSTMARK' ? 15000 : 0) + (data.kit ? 49900 : 0) + (data.tshirt ? 49900 : 0);
  return { amount, notes: {
    name, age: String(age), phone, plan: 'lifetime', kit: data.kit ? 'Yes' : 'No', tshirt: data.tshirt ? 'Yes' : 'No',
    tshirt_size: data.tshirt ? data.tshirt_size : 'N/A',
    // Razorpay notes are limited to 256 characters per value. Keep address components separate.
    address: shipping ? clean('address', 256) : 'N/A', city: shipping ? clean('city', 100) : '', state: shipping ? clean('state', 100) : '', pin: shipping ? clean('pin') : '',
    coupon: data.coupon || '', total_amount: '₹' + (amount / 100).toLocaleString('en-IN')
  } };
}

export function validSignature(orderId, paymentId, signature, secret) {
  if (!/^[a-f0-9]{64}$/i.test(signature || '')) return false;
  const expected = createHmac('sha256', secret).update(orderId + '|' + paymentId).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

async function body(req) {
  let text = '';
  for await (const part of req) { text += part; if (Buffer.byteLength(text) > 12000) throw new RequestError('Request is too large.', 413); }
  try { const value = JSON.parse(text); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value; } catch { throw new RequestError('Invalid request.'); }
}
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}

export function makeServer({ env = process.env, fetchImpl = fetch } = {}) {
  const attempts = new Map(), reports = new Map(), rate = new Map();
  async function razorpay(path, options = {}) {
    const response = await fetchImpl('https://api.razorpay.com/v1/' + path, { ...options, headers: { Authorization: 'Basic ' + Buffer.from(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET).toString('base64'), 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new RequestError('The payment service is unavailable. Please try again shortly.', 502);
    return response.json();
  }
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'POST') throw new RequestError('Use POST for this endpoint.', 405);
        const origin = req.headers.origin;
        const allowed = env.SITE_ORIGIN || `http://localhost:${env.PORT || 8000}`;
        if (origin && origin !== allowed) throw new RequestError('This origin is not permitted.', 403);
        if (req.headers['sec-fetch-site'] === 'cross-site') throw new RequestError('Cross-site request denied.', 403);
        if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new RequestError('Send JSON.', 415);
        const now = Date.now();
        for (const [key, value] of rate) if (now - value.start > 60000) rate.delete(key);
        for (const [key, value] of attempts) if (now - value.time > 3600000) attempts.delete(key);
        for (const [key, value] of reports) if (now - value > 86400000) reports.delete(key);
        const ip = req.socket.remoteAddress;
        const limit = rate.get(ip) || { start: now, count: 0 };
        rate.set(ip, limit);
        if (++limit.count > 30) throw new RequestError('Too many requests. Please wait a minute.', 429);
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new RequestError('Online checkout is not available yet. Please contact us to complete your enrolment.', 503);
        const data = await body(req);
        if (url.pathname === '/api/orders') {
          const order = priceOrder(data);
          if (typeof data.attempt !== 'string' || !/^[a-z0-9-]{16,64}$/i.test(data.attempt)) throw new RequestError('Invalid checkout attempt.');
          const fingerprint = JSON.stringify(order);
          const prior = attempts.get(data.attempt);
          if (prior && prior.fingerprint !== fingerprint) throw new RequestError('Your selections changed. Please start checkout again.', 409);
          if (!prior) {
            const pending = razorpay('orders', { method: 'POST', body: JSON.stringify({ amount: order.amount, currency: 'INR', receipt: 'dd_' + randomUUID().replaceAll('-', ''), notes: { ...order.notes, source: 'doodoodle-website' } }) });
            attempts.set(data.attempt, { fingerprint, pending, time: now });
          }
          let created;
          try { created = await attempts.get(data.attempt).pending; } catch (error) { attempts.delete(data.attempt); throw error; }
          json(res, 200, { id: created.id, amount: created.amount, key: env.RAZORPAY_KEY_ID });
          return;
        }
        if (url.pathname === '/api/verify') {
          const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = data;
          if (!/^order_[a-zA-Z0-9]+$/.test(orderId || '') || !/^pay_[a-zA-Z0-9]+$/.test(paymentId || '') || !validSignature(orderId, paymentId, signature, env.RAZORPAY_KEY_SECRET)) throw new RequestError('Payment could not be verified.', 400);
          const [order, payment] = await Promise.all([razorpay('orders/' + orderId), razorpay('payments/' + paymentId)]);
          if (payment.order_id !== orderId || payment.amount !== order.amount || payment.currency !== 'INR' || order.notes?.source !== 'doodoodle-website') throw new RequestError('Payment does not match this enrolment.', 400);
          const captured = payment.status === 'captured';
          if (captured && env.ENROLLMENT_SCRIPT_URL && !reports.has(paymentId)) {
            reports.set(paymentId, now);
            try {
              const response = await fetchImpl(env.ENROLLMENT_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ ...order.notes, address: [order.notes.address, order.notes.city, order.notes.state, order.notes.pin].filter(Boolean).join(', '), timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), status: 'SUCCESS', razorpay_payment_id: paymentId, failure_reason: 'N/A' }), signal: AbortSignal.timeout(10000) });
              if (!response.ok) throw new Error();
            } catch { reports.delete(paymentId); console.error('Enrolment export failed for payment', paymentId); }
          }
          json(res, 200, { captured, paymentId });
          return;
        }
        throw new RequestError('Endpoint not found.', 404);
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new RequestError('Method not allowed.', 405);
      let path;
      try { path = decodeURIComponent(url.pathname); } catch { throw new RequestError('Invalid path.'); }
      // Serve only the public site, never environment files, server code or tests.
      const legacyPage = /^\/old(?:\/|\/index\.html|\/(?:webinar|workshop)(?:\/|\/index\.html)?)?$/.test(path);
      const legacyAsset = /^\/old\/(?:css|js|doodle|gallery|images|my-doodles|shapes|webinar|workshop)\/.+\.(?:css|js|svg|png|webp|jpg|json)$/i.test(path) || /^\/old\/(?:curl\.svg|logo\.(?:jpg|svg))$/.test(path);
      if (!(legacyPage || legacyAsset || ['/', '/index.html', '/robots.txt', '/sitemap.xml'].includes(path) || path.startsWith('/assets/') || /^\/(webinar|workshop)(\/|\/index\.html)?$/.test(path)) || path.split('/').some(part => part.startsWith('.'))) throw new RequestError('Not found.', 404);
      if (/^\/(?:webinar|workshop|old(?:\/(?:webinar|workshop))?)$/.test(path)) { res.writeHead(301, { Location: path + '/' + url.search }); res.end(); return; }
      if (path.endsWith('/index.html')) { res.writeHead(301, { Location: path.slice(0, -10) + url.search }); res.end(); return; }
      let file = resolve(root, '.' + path);
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      file = await realpath(file);
      if (!file.startsWith(root + sep)) throw new RequestError('Not found.', 404);
      const bytes = await readFile(file);
      const etag = 'W/"' + createHash('sha256').update(bytes).digest('base64url') + '"';
      const headers = {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'public, no-cache',
        'ETag': etag,
        'Vary': 'Accept-Encoding'
      };
      if ((req.headers['if-none-match'] || '').split(',').some(value => value.trim() === etag || value.trim() === '*')) {
        res.writeHead(304, headers); res.end(); return;
      }
      const acceptsGzip = (req.headers['accept-encoding'] || '').split(',').some(value => {
        const [encoding, ...params] = value.trim().split(';');
        const quality = params.find(param => param.trim().startsWith('q='));
        return encoding === 'gzip' && (!quality || Number(quality.trim().slice(2)) > 0);
      });
      const compressible = /\.(html|js|css|svg|xml|txt)$/.test(file);
      const responseBytes = acceptsGzip && compressible && bytes.length > 1024 ? await compress(bytes) : bytes;
      if (responseBytes !== bytes) headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = responseBytes.length;
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : responseBytes);
    } catch (error) {
      const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
      if (status === 500) console.error('Request failed:', error.name);
      json(res, status, { error: status === 500 ? 'Something went wrong. Please try again.' : error.message });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8000;
  makeServer().listen(port, '127.0.0.1', () => console.log(`Doo Doodle is ready at http://localhost:${port}`));
}
