// Run with: node tests/browser.mjs [path-to-playwright/index.mjs]
// Requires a running local server and Playwright/Chromium. All external requests are mocked.
import assert from 'node:assert/strict';
const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch({ headless: true });
const base = 'http://localhost:8000';
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions++; };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let failRegistration = false, registration;
  await context.route('https://**/*', route => {
    const url = route.request().url();
    if (url.includes('docs.google.com')) return route.fulfill({ contentType: 'text/csv', body: 'Slot,Available\n"Morning, 10 AM",TRUE\nEvening,FALSE\n6 PM,TRUE' });
    if (url.includes('script.google.com')) {
      registration = JSON.parse(route.request().postData());
      return failRegistration ? route.abort() : route.fulfill({ body: 'ok' });
    }
    return route.abort();
  });
  await page.goto(base + '/#workshops');
  await page.locator('[data-enroll]').click();
  check(await page.locator('#enroll-dialog').evaluate(el => el.open), 'enrollment opens');
  check(await page.locator('#order-total').textContent() === '₹1,499', 'course price');
  await page.locator('[name=kit]').check();
  await page.locator('[name=tshirt]').check();
  check(await page.locator('#order-total').textContent() === '₹2,497', 'both add-on prices');
  check(await page.locator('#address-fields').isVisible(), 'address shown');
  await page.locator('[name=kit]').uncheck();
  await page.locator('[name=tshirt]').uncheck();
  check(await page.locator('#address-fields').evaluate(el => el.disabled), 'hidden shipping does not block validation');
  await page.locator('#enroll-form [name=name]').fill('Test Doodler');
  await page.locator('#enroll-form [name=age]').fill('25');
  await page.locator('#enroll-form [name=phone]').fill('+91 9876543210');
  await page.locator('#enroll-form [name=terms]').check();
  await page.locator('#pay-button').click();
  await page.waitForFunction(() => document.querySelector('#payment-fallback a'));
  check((await page.locator('#enroll-form .form-status').textContent()).includes('Could not load'), 'checkout script failure fallback');
  await page.locator('#checkout-policies').click();
  check(await page.locator('#policies-dialog').evaluate(el => el.open), 'nested policies open');
  await page.keyboard.press('Escape');
  check(await page.locator('#enroll-dialog').evaluate(el => el.open), 'escape closes only top dialog');
  await page.keyboard.press('Escape');

  await page.locator('#doodleCanvas').scrollIntoViewIfNeeded();
  const canvas = await page.locator('#doodleCanvas').boundingBox();
  const cx = canvas.x + canvas.width / 2, cy = canvas.y + canvas.height / 2;
  await page.mouse.move(cx + 65, cy); await page.mouse.down();
  for (let i = 1; i <= 50; i++) { const angle = i / 50 * Math.PI * 2; await page.mouse.move(cx + Math.cos(angle) * 65, cy + Math.sin(angle) * 65); }
  await page.mouse.up();
  check(await page.locator('.reward').isVisible(), 'circle unlocks reward');
  await page.locator('.reward button').click();
  check(await page.locator('#order-total').textContent() === '₹1,349', 'discount is applied');
  await page.keyboard.press('Escape');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  check((await downloadPromise).suggestedFilename() === 'my-living-doodle.png', 'canvas PNG export');
  await page.locator('#clearCanvas').click();
  check(await page.locator('.reward').isVisible(), 'clearing preserves earned reward');

  await page.locator('.art-thumb').first().click();
  check(await page.locator('#gallery-dialog').evaluate(el => el.open), 'lightbox opens');
  const first = await page.locator('#gallery-count').textContent();
  await page.keyboard.press('ArrowRight');
  check(await page.locator('#gallery-count').textContent() !== first, 'gallery keyboard navigation');
  await page.keyboard.press('Escape');
  check(await page.locator('.art-thumb').first().evaluate(el => el === document.activeElement), 'focus restored after lightbox');
  await page.locator('[data-notify]').click();
  await page.locator('#notify-form [name=email]').fill('test@example.com');
  await page.locator('#notify-form [name=phone]').fill('9876543210');
  await page.locator('#notify-form [type=checkbox]').check();
  failRegistration = true;
  await page.locator('#notify-form [type=submit]').click();
  await page.waitForFunction(() => document.querySelector('#notify-form .form-status').dataset.error === 'true');
  check(await page.locator('#notify-form [type=submit]').isEnabled(), 'network error allows retry');
  failRegistration = false;
  await page.locator('#notify-form [type=submit]').click();
  await page.waitForFunction(() => document.querySelector('#notify-form [type=submit]').textContent === 'Request sent');
  check(registration.type === 'notify' && registration.email === 'test@example.com', 'notify contract');
  await page.keyboard.press('Escape');

  await page.goto(base + '/webinar/');
  await page.waitForFunction(() => document.querySelector('[name=slot]').options.length === 3);
  check(await page.locator('#webinar-form [name=slot] option').nth(1).textContent() === 'Morning, 10 AM', 'CSV parser handles quoted commas');
  await page.locator('#webinar-form [name=name]').fill('Test Doodler');
  await page.locator('#webinar-form [name=age]').fill('25');
  await page.locator('#webinar-form [name=email]').fill('test@example.com');
  await page.locator('#webinar-form [name=phone]').fill('9876543210');
  await page.locator('#webinar-form [name=date]').fill('2099-10-01');
  await page.locator('#webinar-form [name=slot]').selectOption('6 PM');
  await page.locator('#webinar-form [type=checkbox]').check();
  await page.locator('#webinar-form [type=submit]').click();
  check((await page.locator('.contact-fallback').getAttribute('href')).includes('2099-10-01'), 'webinar sends chosen details to explicit contact fallback');

  await page.goto(base + '/workshop/');
  await page.locator('#workshop-form [name=name]').fill('Test Doodler');
  await page.locator('#workshop-form [name=email]').fill('test@example.com');
  await page.locator('#workshop-form [name=phone]').fill('9876543210');
  await page.locator('#workshop-form [name=track]').selectOption('family');
  await page.locator('#workshop-form [type=checkbox]').check();
  await page.locator('#workshop-form [type=submit]').click();
  await page.waitForFunction(() => document.querySelector('#workshop-form [type=submit]').textContent === 'Request sent');
  check(registration.type === 'workshop' && registration.track === 'family', 'workshop contract');

  // Mock the gateway itself; never charge or contact a real service.
  await page.goto(base + '/#workshops');
  await page.evaluate(() => { window.Razorpay = class { constructor(options) { window.checkoutOptions = options; } on() {} open() { window.checkoutOptions.handler({ razorpay_payment_id: 'pay_mock', razorpay_order_id: 'order_mock', razorpay_signature: 'test' }); } }; });
  await page.locator('[data-enroll]').click();
  await page.locator('#enroll-form [name=name]').fill('Test Doodler');
  await page.locator('#enroll-form [name=age]').fill('25');
  await page.locator('#enroll-form [name=phone]').fill('9876543210');
  await page.locator('#enroll-form [name=terms]').check();
  await page.locator('#pay-button').click();
  await page.waitForFunction(() => document.querySelector('#pay-button').textContent === 'Payment reported ✓');
  check(await page.locator('#pay-button').isDisabled(), 'successful payment cannot charge again');
  await page.waitForFunction(() => document.querySelector('#enroll-dialog').open);
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/#top');
  await page.waitForFunction(() => !!document.querySelector('.gallery-marquee'));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) console.log(await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !el.closest('.gallery-marquee') && !el.closest('svg'); }).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })).slice(0, 30) })));
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'home has no mobile overflow');
  await page.locator('#menu').click();
  check(await page.locator('#menu').getAttribute('aria-expanded') === 'true', 'mobile navigation opens');
  await page.locator('#nav a[href="#gallery"]').click();
  check(await page.locator('#menu').getAttribute('aria-expanded') === 'false', 'mobile navigation closes on selection');
  await page.screenshot({ path: '/tmp/doodoodle-mobile.png', fullPage: true });
  await page.locator('[data-enroll]').click();
  check(await page.locator('#enroll-dialog').evaluate(el => el.scrollWidth <= el.clientWidth), 'checkout fits mobile viewport');
  await page.screenshot({ path: '/tmp/doodoodle-checkout.png' });
  await page.keyboard.press('Escape');
  for (const path of ['/webinar/', '/workshop/']) {
    await page.goto(base + path);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path + ' fits mobile');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/#workshops');
  await page.screenshot({ path: '/tmp/doodoodle-desktop.png', fullPage: true });
  check(errors.length === 0, 'no browser errors: ' + errors.join(', '));
  const animatedContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await animatedContext.route('https://**/*', route => route.abort());
  const animated = await animatedContext.newPage();
  animated.on('pageerror', error => errors.push(error.message));
  await animated.goto(base + '/');
  await animated.locator('.intro-skip').click();
  await animated.waitForFunction(() => !document.documentElement.classList.contains('intro-active'));
  check(true, 'intro skip releases page');
  await animated.locator('[data-select=fish]').click();
  check(await animated.locator('#artStage').getAttribute('data-shape') === 'fish', 'manual hero selection');
  await animated.getByRole('button', { name: 'Pause gallery', exact: true }).click();
  check(await animated.locator('.gallery-marquee').evaluate(el => el.classList.contains('paused')), 'animated gallery can pause');
  await animated.locator('[data-review="2"]').click();
  check(await animated.locator('.review').nth(2).isVisible(), 'review selector works with motion enabled');
  await animated.evaluate(() => { window.Razorpay = class { constructor(options) { window.checkoutOptions = options; } on() {} open() { window.checkoutOptions.modal.ondismiss(); } }; });
  await animated.locator('[data-enroll]').click();
  await animated.locator('#enroll-form [name=name]').fill('Test Doodler');
  await animated.locator('#enroll-form [name=age]').fill('25');
  await animated.locator('#enroll-form [name=phone]').fill('9876543210');
  await animated.locator('#enroll-form [name=terms]').check();
  await animated.locator('#pay-button').click();
  await animated.waitForFunction(() => document.querySelector('#enroll-dialog').open && document.querySelector('#enroll-form .form-status').textContent.includes('Checkout closed'));
  check(await animated.locator('#pay-button').isEnabled(), 'checkout cancellation permits retry');
  await animated.route('https://script.google.com/**', route => route.abort());
  await animated.evaluate(() => { window.Razorpay = class { constructor(options) { window.checkoutOptions = options; } on() {} open() { window.checkoutOptions.handler({ razorpay_payment_id: 'pay_mock', razorpay_order_id: 'order_mock', razorpay_signature: 'test' }); } }; });
  await animated.locator('#pay-button').click();
  await animated.waitForFunction(() => document.querySelector('.purchase-delivery-note')?.textContent.includes('couldn’t send'));
  check(await animated.locator('#pay-button').isDisabled(), 'failed logging never invites a duplicate charge');
  check((await animated.locator('.purchase-reference').textContent()).includes('pay_mock'), 'failed logging preserves the payment reference');
  check(errors.length === 0, 'no errors with motion enabled: ' + errors.join(', '));
  console.log(`Passed ${assertions} browser checks. External requests were mocked; no payments or registrations were sent.`);
} finally { await browser.close(); }
