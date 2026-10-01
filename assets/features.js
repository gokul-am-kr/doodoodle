(() => {
  'use strict';
  const config = window.DOODLE_CONFIG;
  const assetRoot = new URL('.', document.currentScript?.src || window.location.href);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const money = value => '₹' + (value / 100).toLocaleString('en-IN');
  const status = (form, text, error = false) => {
    const el = $('.form-status', form);
    el.textContent = text;
    el.dataset.error = String(error);
  };
  const timestamp = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const contact = (text, label = 'Continue on WhatsApp') => {
    const link = document.createElement('a');
    link.className = 'btn secondary';
    link.href = `https://wa.me/${config.phone}?text=${encodeURIComponent(text)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = label;
    return link;
  };
  const phoneField = '<label>Mobile number<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required minlength="10" maxlength="20" placeholder="+91 98765 43210"></label>';
  const emailField = '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="160" placeholder="you@example.com"></label>';
  const nameField = '<label>Full name<input name="name" autocomplete="name" required maxlength="100"></label>';
  const ageField = '<label>Age<input name="age" type="number" min="1" max="120" step="1" required></label>';
  function dialog(id, title, body, extra = '') {
    const el = document.createElement('dialog');
    el.id = id;
    el.className = 'feature-dialog ' + extra;
    el.setAttribute('aria-labelledby', id + '-title');
    el.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><h2 id="${id}-title">${title}</h2><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></div>${body}</div>`;
    document.body.append(el);
    $('[data-close]', el).addEventListener('click', () => el.close());
    el.addEventListener('click', e => { if (e.target === el) { const r = el.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) el.close(); } });
    return el;
  }
  function validate(form) {
    $$('input, textarea', form).forEach(el => {
      el.setCustomValidity('');
      if (el.disabled) return;
      if (el.required && !el.value.trim()) el.setCustomValidity('Please complete this field.');
      if (el.name === 'phone' && !/^\+?[\d\s()-]{10,20}$/.test(el.value.trim())) el.setCustomValidity('Enter a valid mobile number, including country code if needed.');
      if (el.name === 'phone' && el.value.replace(/\D/g, '').length < 10) el.setCustomValidity('Enter at least 10 digits.');
    });
    return form.reportValidity();
  }
  document.addEventListener('input', e => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); });
  async function postRegistration(url, payload) {
    const response = await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
    if (response.type !== 'opaque' && !response.ok) throw new Error('Submission failed');
    // Apps Script's opaque response cannot prove that the spreadsheet was updated.
    return response.type === 'opaque';
  }
  function wireRegistration(form, type, endpoint) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate(form)) return;
      const button = $('[type=submit]', form);
      if (button.disabled) return;
      const label = button.textContent;
      const payload = { ...Object.fromEntries(new FormData(form)), type, timestamp: timestamp() };
      $('.contact-fallback', form)?.remove();
      if (!endpoint) {
        status(form, 'Send your request to Gokul to confirm a date and time. Your details are ready below.');
        const fallback = contact(Object.entries(payload).filter(([key]) => key !== 'timestamp').map(([key, value]) => `${key}: ${value}`).join('\n'), 'Send registration request ↗');
        fallback.classList.add('contact-fallback');
        form.append(fallback);
        return;
      }
      button.disabled = true;
      status(form, 'Sending your details…');
      try {
        const opaque = await postRegistration(endpoint, payload);
        status(form, opaque ? 'Your request was sent. Delivery could not be confirmed here; please contact us if you do not hear back.' : 'Thank you! Your request has been received.');
        button.textContent = 'Request sent';
        form.append(contact('Hi, I would like to confirm my ' + type + ' request.'));
      } catch {
        status(form, 'We couldn’t send your details. Please try again or contact us on WhatsApp.', true);
        button.disabled = false;
        button.textContent = label;
      }
    });
  }
  function confetti() {
    if (reduced.matches) return;
    for (let i = 0; i < 22; i++) {
      const img = document.createElement('img');
      img.src = new URL('illustrations/' + ['character-pencil', 'pencil-comet', 'idea-sprout', 'breathing-loop', 'story-pages'][i % 5] + '.svg', assetRoot).href;
      img.alt = '';
      img.className = 'confetti';
      img.style.left = (Math.random() * 100) + '%';
      img.style.top = '-40px';
      document.body.append(img);
      img.animate([{ transform: 'translateY(0) rotate(0deg)', opacity: 1 }, { transform: `translateY(${innerHeight + 80}px) rotate(${i * 65}deg)`, opacity: 0 }], { duration: 1600 + Math.random() * 1000, delay: Math.random() * 300 }).onfinish = () => img.remove();
    }
  }

  const policyBody = `<p>These are the terms carried over from the original Doo Doodle website.</p><details open><summary>10-day course guarantee</summary><p>Contact us within 10 days of purchase if you are not satisfied to request a full refund.</p></details><details><summary>Workshop rescheduling and no-shows</summary><p>You may request one reschedule at least 48 hours in advance, subject to availability. Participants who do not attend without notice forfeit their seat and payment.</p></details><details><summary>Sessions cancelled by Doo Doodle</summary><p>You will be offered a reschedule or credit toward a future session.</p></details><details><summary>Digital materials</summary><p>The original policy excludes refunds for digital materials, recordings and online programs after access is granted. Please contact us to clarify how this applies to the course guarantee before purchasing.</p></details><p><a href="mailto:${config.email}">${config.email}</a> · <a href="https://wa.me/${config.phone}" target="_blank" rel="noopener">WhatsApp</a></p>`;
  const policies = dialog('policies-dialog', 'Cancellation & refunds', policyBody);
  $$('a[href="#policies"], [data-policies]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); policies.showModal(); }));

  const notify = dialog('notify-dialog', 'Stay in the loop.', `<p>New batches, offers and workshops, sent to you.</p><form class="feature-form" id="notify-form">${emailField}${phoneField}<label class="check"><input type="checkbox" required><span>I’d like Doo Doodle to contact me about batches and offers.</span></label><button class="btn" type="submit">Notify me ↗</button><p class="form-status" role="status"></p></form>`);
  wireRegistration($('#notify-form'), 'notify', config.registrationUrl);
  $$('[data-notify]').forEach(el => el.addEventListener('click', () => notify.showModal()));

  const enrollment = dialog('enroll-dialog', 'Your doodle journey.', `<p>Lifetime access to the current course. The new 21-lesson edition is in preparation.</p><form class="feature-form" id="enroll-form"><div class="field-grid">${nameField}${ageField}</div>${phoneField}<fieldset><legend>Make it a little more yours · optional</legend><label class="check addon"><input type="checkbox" name="kit"><span>Art starter kit · ₹499<small>Materials to help you get started.</small></span></label><label class="check addon"><input type="checkbox" name="tshirt"><span>Doo Doodle T-shirt · ₹499<small>A little creativity to wear.</small></span></label></fieldset><fieldset id="tee-fields" hidden disabled><label>T-shirt size<select name="tshirt_size" required><option value="">Choose a size</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select></label></fieldset><fieldset id="address-fields" hidden disabled><legend>Delivery address</legend><label>Street address<textarea name="address" autocomplete="street-address" required maxlength="256"></textarea></label><div class="field-grid"><label>City<input name="city" autocomplete="address-level2" required maxlength="100"></label><label>State<input name="state" autocomplete="address-level1" required maxlength="100"></label><label>PIN code<input name="pin" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label></div><p class="form-note">Delivery within India.</p></fieldset><div class="order-summary" aria-live="polite"><div><span>Lifetime course</span><span>₹1,499</span></div><div id="discount-row" hidden><span>FIRSTMARK reward</span><span>−₹150</span></div><div id="kit-row" hidden><span>Art starter kit</span><span>₹499</span></div><div id="tee-row" hidden><span>T-shirt</span><span>₹499</span></div><div class="total"><span>Total</span><span id="order-total">₹1,499</span></div></div><label class="check"><input name="terms" type="checkbox" required><span>I agree to the <button type="button" id="checkout-policies">cancellation & refund terms</button> and to being contacted about my enrolment.</span></label><button class="btn" type="submit" id="pay-button">Continue to payment · ₹1,499</button><p class="form-status" role="status"></p><div id="payment-fallback" class="feature-actions"></div></form>`);
  const enrollForm = $('#enroll-form');
  let discounted = false;
  let processingPayment = false;
  let completedPayment = false;
  function enrollmentAmount() {
    return 149900 - (discounted ? 15000 : 0) + (enrollForm.elements.kit.checked ? 49900 : 0) + (enrollForm.elements.tshirt.checked ? 49900 : 0);
  }
  function updatePrice() {
    const kit = enrollForm.elements.kit.checked;
    const tee = enrollForm.elements.tshirt.checked;
    $('#kit-row').hidden = !kit;
    $('#tee-row').hidden = !tee;
    $('#discount-row').hidden = !discounted;
    $('#tee-fields').hidden = $('#tee-fields').disabled = !tee;
    $('#address-fields').hidden = $('#address-fields').disabled = !(kit || tee);
    const amount = enrollmentAmount();
    $('#order-total').textContent = money(amount);
    if (!processingPayment && !completedPayment) $('#pay-button').textContent = 'Continue to payment · ' + money(amount);
  }
  enrollForm.addEventListener('change', updatePrice);
  $('#checkout-policies').addEventListener('click', () => policies.showModal());
  $$('[data-enroll]').forEach(el => el.addEventListener('click', () => openEnrollment(false)));
  function openEnrollment(reward) {
    if (!processingPayment && !completedPayment) { discounted = reward; updatePrice(); status(enrollForm, ''); }
    enrollment.showModal();
  }
  let checkoutLoader;
  function showPurchaseSuccess(paymentId, amount, details) {
    enrollment.classList.add('purchase-complete');
    enrollForm.hidden = true;
    $('.dialog-inner > p', enrollment).hidden = true;
    const title = $('#enroll-dialog-title');
    title.textContent = 'You’re in!';
    title.tabIndex = -1;
    const panel = document.createElement('section');
    panel.className = 'purchase-success';
    panel.innerHTML = `<div class="purchase-celebration" aria-hidden="true"><div class="purchase-sparks">${Array.from({length:12}, (_,i) => `<i style="--i:${i};--turn:${i*30}deg"></i>`).join('')}</div><div class="purchase-seal"><svg viewBox="0 0 80 80" fill="none"><path d="M22 41 L35 54 L59 27"/></svg></div><span class="purchase-star star-left">✦</span><span class="purchase-star star-right">✧</span></div><p class="eyebrow">A little mark. A lovely beginning.</p><h3>Your doodle journey starts here.</h3><p class="purchase-message">Payment successful! We’ll connect with you shortly on WhatsApp to help you get started.</p><div class="purchase-receipt"><span>Lifetime course access</span><strong class="purchase-amount"></strong><span>Payment reference</span><code class="purchase-reference"></code></div><p class="purchase-delivery-note" role="status" hidden></p><div class="purchase-actions"></div><p class="purchase-footnote">Keep your payment reference. There’s no need to pay again.</p>`;
    $('.purchase-amount', panel).textContent = money(amount);
    $('.purchase-reference', panel).textContent = paymentId;
    $('.purchase-receipt > span', panel).textContent = 'Lifetime course' + (details.kit ? ' + art kit' : '') + (details.tshirt ? ' + T-shirt' : '');
    const actions = $('.purchase-actions', panel);
    actions.append(contact(`Hi, I’ve paid for Doo Doodle. My name is ${details.name}. Payment reference: ${paymentId}. Please help me get started.`, 'Say hello on WhatsApp ↗'));
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'btn';
    done.textContent = 'Keep exploring';
    done.addEventListener('click', () => enrollment.close());
    actions.append(done);
    $('.dialog-inner', enrollment).append(panel);
    if (!enrollment.open) enrollment.showModal();
    enrollment.scrollTop = 0;
    title.focus({ preventScroll: true });
    return $('.purchase-delivery-note', panel);
  }
  function loadCheckout() {
    if (window.Razorpay) return Promise.resolve();
    if (!checkoutLoader) checkoutLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => { clearTimeout(timer); script.remove(); checkoutLoader = null; reject(new Error('Could not load payment checkout. Please try again.')); };
      const timer = setTimeout(fail, 15000);
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = fail;
      document.head.append(script);
    });
    return checkoutLoader;
  }
  enrollForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (processingPayment || completedPayment || !validate(enrollForm)) return;
    processingPayment = true;
    const button = $('#pay-button');
    button.disabled = true;
    status(enrollForm, 'Preparing your checkout…');
    $('#payment-fallback').replaceChildren();
    const details = Object.fromEntries(new FormData(enrollForm));
    const amount = enrollmentAmount();
    // Preserve the original Apps Script columns. These are browser-reported records,
    // not independently verified payments; reconcile in the Razorpay dashboard.
    const payload = {
      name: details.name, age: details.age, phone: details.phone, plan: 'lifetime',
      kit: details.kit ? 'Yes' : 'No', tshirt: details.tshirt ? 'Yes' : 'No',
      tshirt_size: details.tshirt ? details.tshirt_size : 'N/A',
      address: details.kit || details.tshirt ? [details.address, details.city, details.state, details.pin].filter(Boolean).join(', ') : 'N/A',
      total_amount: money(amount), coupon: discounted ? 'FIRSTMARK' : '',
      timestamp: timestamp(), verification: 'browser_callback_unverified'
    };
    const reopen = () => { if (!enrollment.open) enrollment.showModal(); };
    const unlock = () => { processingPayment = false; if (!completedPayment) { button.disabled = false; updatePrice(); } };
    try {
      if (!config.razorpayKeyId) throw new Error('Online checkout is not available yet. Please contact us.');
      await loadCheckout();
      const checkout = new window.Razorpay({ key: config.razorpayKeyId, amount, currency: 'INR', name: 'Doo Doodle', description: 'Lifetime course access', image: new URL('doodoodle-logo.svg', assetRoot).href, prefill: { name: details.name, contact: details.phone }, theme: { color: '#526ce6' },
        handler: async response => {
          if (completedPayment) return;
          completedPayment = true; // Never offer a second charge after a payment callback.
          processingPayment = false;
          const paymentId = response.razorpay_payment_id || 'Reference unavailable';
          button.textContent = 'Payment reported ✓';
          const deliveryNote = showPurchaseSuccess(paymentId, amount, details);
          try {
            if (!config.registrationUrl) throw new Error('Registration endpoint unavailable');
            await postRegistration(config.registrationUrl, { ...payload, status: 'SUCCESS', razorpay_payment_id: paymentId, failure_reason: 'N/A' });
          } catch {
            deliveryNote.textContent = 'One last step: we couldn’t send your enrolment details automatically. Tap “Say hello on WhatsApp” below so we can connect your payment to your enrolment. You don’t need to pay again.';
            deliveryNote.hidden = false;
          }
        }, modal: { ondismiss: () => { if (!completedPayment) { status(enrollForm, 'Checkout closed. You can try again when you’re ready.'); unlock(); reopen(); } } }
      });
      checkout.on('payment.failed', response => {
        if (completedPayment) return;
        status(enrollForm, 'Payment failed. You can retry in checkout or close it and try again.', true);
        if (config.registrationUrl) void postRegistration(config.registrationUrl, { ...payload, status: 'FAILED', razorpay_payment_id: response.error?.metadata?.payment_id || 'N/A', failure_reason: response.error?.description || 'Payment failed' }).catch(() => {});
      });
      // Razorpay renders outside a native dialog; close it so the gateway remains interactive.
      enrollment.close();
      checkout.open();
    } catch (error) {
      status(enrollForm, error.message, true);
      $('#payment-fallback').append(contact(`Hi, I’d like lifetime course access${discounted ? ' with FIRSTMARK' : ''}${details.kit ? ', an art kit' : ''}${details.tshirt ? ', a T-shirt' : ''}.`));
      unlock();
      reopen();
    }
  });

  function initDrawing() {
    const canvas = $('#doodleCanvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    let pointer = null, unlocked = false;
    let hasInk = false, colour = '#20211f';

    let strokes = [];
    let currentStroke = null;
    let livingMode = false;
    let wobbleFrame = 0;
    let lastWobbleTime = 0;
    let animId = null;
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };

    const eyes = {
      active: false,
      x: 0,
      y: 0,
      size: 24,
      pupil: { x: 0, y: 0 },
      targetPupil: { x: 0, y: 0 },
      blink: 0,
      squishing: 0
    };

    let props = [];

    const prompts = [
      'A sleepy cloud drinking hot cocoa ☕☁️',
      'A happy lemon wearing sneakers 🍋👟',
      'A curious mushroom with glasses 🍄👓',
      'A snail with a rocket backpack 🐌🚀',
      'A teapot celebrating its tea 🫖🎉',
      'A donut swimming in a coffee cup 🍩☕',
      'A book that sprouted little wings 📖🪽',
      'A dancing cactus in the rain 🌵🌧️',
      'A cozy cat curled into a pretzel 🥨🐱',
      'A friendly potato with roller skates 🥔🛼',
      'A paper plane carrying a tiny heart ✈️❤️',
      'An astronaut bear eating honey on the moon 🐻🍯'
    ];
    let promptIndex = 0;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
      if (canvas.width === Math.round(rect.width * dpr) && canvas.height === Math.round(rect.height * dpr)) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderAll(livingMode);
    }
    resizeCanvas();
    new ResizeObserver(resizeCanvas).observe(canvas);

    const canvasTop = $('.canvas-top');
    if (canvasTop) {
      const promptBtn = document.createElement('button');
      promptBtn.type = 'button';
      promptBtn.className = 'btn-spark-prompt';
      promptBtn.id = 'sparkPromptBtn';
      promptBtn.innerHTML = '🎲 Spark an idea';

      const topActions = document.createElement('div');
      topActions.className = 'canvas-top-actions';
      const clearBtn = $('#clearCanvas');
      if (clearBtn) {
        clearBtn.after(topActions);
        topActions.append(promptBtn, clearBtn);
      } else {
        canvasTop.append(promptBtn);
      }

      const promptBanner = document.createElement('div');
      promptBanner.className = 'doodle-prompt-banner';
      promptBanner.hidden = true;
      canvasTop.after(promptBanner);

      promptBtn.addEventListener('click', () => {
        promptIndex = (promptIndex + 1) % prompts.length;
        promptBanner.hidden = false;
        promptBanner.innerHTML = `<span><strong>Idea:</strong> ${prompts[promptIndex]}</span><button type="button" class="btn-prompt-reroll">Roll again ↺</button>`;
        $('.btn-prompt-reroll', promptBanner).addEventListener('click', () => promptBtn.click());
        $('#canvasMessage').textContent = `Prompt: "${prompts[promptIndex]}". Have fun with it!`;
      });
    }

    const reward = document.createElement('div');
    reward.className = 'reward';
    reward.hidden = true;
    reward.innerHTML = '<h3>You’re already a doodler.</h3><p>Your first circle earns ₹150 off. Code: <code>FIRSTMARK</code></p><button class="btn" type="button">Claim lifetime access · ₹1,349 ↗</button>';
    if (canvas.parentElement) canvas.parentElement.append(reward);
    $('button', reward).addEventListener('click', () => openEnrollment(true));

    const tools = document.createElement('div');
    tools.className = 'drawing-tools';
    tools.innerHTML = `
      <div class="drawing-tools-left">
        <button type="button" class="btn-bring-to-life" id="bringToLifeBtn">✦ Bring to life!</button>
        <label>Ink <input type="color" value="#20211f" aria-label="Drawing colour"></label>
      </div>
      <div class="drawing-tools-right">
        <button type="button" data-download>Save living doodle ↓</button>
      </div>
    `;
    canvas.after(tools);

    const propsBar = document.createElement('div');
    propsBar.className = 'doodle-props-bar';
    propsBar.innerHTML = `
      <span class="doodle-props-label">Add props:</span>
      <button type="button" class="btn-prop-stamp" data-prop="eyes">👀 Eyes</button>
      <button type="button" class="btn-prop-stamp" data-prop="sprout">🌱 Sprout</button>
      <button type="button" class="btn-prop-stamp" data-prop="wings">🪽 Wings</button>
      <button type="button" class="btn-prop-stamp" data-prop="hat">🎩 Party Hat</button>
      <button type="button" class="btn-prop-stamp" data-prop="sparkles">✨ Sparkles</button>
      <button type="button" class="btn-prop-stamp" data-prop="cheeks">😊 Blush</button>
    `;
    tools.after(propsBar);

    $('input', tools).addEventListener('input', e => { colour = e.target.value; });

    const bringBtn = $('#bringToLifeBtn', tools);
    bringBtn.addEventListener('click', () => {
      toggleLivingMode();
    });

    $$('.btn-prop-stamp', propsBar).forEach(btn => {
      btn.addEventListener('click', () => {
        addProp(btn.dataset.prop);
      });
    });

    function toggleLivingMode(forceState) {
      livingMode = typeof forceState === 'boolean' ? forceState : !livingMode;
      bringBtn.classList.toggle('active', livingMode);
      bringBtn.textContent = livingMode ? 'Living doodle ✦ Active' : '✦ Bring to life!';

      if (livingMode) {
        if (!hasInk && !eyes.active) {
          $('#canvasMessage').textContent = 'Draw a scribble first, then watch it wake up!';
        } else {
          ensureEyes();
          confetti();
          $('#canvasMessage').textContent = 'Look at that! Your doodle is alive! Move your pointer to see its eyes follow you.';
        }
        startAnimationLoop();
      } else {
        cancelAnimationFrame(animId);
        renderAll(false);
      }
    }

    function ensureEyes() {
      if (eyes.active) return;
      const box = getBoundingBox();
      const dpr = devicePixelRatio || 1;
      eyes.x = box.cx || canvas.width / (2 * dpr);
      eyes.y = box.top ? box.top + box.h * 0.35 : canvas.height / (2.5 * dpr);
      eyes.size = Math.max(18, Math.min(30, (box.w || 100) * 0.22));
      eyes.active = true;
    }

    function addProp(type) {
      if (type === 'eyes') {
        ensureEyes();
        toggleLivingMode(true);
        return;
      }
      ensureEyes();
      const box = getBoundingBox();
      const cx = box.cx || 200;
      const cy = box.cy || 150;
      let px = cx, py = cy, s = 34;

      if (type === 'hat') { px = eyes.x; py = eyes.y - eyes.size * 1.5; s = 42; }
      else if (type === 'sprout') { px = eyes.x; py = (box.top || cy) - 20; s = 36; }
      else if (type === 'wings') { px = eyes.x; py = eyes.y + 10; s = Math.max(50, (box.w || 80) * 0.6); }
      else if (type === 'sparkles') { px = cx; py = cy; s = Math.max(40, (box.w || 60) * 0.5); }
      else if (type === 'cheeks') { px = eyes.x; py = eyes.y + eyes.size * 0.7; s = eyes.size * 1.2; }

      props.push({ type, x: px, y: py, size: s });
      toggleLivingMode(true);
    }

    function getBoundingBox() {
      const allX = [], allY = [];
      strokes.forEach(s => s.points.forEach(p => { allX.push(p.x); allY.push(p.y); }));
      if (!allX.length) return { cx: 250, cy: 180, w: 100, h: 100, top: 130, left: 200 };
      const minX = Math.min(...allX), maxX = Math.max(...allX);
      const minY = Math.min(...allY), maxY = Math.max(...allY);
      return {
        left: minX, top: minY,
        w: maxX - minX, h: maxY - minY,
        cx: (minX + maxX) / 2, cy: (minY + maxY) / 2
      };
    }

    function wobble(pt, index, frame) {
      const phase = (index * 1.618 + frame * 2.399);
      return { x: pt.x + Math.sin(phase) * 1.1, y: pt.y + Math.cos(phase * 1.3) * 1.1 };
    }

    function drawStrokes(targetCtx, applyWobble, frame) {
      strokes.forEach(stroke => {
        if (!stroke.points.length) return;
        targetCtx.beginPath();
        targetCtx.strokeStyle = stroke.color;
        targetCtx.lineWidth = stroke.width;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';

        const pts = applyWobble
          ? stroke.points.map((p, idx) => wobble(p, idx, frame))
          : stroke.points;

        if (pts.length === 1) {
          targetCtx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
          targetCtx.fill();
        } else {
          targetCtx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            targetCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          targetCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          targetCtx.stroke();
        }
      });
    }

    function drawEyes(targetCtx, eyesObj, applyWobble, frame) {
      if (!eyesObj.active) return;
      const s = eyesObj.size;
      const eyeDist = s * 0.95;
      const scaleY = eyesObj.squishing > 0 ? 0.3 : Math.max(0.08, 1 - eyesObj.blink);

      targetCtx.save();
      targetCtx.translate(eyesObj.x, eyesObj.y);
      if (applyWobble) {
        targetCtx.rotate(Math.sin(frame * 1.9) * 0.025);
      }

      [-eyeDist, eyeDist].forEach(offsetX => {
        targetCtx.save();
        targetCtx.translate(offsetX, 0);
        targetCtx.scale(1, scaleY);

        if (eyesObj.squishing > 0) {
          targetCtx.beginPath();
          targetCtx.arc(0, s * 0.15, s * 0.65, Math.PI * 1.15, Math.PI * 1.85);
          targetCtx.strokeStyle = '#20211f';
          targetCtx.lineWidth = Math.max(2.5, s * 0.16);
          targetCtx.lineCap = 'round';
          targetCtx.stroke();
        } else {
          targetCtx.beginPath();
          targetCtx.arc(0, 0, s * 0.75, 0, Math.PI * 2);
          targetCtx.fillStyle = '#ffffff';
          targetCtx.fill();
          targetCtx.strokeStyle = '#20211f';
          targetCtx.lineWidth = Math.max(2.2, s * 0.12);
          targetCtx.stroke();

          const pupilR = s * 0.32;
          const px = eyesObj.pupil.x;
          const py = eyesObj.pupil.y;
          targetCtx.beginPath();
          targetCtx.arc(px, py, pupilR, 0, Math.PI * 2);
          targetCtx.fillStyle = '#20211f';
          targetCtx.fill();

          targetCtx.beginPath();
          targetCtx.arc(px - pupilR * 0.35, py - pupilR * 0.35, pupilR * 0.35, 0, Math.PI * 2);
          targetCtx.fillStyle = '#ffffff';
          targetCtx.fill();
        }
        targetCtx.restore();
      });

      targetCtx.restore();
    }

    function drawProps(targetCtx, propsArr, applyWobble, frame, isBackground) {
      propsArr.forEach(prop => {
        const isBgProp = prop.type === 'wings';
        if (isBgProp !== isBackground) return;

        targetCtx.save();
        targetCtx.translate(prop.x, prop.y);
        if (applyWobble) {
          targetCtx.rotate(Math.sin(frame * 1.8 + prop.x * 0.05) * 0.035);
        }
        const s = prop.size || 34;

        switch (prop.type) {
          case 'sprout': {
            targetCtx.lineWidth = 2.5; targetCtx.strokeStyle = '#20211f';
            targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round';
            targetCtx.beginPath();
            targetCtx.moveTo(0, s * 0.5); targetCtx.quadraticCurveTo(0, 0, -s * 0.1, -s * 0.2);
            targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.moveTo(-s * 0.08, -s * 0.15);
            targetCtx.quadraticCurveTo(-s * 0.5, -s * 0.5, -s * 0.6, -s * 0.1);
            targetCtx.quadraticCurveTo(-s * 0.3, 0, -s * 0.08, -s * 0.15);
            targetCtx.fillStyle = '#99d9bf'; targetCtx.fill(); targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.moveTo(-s * 0.05, -s * 0.2);
            targetCtx.quadraticCurveTo(s * 0.4, -s * 0.6, s * 0.65, -s * 0.25);
            targetCtx.quadraticCurveTo(s * 0.3, -s * 0.05, -s * 0.05, -s * 0.2);
            targetCtx.fillStyle = '#99d9bf'; targetCtx.fill(); targetCtx.stroke();
            break;
          }
          case 'wings': {
            targetCtx.lineWidth = 2.5; targetCtx.strokeStyle = '#20211f';
            targetCtx.lineCap = 'round'; targetCtx.fillStyle = '#fffdf8';
            targetCtx.beginPath();
            targetCtx.moveTo(-s * 0.3, 0);
            targetCtx.bezierCurveTo(-s * 1.1, -s * 0.7, -s * 1.3, s * 0.3, -s * 0.6, s * 0.5);
            targetCtx.bezierCurveTo(-s * 0.9, s * 0.3, -s * 0.7, 0, -s * 0.3, 0);
            targetCtx.fill(); targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.moveTo(s * 0.3, 0);
            targetCtx.bezierCurveTo(s * 1.1, -s * 0.7, s * 1.3, s * 0.3, s * 0.6, s * 0.5);
            targetCtx.bezierCurveTo(s * 0.9, s * 0.3, s * 0.7, 0, s * 0.3, 0);
            targetCtx.fill(); targetCtx.stroke();
            break;
          }
          case 'hat': {
            targetCtx.lineWidth = 2.5; targetCtx.strokeStyle = '#20211f'; targetCtx.lineCap = 'round';
            targetCtx.beginPath();
            targetCtx.moveTo(0, -s * 0.8); targetCtx.lineTo(-s * 0.45, s * 0.2);
            targetCtx.quadraticCurveTo(0, s * 0.35, s * 0.45, s * 0.2);
            targetCtx.closePath();
            targetCtx.fillStyle = '#ffcf40'; targetCtx.fill(); targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.moveTo(-s * 0.2, -s * 0.3); targetCtx.quadraticCurveTo(0, -s * 0.2, s * 0.25, -s * 0.35);
            targetCtx.strokeStyle = '#ff8ca4'; targetCtx.lineWidth = 3; targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.arc(0, -s * 0.85, s * 0.15, 0, Math.PI * 2);
            targetCtx.fillStyle = '#ff8ca4'; targetCtx.fill(); targetCtx.strokeStyle = '#20211f'; targetCtx.lineWidth = 2; targetCtx.stroke();
            break;
          }
          case 'sparkles': {
            const pts = [
              { x: -s * 0.5, y: -s * 0.4, col: '#ffcf40', sz: s * 0.3 },
              { x: s * 0.6, y: -s * 0.3, col: '#526ce6', sz: s * 0.35 },
              { x: s * 0.5, y: s * 0.4, col: '#99d9bf', sz: s * 0.25 }
            ];
            pts.forEach(p => {
              targetCtx.beginPath();
              const ro = p.sz, ri = p.sz * 0.3;
              for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4;
                const r = i % 2 === 0 ? ro : ri;
                const px = p.x + Math.cos(a) * r, py = p.y + Math.sin(a) * r;
                if (i === 0) targetCtx.moveTo(px, py); else targetCtx.lineTo(px, py);
              }
              targetCtx.closePath();
              targetCtx.fillStyle = p.col; targetCtx.fill();
              targetCtx.strokeStyle = '#20211f'; targetCtx.lineWidth = 1.5; targetCtx.stroke();
            });
            break;
          }
          case 'cheeks': {
            targetCtx.fillStyle = 'rgba(255, 140, 164, 0.45)';
            targetCtx.beginPath(); targetCtx.ellipse(-s * 0.7, 0, s * 0.35, s * 0.22, 0, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.ellipse(s * 0.7, 0, s * 0.35, s * 0.22, 0, 0, Math.PI * 2); targetCtx.fill();
            break;
          }
        }
        targetCtx.restore();
      });
    }

    function renderAll(applyWobble) {
      const dpr = devicePixelRatio || 1;
      context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      drawProps(context, props, applyWobble, wobbleFrame, true);
      drawStrokes(context, applyWobble, wobbleFrame);
      drawProps(context, props, applyWobble, wobbleFrame, false);
      drawEyes(context, eyes, applyWobble, wobbleFrame);
    }

    let lastBlinkTime = performance.now();
    let nextBlinkDelay = 3000;
    let isBlinking = false;
    let blinkStartTime = 0;

    function startAnimationLoop() {
      cancelAnimationFrame(animId);
      function tick(now) {
        if (!livingMode) return;

        if (now - lastWobbleTime > 125) {
          wobbleFrame = (wobbleFrame + 1) % 3;
          lastWobbleTime = now;
        }

        if (!isBlinking && now > lastBlinkTime + nextBlinkDelay) {
          isBlinking = true;
          blinkStartTime = now;
        }
        if (isBlinking) {
          const dt = now - blinkStartTime;
          if (dt < 75) {
            eyes.blink = dt / 75;
          } else if (dt < 150) {
            eyes.blink = 1 - (dt - 75) / 75;
          } else {
            eyes.blink = 0;
            isBlinking = false;
            lastBlinkTime = now;
            nextBlinkDelay = 2200 + Math.random() * 2500;
          }
        }

        eyes.pupil.x += (eyes.targetPupil.x - eyes.pupil.x) * 0.22;
        eyes.pupil.y += (eyes.targetPupil.y - eyes.pupil.y) * 0.22;

        if (eyes.squishing > 0) eyes.squishing -= 0.04;

        renderAll(true);
        animId = requestAnimationFrame(tick);
      }
      animId = requestAnimationFrame(tick);
    }

    window.addEventListener('pointermove', e => {
      if (!eyes.active) return;
      const rect = canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;
      const dx = targetX - eyes.x;
      const dy = targetY - eyes.y;
      const maxOffset = eyes.size * 0.38;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(maxOffset, Math.hypot(dx, dy) * 0.08);
      eyes.targetPupil.x = Math.cos(angle) * dist;
      eyes.targetPupil.y = Math.sin(angle) * dist;
    }, { passive: true });

    $('[data-download]', tools).addEventListener('click', () => {
      const output = document.createElement('canvas');
      output.width = 900; output.height = 700;
      const octx = output.getContext('2d');

      octx.fillStyle = '#f8f4ec';
      octx.fillRect(0, 0, 900, 700);

      octx.fillStyle = '#fffdf8';
      octx.strokeStyle = '#20211f';
      octx.lineWidth = 3;
      octx.beginPath();
      octx.roundRect(40, 40, 820, 620, 16);
      octx.fill();
      octx.stroke();

      octx.strokeStyle = '#ebe3d3';
      octx.lineWidth = 1.5;
      octx.beginPath();
      octx.roundRect(65, 65, 770, 470, 10);
      octx.stroke();

      octx.save();
      const rect = canvas.getBoundingClientRect();
      const scaleX = 770 / rect.width;
      const scaleY = 470 / rect.height;
      const scale = Math.min(scaleX, scaleY);
      octx.translate(65 + (770 - rect.width * scale) / 2, 65 + (470 - rect.height * scale) / 2);
      octx.scale(scale, scale);

      drawProps(octx, props, false, 0, true);
      drawStrokes(octx, false, 0);
      drawProps(octx, props, false, 0, false);
      drawEyes(octx, eyes, false, 0);
      octx.restore();

      octx.fillStyle = '#20211f';
      octx.font = '600 28px "Fredoka", sans-serif';
      octx.fillText('“I made that!”', 70, 585);

      octx.fillStyle = '#526ce6';
      octx.font = '500 16px "DM Sans", sans-serif';
      octx.fillText('Doo Doodle Studio · doodoodle.in', 70, 615);

      octx.beginPath();
      octx.arc(810, 595, 20, 0, Math.PI * 2);
      octx.fillStyle = '#ffcf40';
      octx.fill();
      octx.strokeStyle = '#20211f';
      octx.lineWidth = 2;
      octx.stroke();
      octx.fillStyle = '#20211f';
      octx.font = '700 14px "DM Sans", sans-serif';
      octx.fillText('✦', 804, 600);

      const link = document.createElement('a');
      link.download = 'my-living-doodle.png';
      link.href = output.toDataURL('image/png');
      link.click();
    });

    const position = e => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    canvas.addEventListener('pointerdown', e => {
      if (pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      pointer = e.pointerId;
      canvas.setPointerCapture(pointer);
      const p = position(e);

      if (eyes.active && Math.hypot(p.x - eyes.x, p.y - eyes.y) < eyes.size * 1.6) {
        dragTarget = eyes;
        dragOffset = { x: eyes.x - p.x, y: eyes.y - p.y };
        eyes.squishing = 1.0;
        canvas.classList.add('grabbing-eyes');
        return;
      }

      const hitProp = props.find(prop => Math.hypot(p.x - prop.x, p.y - prop.y) < prop.size * 1.3);
      if (hitProp) {
        dragTarget = hitProp;
        dragOffset = { x: hitProp.x - p.x, y: hitProp.y - p.y };
        canvas.classList.add('grabbing-eyes');
        return;
      }

      dragTarget = null;
      currentStroke = {
        points: [p],
        color: colour,
        width: 4
      };
      strokes.push(currentStroke);
      hasInk = true;

      if (!livingMode) {
        context.beginPath();
        context.strokeStyle = colour;
        context.lineWidth = 4;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.moveTo(p.x, p.y);
        context.lineTo(p.x + 0.1, p.y + 0.1);
        context.stroke();
      }

      if (!unlocked) $('#canvasMessage').textContent = 'Take your line for a walk. Try a circle to unlock a little reward.';
    });

    canvas.addEventListener('pointermove', e => {
      if (pointer !== e.pointerId) {
        const p = position(e);
        const nearEyes = eyes.active && Math.hypot(p.x - eyes.x, p.y - eyes.y) < eyes.size * 1.6;
        const nearProp = props.some(prop => Math.hypot(p.x - prop.x, p.y - prop.y) < prop.size * 1.3);
        canvas.classList.toggle('grab-eyes', nearEyes || nearProp);
        return;
      }

      const p = position(e);

      if (dragTarget) {
        dragTarget.x = p.x + dragOffset.x;
        dragTarget.y = p.y + dragOffset.y;
        if (!livingMode) renderAll(false);
        return;
      }

      if (currentStroke) {
        currentStroke.points.push(p);
        if (!livingMode) {
          context.lineTo(p.x, p.y);
          context.stroke();
          context.beginPath();
          context.moveTo(p.x, p.y);
        }
      }
    });

    canvas.addEventListener('pointercancel', () => {
      pointer = null;
      currentStroke = null;
      dragTarget = null;
      canvas.classList.remove('grabbing-eyes');
    });

    canvas.addEventListener('pointerup', e => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      canvas.classList.remove('grabbing-eyes');

      if (dragTarget) {
        dragTarget = null;
        return;
      }

      const points = currentStroke ? currentStroke.points : [];
      currentStroke = null;

      if (!unlocked && points.length >= 20) {
        const xs = points.map(p => p.x), ys = points.map(p => p.y);
        const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
        const diagonal = Math.hypot(w, h);
        if (diagonal >= 50 && Math.min(w, h) / Math.max(w, h) >= 0.55 && Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y) <= diagonal * 0.4) {
          const cx = xs.reduce((a, b) => a + b) / xs.length, cy = ys.reduce((a, b) => a + b) / ys.length;
          const radii = points.map(p => Math.hypot(p.x - cx, p.y - cy));
          const radius = radii.reduce((a, b) => a + b) / radii.length;
          if (radii.filter(r => Math.abs(r - radius) / radius < 0.4).length / radii.length >= 0.68) {
            unlocked = true;
            reward.hidden = false;
            $('#canvasMessage').textContent = 'Circle spotted! You unlocked ₹150 off lifetime course access.';
            confetti();
            ensureEyes();
            toggleLivingMode(true);
          }
        }
      }
    });

    $('#clearCanvas').addEventListener('click', () => {
      strokes = [];
      props = [];
      eyes.active = false;
      dragTarget = null;
      currentStroke = null;
      pointer = null;
      hasInk = false;
      toggleLivingMode(false);
      const dpr = devicePixelRatio || 1;
      context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      $('#canvasMessage').textContent = unlocked ? 'Your reward is ready below. Keep doodling!' : 'Your page is ready. Take the first line for a walk.';
    });
  }

  function initGallery() {
    const viewport = $('#gallery-viewport') || $('#gallery');
    if (!viewport) return;
    const controlsContainer = $('#gallery-controls') || $('#gallery .wrap') || viewport;

    const files = ['d7m9owb9ynclua3rpbqq','fsjtrqvo3gf9z5tijefx','hggd8cvwbm9qohhr9w7b','qesfxddojs0wuqgvwsqq','rvmnmfukc6dgstzq4tge','ssvfkjqmxbcbr0f0zi2m','uegc1jkhwlxccizhwcqh','vmmupckmcch2qqsqlpyv','xmom7nmd4d6kzh2uklmq','y0smitshutprklybf5ee','zyp1er5vhcydzfjh31jv'];
    const images = files.map((name, i) => ({ src: `assets/gallery/${name}.webp`, label: `Doo Doodle community artwork ${i + 1}` }));

    const lightbox = dialog('gallery-dialog', 'A closer look.', '<img id="gallery-image" alt=""><div class="feature-actions"><button class="icon-button" data-prev aria-label="Previous artwork">←</button><span id="gallery-count" role="status"></span><button class="icon-button" data-next aria-label="Next artwork">→</button></div>', 'lightbox');
    let current = 0, lastFocus = null;
    function show(index) { current = (index + images.length) % images.length; $('#gallery-image').src = images[current].src; $('#gallery-image').alt = images[current].label; $('#gallery-count').textContent = `${current + 1} / ${images.length}`; }
    function open(index) { lastFocus = document.activeElement; show(index); lightbox.showModal(); }
    lightbox.addEventListener('close', () => { if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus(); });
    $('[data-prev]', lightbox).onclick = () => show(current - 1);
    $('[data-next]', lightbox).onclick = () => show(current + 1);
    lightbox.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(current + (e.key === 'ArrowLeft' ? -1 : 1)); } });
    let touchX;
    lightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1)); }, { passive: true });

    const marquee = document.createElement('div');
    marquee.className = 'gallery-marquee';
    marquee.setAttribute('aria-label', 'Community artwork gallery');

    for (let row = 0; row < 2; row++) {
      const track = document.createElement('div');
      track.className = 'gallery-track' + (row ? ' reverse' : '');
      const baseList = row ? [...files].reverse() : [...files];
      const groupFiles = [...baseList, ...baseList];

      for (let g = 0; g < 2; g++) {
        const group = document.createElement('div');
        group.className = 'gallery-group';
        if (g > 0 || row > 0) group.setAttribute('aria-hidden', 'true');

        groupFiles.forEach((fileKey, i) => {
          const originalIndex = files.indexOf(fileKey);
          const button = document.createElement('button');
          button.className = 'art-thumb';
          button.type = 'button';
          button.style.setProperty('--rotation', `${((i + g * 3) % 3 - 1) * 2}deg`);
          button.setAttribute('aria-label', 'View ' + images[originalIndex].label);
          if (g > 0 || row > 0) button.tabIndex = -1;

          const img = new Image();
          img.src = images[originalIndex].src;
          img.alt = images[originalIndex].label;
          img.loading = 'lazy';
          button.append(img);

          button.onclick = () => open(originalIndex);
          group.append(button);
        });

        track.append(group);
      }

      marquee.append(track);
    }

    const pause = document.createElement('button');
    pause.className = 'btn secondary';
    pause.textContent = 'Pause gallery';
    pause.setAttribute('aria-pressed', 'false');
    pause.onclick = () => {
      const paused = marquee.classList.toggle('paused');
      pause.textContent = paused ? 'Play gallery' : 'Pause gallery';
      pause.setAttribute('aria-pressed', String(paused));
    };

    viewport.append(marquee);
    controlsContainer.append(pause);
  }

  function initReviews() {
    const wrap = $('.reviews');
    if (!wrap) return;
    const cards = $$('.review', wrap);
    wrap.classList.add('slider', 'sticky-pad');
    wrap.setAttribute('aria-roledescription', 'carousel');
    wrap.setAttribute('aria-label', 'Community reviews');

    const rots = ['-1.4deg', '1.6deg', '-1.8deg', '1.2deg'];
    cards.forEach((card, i) => {
      // The carousel owns these transforms, not the page's scroll-reveal rules.
      card.classList.remove('reveal');
      card.style.setProperty('--rot', rots[i % rots.length]);
      card.setAttribute('role', 'tabpanel');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `Review ${i + 1} of ${cards.length}`);

      if (!card.querySelector('.review-tape')) {
        const tape = document.createElement('div');
        tape.className = 'review-tape';
        tape.setAttribute('aria-hidden', 'true');
        card.prepend(tape);
      }

      if (!card.querySelector('.peel-hint')) {
        const hint = document.createElement('div');
        hint.className = 'peel-hint';
        hint.setAttribute('aria-hidden', 'true');
        hint.innerHTML = '<span>pull note</span> ↷';
        card.append(hint);
      }

      card.addEventListener('click', () => {
        if (!animating) {
          next();
        }
      });
    });

    const controls = document.createElement('div');
    controls.className = 'review-controls';

    let current = 0, animating = false, paused = reduced.matches;

    function show(index, dir = 'right') {
      if (animating) return;
      if (index === current && cards[current].classList.contains('active')) return;

      if (reduced.matches) {
        current = index;
        cards.forEach((card, i) => {
          card.hidden = i !== index;
          card.classList.toggle('active', i === index);
          card.classList.add('visible');
        });
        $$('[data-review]', controls).forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === index)));
        return;
      }

      animating = true;
      const prevCard = cards[current];
      const nextCard = cards[index];
      prevCard.style.setProperty('--review-exit-start', getComputedStyle(prevCard).transform);

      nextCard.hidden = false;
      nextCard.classList.add('visible', 'peeling-in');
      nextCard.classList.remove('active', 'peeling-out-right', 'peeling-out-left');

      const peelClass = dir === 'left' ? 'peeling-out-left' : 'peeling-out-right';
      prevCard.classList.add(peelClass);
      prevCard.classList.remove('active', 'peeling-in');

      current = index;
      $$('[data-review]', controls).forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === index)));

      const finishTransition = () => {
        clearTimeout(fallback);
        nextCard.removeEventListener('animationend', onAnimationEnd);
        prevCard.classList.remove('peeling-out-right', 'peeling-out-left');
        prevCard.classList.remove('active');
        prevCard.hidden = true;

        nextCard.classList.remove('peeling-in');
        nextCard.classList.add('active');

        animating = false;
      };
      const onAnimationEnd = event => {
        if (event.target === nextCard) finishTransition();
      };
      nextCard.addEventListener('animationend', onAnimationEnd);
      const fallback = setTimeout(finishTransition, 850);
    }

    function next() {
      show((current + 1) % cards.length, 'right');
    }

    function prev() {
      show((current - 1 + cards.length) % cards.length, 'left');
    }

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'review-nav';
    prevBtn.innerHTML = '←';
    prevBtn.setAttribute('aria-label', 'Previous review note');
    prevBtn.onclick = () => {
      prev();
    };
    controls.append(prevBtn);

    cards.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.review = i;
      btn.textContent = String(i + 1);
      btn.setAttribute('aria-label', 'Read review from ' + $('strong', card).textContent);
      btn.onclick = () => {
        show(i, i < current ? 'left' : 'right');
      };
      controls.append(btn);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'review-nav';
    nextBtn.innerHTML = '→';
    nextBtn.setAttribute('aria-label', 'Next review note');
    nextBtn.onclick = () => {
      next();
    };
    controls.append(nextBtn);

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.textContent = paused ? 'Play reviews' : 'Pause reviews';
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.onclick = () => {
      paused = !paused;
      pauseBtn.textContent = paused ? 'Play reviews' : 'Pause reviews';
      pauseBtn.setAttribute('aria-pressed', String(paused));
    };
    controls.append(pauseBtn);

    wrap.after(controls);

    cards.forEach((card, i) => {
      if (i === 0) {
        card.hidden = false;
        card.classList.add('visible', 'active');
      } else {
        card.hidden = true;
        card.classList.remove('active');
      }
    });
    $$('[data-review]', controls).forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === 0)));

    setInterval(() => {
      if (!paused && !reduced.matches && !document.hidden && !document.querySelector('dialog[open]')) {
        next();
      }
    }, 3000);
  }
  function initEffects() {
    const header = $('.site-header');
    if (header) addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 20), { passive: true });
    if (reduced.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.course-card,.offer').forEach(card => {
      card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); card.style.transform = `perspective(900px) rotateY(${(e.clientX - r.left - r.width / 2) / r.width * 5}deg) rotateX(${-(e.clientY - r.top - r.height / 2) / r.height * 5}deg)`; });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.btn').forEach(button => { button.addEventListener('pointermove', e => { const r = button.getBoundingClientRect(); button.style.setProperty('--pointer-x', e.clientX - r.left + 'px'); button.style.setProperty('--pointer-y', e.clientY - r.top + 'px'); }); });
    const photo = $('.instructor-sketch');
    if (photo) { photo.addEventListener('pointermove', e => { const r = photo.getBoundingClientRect(); $('img', photo).style.transform = `translate(${(e.clientX - r.left - r.width / 2) * -.025}px,${(e.clientY - r.top - r.height / 2) * -.025}px)`; }); photo.addEventListener('pointerleave', () => { $('img', photo).style.transform = ''; }); }
    const trail = ['character-pencil','pencil-comet','breathing-loop'].map(name => { const img = new Image(); img.src = new URL('illustrations/' + name + '.svg', assetRoot).href; img.className = 'cursor-doodle'; img.alt = ''; document.body.append(img); return { el: img, x: 0, y: 0 }; });
    let x = 0, y = 0, frame = 0, last = 0;
    function tick(now) { const active = now - last < 750 && !document.hidden && !document.querySelector('dialog[open]'); trail.forEach((item, i) => { item.x += (x - item.x) * (.15 - i * .035); item.y += (y - item.y) * (.15 - i * .035); item.el.style.transform = `translate(${item.x + 18}px,${item.y + 18}px) rotate(${i * 25}deg)`; item.el.style.opacity = active ? .2 - i * .04 : 0; }); frame = active ? requestAnimationFrame(tick) : 0; }
    document.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; last = performance.now(); if (!frame) { trail.forEach(item => { item.x = x; item.y = y; }); frame = requestAnimationFrame(tick); } }, { passive: true });
  }

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) { const c = text[i]; if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; } else if (c === ',' && !quoted) { row.push(cell); cell = ''; } else if (c === '\n' && !quoted) { row.push(cell.trim()); rows.push(row); row = []; cell = ''; } else cell += c; }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
  }
  async function initEventForms() {
    const workshop = $('#workshop-form');
    if (workshop) wireRegistration(workshop, 'workshop', config.registrationUrl);
    const webinar = $('#webinar-form');
    if (!webinar) return;
    wireRegistration(webinar, 'webinar', config.webinarUrl);
    const date = webinar.elements?.date;
    if (date) {
      const now = new Date();
      date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }
    const slot = webinar.elements?.slot;
    function fallback(text) { if (slot) slot.replaceChildren(new Option('Ask Gokul for available times', 'Please confirm available times')); status(webinar, text); }
    if (!config?.slotsUrl) { fallback('Choose your preferred date. We’ll confirm availability with you.'); return; }
    try {
      const response = await fetch(config.slotsUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error();
      const slots = parseCSV(await response.text()).filter(row => row[1]?.trim().toUpperCase() === 'TRUE').map(row => row[0].trim()).filter(Boolean);
      if (!slots.length) { fallback('No published slots right now. You can request the next available session.'); return; }
      slot.replaceChildren(new Option('Choose a time (India Standard Time)', ''));
      [...new Set(slots)].forEach(label => slot.add(new Option(label, label)));
    } catch { fallback('We couldn’t load live times. Send a request and we’ll confirm availability.'); }
  }
  initDrawing(); initGallery(); initReviews(); initEffects(); initEventForms();
})();
