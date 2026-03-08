/* ══════════════════════════════════════════════════
   ANIMATIONS
   ─ Scramble text (hero headline)
   ─ Count-up numbers (stat cards)
   ─ Split-word heading reveals (h2.rv)
══════════════════════════════════════════════════ */

/* ── 1. SCRAMBLE TEXT ───────────────────────────────
   Hero headline spans scramble random chars then
   settle into the real text, left→right.          */
(function scrambleHero() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@!?&%*+=';
  const spans = [
    document.querySelector('.hl-a'),
    document.querySelector('.hl-b'),
    document.querySelector('.hl-c'),
  ].filter(Boolean);

  spans.forEach((el, si) => {
    const final = el.textContent.trim();
    el.dataset.final = final;

    const DELAY    = 2000 + si * 220;  // start after intro reveals hero (~1.8s)
    const DURATION = 900;              // ms to fully settle
    const INTERVAL = 40;

    setTimeout(() => {
      const total  = Math.ceil(DURATION / INTERVAL);
      let tick = 0;

      const id = setInterval(() => {
        tick++;
        const progress = tick / total;          // 0→1
        const settled  = Math.floor(progress * final.length);
        let out = '';
        for (let i = 0; i < final.length; i++) {
          if (final[i] === ' ') { out += ' '; continue; }
          if (i < settled) {
            out += final[i];
          } else {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        el.textContent = out;
        if (tick >= total) { clearInterval(id); el.textContent = final; }
      }, INTERVAL);
    }, DELAY);
  });
})();


/* ── 2. COUNT-UP NUMBERS ────────────────────────────
   Elements with data-count="29" data-suffix="%"
   animate from 0 when first entering the viewport. */
(function countUp() {
  const els = [...document.querySelectorAll('[data-count]')];
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);

      const el      = e.target;
      const target  = parseFloat(el.dataset.count);
      const suffix  = el.dataset.suffix || '';
      const isFloat = target !== Math.floor(target);
      const dur     = 1200;
      const start   = performance.now();

      function step(now) {
        const t  = Math.min(1, (now - start) / dur);
        const ease = 1 - Math.pow(1 - t, 3);      // cubic-out
        const val  = target * ease;
        el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });

  els.forEach(el => obs.observe(el));
})();


/* ── 3. SPLIT-WORD HEADING REVEALS ─────────────────
   All h2.rv — wrap each word in .sw-wrap > .sw
   CSS drives the translateY reveal when .vis added. */
(function splitWords() {
  document.querySelectorAll('h2.rv').forEach(h2 => {
    const nodes = [...h2.childNodes];
    h2.innerHTML = '';
    let wordIdx = 0;

    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(token => {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            h2.appendChild(document.createTextNode(token));
          } else {
            const wrap = document.createElement('span');
            wrap.className = 'sw-wrap';
            const inner = document.createElement('span');
            inner.className = 'sw';
            inner.style.transitionDelay = `${wordIdx * 55}ms`;
            inner.textContent = token;
            wrap.appendChild(inner);
            h2.appendChild(wrap);
            wordIdx++;
          }
        });
      } else {
        // Element node (e.g. <span class="hic">) — wrap the whole element
        const wrap = document.createElement('span');
        wrap.className = 'sw-wrap';
        const inner = document.createElement('span');
        inner.className = 'sw';
        inner.style.transitionDelay = `${wordIdx * 55}ms`;
        inner.appendChild(node.cloneNode(true));
        wrap.appendChild(inner);
        h2.appendChild(wrap);
        wordIdx++;
      }
    });
  });
})();
