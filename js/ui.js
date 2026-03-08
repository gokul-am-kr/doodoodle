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
   ENROLMENT FORM MODAL
══════════════════════════════════════════════════ */
(function(){
  const modal = document.getElementById('enroll-modal');
  if (!modal) return;
  const form  = document.getElementById('enroll-form');

  const openModal  = () => { modal.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };

  // Open on "Get Lifetime Access"
  document.querySelectorAll('.btn-pc.bpp').forEach(btn => {
    btn.addEventListener('click', openModal);
  });
  modal.querySelector('.enroll-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  // Validation helpers
  function showErr(id, inputEl) {
    document.getElementById(id).classList.add('show');
    if (inputEl) inputEl.classList.add('invalid');
  }
  function clearErr(id, inputEl) {
    document.getElementById(id).classList.remove('show');
    if (inputEl) inputEl.classList.remove('invalid');
  }

  // Live clear on input
  ['ef-name','ef-age','ef-phone'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => clearErr('err-' + id.replace('ef-',''), el));
  });
  form.querySelectorAll('input[name="kit"]').forEach(r => {
    r.addEventListener('change', () => document.getElementById('err-kit').classList.remove('show'));
  });

  // Submit → validate → WhatsApp
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nameEl  = document.getElementById('ef-name');
    const ageEl   = document.getElementById('ef-age');
    const phoneEl = document.getElementById('ef-phone');
    const kitEl   = form.querySelector('input[name="kit"]:checked');

    let valid = true;
    clearErr('err-name',  nameEl);
    clearErr('err-age',   ageEl);
    clearErr('err-phone', phoneEl);
    document.getElementById('err-kit').classList.remove('show');

    if (!nameEl.value.trim())                        { showErr('err-name',  nameEl);  valid = false; }
    if (!ageEl.value || ageEl.value < 1)             { showErr('err-age',   ageEl);   valid = false; }
    if (!phoneEl.value.trim())                       { showErr('err-phone', phoneEl); valid = false; }
    if (!kitEl)                                      { showErr('err-kit',   null);    valid = false; }

    if (!valid) return;

    // ── Replace this URL after deploying your Google Apps Script ──
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzExW3jK6Dx3P-StyJjFCYOvkhCfrgfaOvrTiRUfD0U-KrV-_N-t4FOpS_mpIBq_j-aGw/exec';

    const submitBtn = form.querySelector('.ef-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    const payload = {
      name:  nameEl.value.trim(),
      age:   ageEl.value,
      phone: phoneEl.value.trim(),
      kit:   kitEl.value === 'yes' ? 'Yes — send a kit' : 'No — I have my own supplies',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(() => {
      form.innerHTML = `
        <div style="text-align:center;padding:32px 0;">
          <div style="font-size:48px;margin-bottom:16px;">🎉</div>
          <h3 style="font-size:22px;font-weight:800;margin-bottom:10px;">You're in!</h3>
          <p style="color:var(--dim);font-size:15px;">We've received your details and will reach out to you shortly on WhatsApp.</p>
        </div>`;
    })
    .catch(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Enrolment';
      alert('Something went wrong. Please try again or contact us on WhatsApp.');
    });
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
