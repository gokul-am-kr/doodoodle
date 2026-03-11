/* ══════════════════════════════════════════════════
   NAV — scroll border + light/dark mode
══════════════════════════════════════════════════ */
const _nav = document.getElementById('nav');
window.addEventListener('scroll',()=>{
  _nav.classList.toggle('on', window.scrollY>20);
},{passive:true});

/* Switch nav to light palette when user enters light sections */
(function navTheme(){
  const lightSections = document.querySelectorAll('.s-light');
  if (!lightSections.length) return;
  const navObs = new IntersectionObserver(entries => {
    // nav goes light if ANY light section is ≥30% visible
    const anyLight = [...lightSections].some(el => {
      const r = el.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
      return visible / window.innerHeight > 0.30;
    });
    _nav.classList.toggle('light', anyLight);
  }, { threshold: [0, 0.3, 1] });
  lightSections.forEach(el => navObs.observe(el));
})();

/* ══════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('vis'); io.unobserve(e.target); }
  });
},{ threshold:0.1, rootMargin:'0px 0px -55px 0px' });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

/* ══════════════════════════════════════════════════
   3-D CARD TILT
══════════════════════════════════════════════════ */
document.querySelectorAll('.tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform  = `perspective(660px) rotateY(${x*14}deg) rotateX(${-y*14}deg) scale(1.03)`;
    card.style.transition = 'transform 0.06s ease-out, border-color .3s, box-shadow .3s';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform  = '';
    card.style.transition = 'transform 0.45s ease, border-color .3s, box-shadow .3s';
  });
});

/* ══════════════════════════════════════════════════
   MAGNETIC BUTTONS
══════════════════════════════════════════════════ */
document.querySelectorAll('.btn-pri, .n-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.22;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.22;
    btn.style.transform  = `translate(${dx}px,${dy}px) translateY(-3px)`;
    btn.style.transition = 'transform .06s ease-out, box-shadow .2s';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform  = '';
    btn.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1), box-shadow .2s';
  });
});

/* ══════════════════════════════════════════════════
   BUTTON INNER GLOW  (injected span, mix-blend-mode:screen)
══════════════════════════════════════════════════ */
document.querySelectorAll('.btn-pri, .n-cta, .btn-pc.bpp').forEach(btn => {
  // Create the glow spot element inside the button
  const spot = document.createElement('span');
  spot.style.cssText = [
    'position:absolute', 'inset:0', 'pointer-events:none', 'border-radius:inherit',
    'background:radial-gradient(circle 140px at var(--sx,50%) var(--sy,50%), rgba(255,230,150,var(--sa,0)) 0%, rgba(255,110,40,0) 70%)',
    'transition:none',
    'will-change:background'
  ].join(';');
  btn.appendChild(spot);

  btn.addEventListener('mouseenter', () => {
    spot.style.setProperty('--sx', '50%');
    spot.style.setProperty('--sy', '50%');
    spot.style.setProperty('--sa', '0.5');
  });
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const x  = e.clientX - r.left;
    const y  = e.clientY - r.top;
    const dx = (x - r.width  / 2) / (r.width  / 2);
    const dy = (y - r.height / 2) / (r.height / 2);
    const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    spot.style.setProperty('--sx', x.toFixed(1) + 'px');
    spot.style.setProperty('--sy', y.toFixed(1) + 'px');
    // Center ≈ 0.40, edges ≈ 0.90
    spot.style.setProperty('--sa', (0.40 + dist * 0.50).toFixed(3));
  });
  btn.addEventListener('mouseleave', () => { spot.style.setProperty('--sa', '0'); });
});

/* ══════════════════════════════════════════════════
   CTA BUTTONS → scroll to pricing
══════════════════════════════════════════════════ */
document.querySelectorAll('.btn-pri, .n-cta').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
  });
});

/* ══════════════════════════════════════════════════
   ENROLMENT FORM MODAL + RAZORPAY
══════════════════════════════════════════════════ */
(function(){
  const modal     = document.getElementById('enroll-modal');
  if (!modal) return;
  const form      = document.getElementById('enroll-form');
  const planBadge = document.getElementById('enroll-plan-badge');

  const RAZORPAY_KEY_ID = 'rzp_test_SOoJoUFladfv69';
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyU_Q4PHysh3SkU88u7Ypec955qy7n80XsDEUsoyj9csmgFLKdmixmyT_xbbQ3EoIqyIA/exec';

  let selectedPlan = { label: 'Lifetime Access — ₹1,499', amount: 149900, plan: 'lifetime' };
  let wantsKit = false;
  let wantsTee = false;
  let teeSize  = '';

  /* ── Price helpers ───────────────────────────────── */
  function computeTotal() {
    return selectedPlan.amount + (wantsKit ? 49900 : 0) + (wantsTee ? 49900 : 0);
  }
  function fmtInr(paise) {
    return '₹' + (paise / 100).toLocaleString('en-IN');
  }
  function updatePriceDisplay() {
    const total = computeTotal();
    document.getElementById('ps-kit-row').classList.toggle('visible', wantsKit);
    document.getElementById('ps-tee-row').classList.toggle('visible', wantsTee);
    const totalEl = document.getElementById('ps-total-amount');
    const payEl   = document.getElementById('ef-pay-label');
    if (totalEl) { totalEl.textContent = fmtInr(total); flashEl(totalEl); }
    if (payEl)   { payEl.textContent   = fmtInr(total); }
  }
  function flashEl(el) {
    el.classList.remove('price-pop');
    void el.offsetWidth;
    el.classList.add('price-pop');
  }
  function updateAddressVisibility() {
    document.getElementById('addr-section').classList.toggle('show', wantsKit || wantsTee);
  }
  function updateTeeSizeVisibility() {
    document.getElementById('tee-size-section').classList.toggle('show', wantsTee);
  }

  /* ── Reset form state ────────────────────────────── */
  function resetAddons() {
    wantsKit = false; wantsTee = false; teeSize = '';
    document.getElementById('acard-kit').classList.remove('checked');
    document.getElementById('acard-tee').classList.remove('checked');
    document.getElementById('addr-section').classList.remove('show');
    document.getElementById('tee-size-section').classList.remove('show');
    document.getElementById('ps-kit-row').classList.remove('visible');
    document.getElementById('ps-tee-row').classList.remove('visible');
    form.querySelectorAll('.size-pill').forEach(p => p.classList.remove('selected'));
    clearErr('err-tee-size', null);
  }

  /* ── Modal open / close ──────────────────────────── */
  const openModal = (planData) => {
    if (planData) {
      selectedPlan = planData;
      resetAddons();
      if (planBadge) planBadge.textContent = selectedPlan.label;
      const courseLabel = selectedPlan.plan === 'lifetime' ? 'Lifetime Access' : 'Monthly Access';
      const courseLabelEl = document.getElementById('ps-course-label');
      const basePriceEl   = document.getElementById('ps-base-price');
      if (courseLabelEl) courseLabelEl.textContent = courseLabel;
      if (basePriceEl)   basePriceEl.textContent   = fmtInr(selectedPlan.amount);
      updatePriceDisplay();
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };

  document.querySelectorAll('.btn-pc[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => openModal({
      label:  btn.dataset.label,
      amount: parseInt(btn.dataset.amount, 10),
      plan:   btn.dataset.plan
    }));
  });
  modal.querySelector('.enroll-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  /* ── Addon toggles ───────────────────────────────── */
  document.getElementById('acard-kit').addEventListener('click', function() {
    wantsKit = !wantsKit;
    this.classList.toggle('checked', wantsKit);
    updateAddressVisibility();
    updatePriceDisplay();
  });

  document.getElementById('acard-tee').addEventListener('click', function() {
    wantsTee = !wantsTee;
    if (!wantsTee) {
      teeSize = '';
      form.querySelectorAll('.size-pill').forEach(p => p.classList.remove('selected'));
      clearErr('err-tee-size', null);
    }
    this.classList.toggle('checked', wantsTee);
    updateTeeSizeVisibility();
    updateAddressVisibility();
    updatePriceDisplay();
  });

  form.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', function(e) {
      e.stopPropagation();
      form.querySelectorAll('.size-pill').forEach(p => p.classList.remove('selected'));
      this.classList.add('selected');
      teeSize = this.dataset.size;
      clearErr('err-tee-size', null);
    });
  });

  /* ── Validation helpers ──────────────────────────── */
  function showErr(id, inputEl) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
    if (inputEl) inputEl.classList.add('invalid');
  }
  function clearErr(id, inputEl) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
    if (inputEl) inputEl.classList.remove('invalid');
  }

  ['ef-name','ef-age','ef-phone','ef-city','ef-state','ef-pin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearErr('err-' + id.replace('ef-',''), el));
  });
  const addrTA = document.getElementById('ef-addr');
  if (addrTA) addrTA.addEventListener('input', () => clearErr('err-addr', addrTA));

  /* ── Send to Google Sheets ───────────────────────── */
  function sendToSheets(payload) {
    fetch(SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  /* ── Doodle confetti ─────────────────────────────── */
  function launchConfetti() {
    const doodles = ['cactus','cat','cup','mushroom','snail','sweet'];
    const hues    = [0, 40, 200, 270, 150, 20]; // coral, gold, sky, violet, mint, orange
    const count   = 28;

    for (let i = 0; i < count; i++) {
      const img      = document.createElement('img');
      const doodle   = doodles[i % doodles.length];
      const fromLeft = i % 2 === 0;
      const size     = 22 + Math.random() * 30;
      const startY   = 5  + Math.random() * 55;   // % from top along edge
      const travelX  = (50 + Math.random() * 45) * window.innerWidth  / 100;
      const travelY  = (15 + Math.random() * 65) * window.innerHeight / 100;
      const rotate   = (Math.random() - 0.5) * 800;
      const delay    = Math.random() * 700;
      const duration = 1300 + Math.random() * 900;
      const hue      = hues[i % hues.length] + (Math.random() - 0.5) * 30;

      img.src = `doodle/${doodle}.svg`;
      Object.assign(img.style, {
        position:      'fixed',
        top:           startY + '%',
        [fromLeft ? 'left' : 'right']: '-55px',
        width:         size + 'px',
        height:        size + 'px',
        pointerEvents: 'none',
        zIndex:        '9998',
        filter:        `brightness(0) invert(1) sepia(1) saturate(8) hue-rotate(${hue}deg) drop-shadow(0 2px 6px rgba(0,0,0,.3))`
      });

      document.body.appendChild(img);

      const dx = fromLeft ? travelX : -travelX;
      img.animate([
        { opacity: 0,   transform: `translate(0,0) rotate(0deg) scale(0.4)` },
        { opacity: 1,   transform: `translate(${dx * 0.35}px,${travelY * 0.2}px) rotate(${rotate * 0.3}deg) scale(1.1)`, offset: 0.18 },
        { opacity: 0.9, transform: `translate(${dx * 0.7}px,${travelY * 0.6}px) rotate(${rotate * 0.7}deg) scale(0.95)`, offset: 0.6 },
        { opacity: 0,   transform: `translate(${dx}px,${travelY}px) rotate(${rotate}deg) scale(0.7)` }
      ], {
        duration,
        delay,
        easing:    'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill:      'forwards'
      }).onfinish = () => img.remove();
    }
  }

  /* ── Success screen ──────────────────────────────── */
  function showSuccess(paymentId) {
    form.innerHTML = `
      <div style="text-align:center;padding:32px 0;">
        <div style="font-size:52px;margin-bottom:18px;">🎉</div>
        <h3 style="font-size:22px;font-weight:800;margin-bottom:10px;">Payment successful!</h3>
        <p style="color:var(--dim);font-size:15px;margin-bottom:20px;">You're officially a Doo Doodler.<br>We'll reach out on WhatsApp to get you started.</p>
        <div style="display:inline-block;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:10px;padding:10px 18px;font-size:11px;color:var(--dim);letter-spacing:.04em;">
          TXN ID&nbsp;&nbsp;<strong style="color:var(--text);font-family:monospace;">${paymentId}</strong>
        </div>
      </div>`;
    launchConfetti();
  }

  /* ── Form submit ─────────────────────────────────── */
  form.addEventListener('submit', e => {
    e.preventDefault();

    const nameEl  = document.getElementById('ef-name');
    const ageEl   = document.getElementById('ef-age');
    const phoneEl = document.getElementById('ef-phone');
    const addrEl  = document.getElementById('ef-addr');
    const cityEl  = document.getElementById('ef-city');
    const stateEl = document.getElementById('ef-state');
    const pinEl   = document.getElementById('ef-pin');

    // Clear all errors
    ['err-name','err-age','err-phone','err-addr','err-city','err-state','err-pin']
      .forEach(id => clearErr(id, null));
    [nameEl, ageEl, phoneEl, addrEl, cityEl, stateEl, pinEl]
      .forEach(el => el && el.classList.remove('invalid'));

    let valid = true;
    if (!nameEl.value.trim())            { showErr('err-name',  nameEl);  valid = false; }
    if (!ageEl.value || ageEl.value < 1) { showErr('err-age',   ageEl);   valid = false; }
    if (!phoneEl.value.trim())           { showErr('err-phone', phoneEl); valid = false; }

    if (wantsTee && !teeSize) { showErr('err-tee-size', null); valid = false; }

    if (wantsKit || wantsTee) {
      if (!addrEl.value.trim())                { showErr('err-addr',  addrEl);  valid = false; }
      if (!cityEl.value.trim())                { showErr('err-city',  cityEl);  valid = false; }
      if (!stateEl.value.trim())               { showErr('err-state', stateEl); valid = false; }
      if (!/^\d{6}$/.test(pinEl.value.trim())) { showErr('err-pin',   pinEl);   valid = false; }
    }

    if (!valid) return;

    const submitBtn = form.querySelector('.ef-submit');
    submitBtn.disabled = true;
    const payLabel = document.getElementById('ef-pay-label');
    if (payLabel) payLabel.textContent = 'Opening…';

    const totalAmount = computeTotal();
    const deliveryAddress = (wantsKit || wantsTee)
      ? [addrEl.value.trim(), cityEl.value.trim(), stateEl.value.trim(), pinEl.value.trim()].join(', ')
      : 'N/A';

    const basePayload = {
      name:               nameEl.value.trim(),
      age:                ageEl.value,
      phone:              phoneEl.value.trim(),
      plan:               selectedPlan.plan,
      kit:                wantsKit ? 'Yes' : 'No',
      tshirt:             wantsTee ? 'Yes' : 'No',
      tshirt_size:        wantsTee ? teeSize : 'N/A',
      address:            deliveryAddress,
      total_amount:       fmtInr(totalAmount),
      timestamp:          new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    const rzp = new Razorpay({
      key:         RAZORPAY_KEY_ID,
      amount:      totalAmount,
      currency:    'INR',
      name:        'Doo Doodle',
      description: selectedPlan.label,
      image:       '/logo.jpg',
      prefill:     { name: basePayload.name, contact: basePayload.phone },
      theme:       { color: '#E05740' },
      handler: function(response) {
        sendToSheets({
          ...basePayload,
          status:              'SUCCESS',
          razorpay_payment_id: response.razorpay_payment_id,
          failure_reason:      'N/A'
        });
        showSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function() {
          submitBtn.disabled = false;
          if (payLabel) payLabel.textContent = fmtInr(totalAmount);
        }
      }
    });

    rzp.on('payment.failed', function(response) {
      submitBtn.disabled = false;
      if (payLabel) payLabel.textContent = fmtInr(totalAmount);

      const err = response.error || {};
      sendToSheets({
        ...basePayload,
        status:              'FAILED',
        razorpay_payment_id: (err.metadata && err.metadata.payment_id) || 'N/A',
        failure_reason:      [err.reason, err.description].filter(Boolean).join(' — ') || 'Unknown'
      });

      alert('Payment failed. Please try again or contact us on WhatsApp.');
    });

    rzp.open();
  });
})();

/* ══════════════════════════════════════════════════
   POLICIES MODAL
══════════════════════════════════════════════════ */
(function(){
  const modal = document.getElementById('pol-modal');
  if (!modal) return;
  const closeModal = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };
  document.querySelectorAll('[data-open="pol-modal"]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); modal.classList.add('open'); document.body.style.overflow = 'hidden'; });
  });
  modal.querySelector('.pol-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

/* ══════════════════════════════════════════════════
   INSTRUCTOR PHOTO — GYROSCOPE / MOUSE PARALLAX
   Replicates the iPhone home-screen depth effect.
   On mobile: gyroscope drives the tilt.
   On desktop: mouse position drives it.
   Photo (background layer) moves opposite to tilt;
   doodle overlays (foreground) move with it — this
   separation creates the illusion of depth.
══════════════════════════════════════════════════ */
(function gyroParallax() {
  const section  = document.getElementById('instructor');
  const photo    = document.querySelector('.inst-ph');
  const pw       = document.querySelector('.inst-pw');
  if (!photo || !pw || !section) return;

  const overlays = pw.querySelectorAll('.f1, .f2');

  /* -1 … +1 target values, lerped toward in rAF */
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  const PHOTO_MAX    = 14;   /* px the photo travels (background layer) */
  const OVERLAY_MULTI = 2.4; /* overlays travel further — feel "closer"  */

  function lerp(a, b, t) { return a + (b - a) * t; }

  (function tick() {
    currentX = lerp(currentX, targetX, 0.07);
    currentY = lerp(currentY, targetY, 0.07);

    const px = currentX * PHOTO_MAX;
    const py = currentY * PHOTO_MAX;

    /* photo shifts opposite the tilt — sits "behind" */
    photo.style.transform = `translate(${-px}px, ${-py}px)`;

    /* overlays follow the tilt — float "in front" */
    overlays.forEach(el => {
      el.style.transform = `translate(${px * OVERLAY_MULTI}px, ${py * OVERLAY_MULTI}px)`;
    });

    requestAnimationFrame(tick);
  })();

  /* ── Gyroscope (mobile) ───────────────────────────── */
  function startGyro() {
    window.addEventListener('deviceorientation', e => {
      /* gamma: left/right tilt (-90…90)
         beta:  front/back tilt (-180…180), ~45° is flat on table */
      targetX = Math.max(-1, Math.min(1,  (e.gamma || 0) / 25));
      targetY = Math.max(-1, Math.min(1, ((e.beta  || 0) - 45) / 25));
    }, { passive: true });
  }

  if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      /* iOS 13+ requires a user-gesture to grant permission.
         We ask on the first tap anywhere in the section. */
      section.addEventListener('click', function askOnce() {
        DeviceOrientationEvent.requestPermission()
          .then(state => { if (state === 'granted') startGyro(); })
          .catch(() => {});
        section.removeEventListener('click', askOnce);
      }, { once: true });
    } else {
      startGyro();
    }
  }

  /* ── Mouse fallback (desktop) ─────────────────────── */
  section.addEventListener('mousemove', e => {
    const r = section.getBoundingClientRect();
    targetX = (e.clientX - r.left) / r.width  * 2 - 1;
    targetY = (e.clientY - r.top)  / r.height * 2 - 1;
  }, { passive: true });

  section.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });
})();
