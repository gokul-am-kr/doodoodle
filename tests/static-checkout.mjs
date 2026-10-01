// node tests/static-checkout.mjs /path/to/playwright/index.mjs
// All external traffic is mocked. No payments or spreadsheet writes are made.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch();
try {
  for (const url of ['http://localhost:8000/', pathToFileURL(resolve('index.html')).href]) {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    let exports = [], failExport = false, apiCalls = 0;
    await page.route('**/api/**', route => { apiCalls++; return route.abort(); });
    await page.route('https://**/*', route => {
      if (route.request().url().includes('script.google.com')) {
        exports.push(JSON.parse(route.request().postData()));
        return failExport ? route.abort() : route.fulfill({ body: 'ok' });
      }
      return route.abort();
    });
    await page.goto(url);
    await page.evaluate(() => {
      window.mockHandlers = {};
      window.mockOpens = 0;
      window.Razorpay = class {
        constructor(options) { window.mockOptions = options; }
        on(name, callback) { window.mockHandlers[name] = callback; }
        open() { window.mockOpens++; }
      };
    });
    await page.locator('[data-enroll]').click();
    await page.locator('#enroll-form [name=name]').fill('Test Doodler');
    await page.locator('#enroll-form [name=age]').fill('25');
    await page.locator('#enroll-form [name=phone]').fill('9876543210');
    await page.locator('#enroll-form [name=terms]').check();
    for (const [kit, tee, amount] of [[false,false,149900],[true,false,199800],[false,true,199800],[true,true,249700]]) {
      await page.locator('[name=kit]').setChecked(kit);
      await page.locator('[name=tshirt]').setChecked(tee);
      if (tee) await page.locator('[name=tshirt_size]').selectOption('M');
      if (kit || tee) for (const [name,value] of Object.entries({address:'Test street',city:'Kochi',state:'Kerala',pin:'682001'})) await page.locator(`#enroll-form [name=${name}]`).fill(value);
      await page.locator('#pay-button').click();
      const options = await page.evaluate(() => ({amount:window.mockOptions.amount,key:window.mockOptions.key,order:window.mockOptions.order_id}));
      assert.equal(options.amount, amount);
      assert.equal(options.key, 'rzp_live_SR4M6CNZ1exEnX');
      assert.equal(options.order, undefined);
      assert.equal(await page.locator('#enroll-dialog').evaluate(el => el.open), false);
      await page.evaluate(() => window.mockOptions.modal.ondismiss());
      assert.equal(await page.locator('#pay-button').isEnabled(), true);
    }
    await page.locator('#pay-button').click();
    await page.evaluate(() => window.mockHandlers['payment.failed']({error:{description:'Mock decline',metadata:{payment_id:'pay_failed_mock'}}}));
    await page.waitForTimeout(100);
    assert.equal(exports.at(-1).status, 'FAILED');
    await page.evaluate(() => window.mockOptions.modal.ondismiss());
    failExport = true;
    await page.locator('#pay-button').click();
    await page.evaluate(() => window.mockOptions.handler({razorpay_payment_id:'pay_success_mock'}));
    assert.equal(exports.at(-1).total_amount, '₹2,497');
    assert.equal(exports.at(-1).tshirt_size, 'M');
    assert.equal(exports.at(-1).verification, 'browser_callback_unverified');
    assert.equal(await page.locator('#pay-button').isDisabled(), true);
    assert.equal(await page.locator('#enroll-form').isVisible(), false);
    assert.match(await page.locator('.purchase-message').textContent(), /Payment successful.*connect with you shortly/);
    assert.match(await page.locator('.purchase-delivery-note').textContent(), /couldn’t send/);
    assert.equal(await page.locator('.purchase-reference').textContent(), 'pay_success_mock');
    const count = exports.length;
    await page.evaluate(() => window.mockOptions.handler({razorpay_payment_id:'pay_success_mock'}));
    assert.equal(exports.length, count, 'duplicate callbacks do not log twice');
    assert.equal(apiCalls, 0, 'no local backend requests');
    console.log('PASS static checkout:', new URL(url).protocol, 'totals, cancellation, failure, success, logging failure and duplicate callback');
    await page.close();
  }
} finally { await browser.close(); }
