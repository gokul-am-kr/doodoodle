/* ══════════════════════════════════════════════════
   DIGITAL SANDBOX
   Draw a circle on the canvas → circle detection →
   reveal coupon card + doodle confetti
══════════════════════════════════════════════════ */
(function () {
  const canvas   = document.getElementById('doodle-canvas');
  if (!canvas) return;
  const ctx      = canvas.getContext('2d');
  const stage    = document.getElementById('sb-stage');
  const hint     = document.getElementById('sb-hint');
  const clearBtn = document.getElementById('sb-clear');
  const reveal   = document.getElementById('sb-reveal');

  let drawing  = false;
  let points   = [];
  let unlocked = false;

  /* ── Canvas sizing (handles retina / resize) ───── */
  function resizeCanvas() {
    const r   = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = r.width  * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    applyStrokeStyle();
  }
  function applyStrokeStyle() {
    ctx.strokeStyle = '#FF3520'; /* --coral */
    ctx.lineWidth   = 3.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  /* ── Pointer position relative to canvas ───────── */
  function getPos(e) {
    const r   = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  /* ── Drawing handlers ───────────────────────────── */
  function onDown(e) {
    if (unlocked) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    points  = [];
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    stage.classList.remove('success');
    const p = getPos(e);
    points.push(p);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    hint.classList.add('hidden');
    clearBtn.classList.add('visible');
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    points.push(p);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function onUp(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    if (points.length >= 20 && isCircle(points)) {
      triggerSuccess();
    }
  }

  canvas.addEventListener('pointerdown',   onDown);
  canvas.addEventListener('pointermove',   onMove);
  canvas.addEventListener('pointerup',     onUp);
  canvas.addEventListener('pointercancel', onUp);

  /* ── Clear ──────────────────────────────────────── */
  clearBtn.addEventListener('click', function () {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    points = [];
    hint.classList.remove('hidden');
    clearBtn.classList.remove('visible');
    stage.classList.remove('success');
    if (!unlocked) reveal.classList.remove('visible');
  });

  /* ── Circle detection ───────────────────────────── */
  /*
    Three tests:
    1. Minimum size — bounding diagonal > 50 px
    2. Closure     — start/end gap < 40% of diagonal
    3. Roundness   — ≥68% of sampled points fall within
                     ±40% of the average radius
    Thresholds are intentionally generous so real people
    with real hands can succeed on their first try.
  */
  function isCircle(pts) {
    const xs   = pts.map(p => p.x);
    const ys   = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w    = maxX - minX, h = maxY - minY;
    const diag = Math.sqrt(w * w + h * h);

    if (diag < 50) return false;

    const dx  = pts[0].x - pts[pts.length - 1].x;
    const dy  = pts[0].y - pts[pts.length - 1].y;
    if (Math.sqrt(dx * dx + dy * dy) > diag * 0.40) return false;

    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;

    const radii  = pts.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));
    const avgR   = radii.reduce((a, b) => a + b, 0) / radii.length;
    const inBand = radii.filter(r => Math.abs(r - avgR) / avgR < 0.40).length;

    return (inBand / radii.length) >= 0.68;
  }

  /* ── Success ────────────────────────────────────── */
  function triggerSuccess() {
    unlocked = true;
    stage.classList.add('success');
    setTimeout(() => reveal.classList.add('visible'), 320);
    sandboxConfetti();
  }

  /* ── Doodle confetti ────────────────────────────── */
  function sandboxConfetti() {
    const doodles = ['cactus', 'cat', 'cup', 'mushroom', 'snail', 'sweet'];
    const hues    = [0, 40, 200, 270, 150, 20];

    for (let i = 0; i < 22; i++) {
      const img   = document.createElement('img');
      const d     = doodles[i % doodles.length];
      const fromL = i % 2 === 0;
      const size  = 18 + Math.random() * 28;
      const sy    = 8  + Math.random() * 55;
      const tx    = (38 + Math.random() * 42) * window.innerWidth  / 100;
      const ty    = (12 + Math.random() * 62) * window.innerHeight / 100;
      const rot   = (Math.random() - 0.5) * 720;
      const del   = Math.random() * 500;
      const dur   = 1100 + Math.random() * 800;
      const hue   = hues[i % hues.length] + (Math.random() - 0.5) * 30;

      img.src = `doodle/${d}.svg`;
      Object.assign(img.style, {
        position:      'fixed',
        top:           sy + '%',
        [fromL ? 'left' : 'right']: '-50px',
        width:         size + 'px',
        height:        size + 'px',
        pointerEvents: 'none',
        zIndex:        '9998',
        filter:        `brightness(0) invert(1) sepia(1) saturate(8) hue-rotate(${hue}deg) drop-shadow(0 2px 5px rgba(0,0,0,.3))`
      });
      document.body.appendChild(img);

      const dx = fromL ? tx : -tx;
      img.animate([
        { opacity: 0,   transform: 'translate(0,0) rotate(0deg) scale(0.4)' },
        { opacity: 1,   transform: `translate(${dx * .35}px,${ty * .2}px) rotate(${rot * .35}deg) scale(1.1)`, offset: 0.2 },
        { opacity: 0.9, transform: `translate(${dx * .7}px,${ty * .6}px) rotate(${rot * .7}deg) scale(0.95)`, offset: 0.6 },
        { opacity: 0,   transform: `translate(${dx}px,${ty}px) rotate(${rot}deg) scale(0.7)` }
      ], {
        duration: dur,
        delay:    del,
        easing:   'cubic-bezier(.22,.61,.36,1)',
        fill:     'forwards'
      }).onfinish = () => img.remove();
    }
  }
})();
