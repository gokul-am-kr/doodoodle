/* ══════════════════════════════════════════════════
   DEPTH PARALLAX SYSTEM
   ─────────────────────────────────────────────────
   Per layer depth value controls:
     scale   = 0.28 + depth × 0.72    → far=tiny, near=large (3× size range)
     opacity = 0.15 + depth × 0.65    → far=dim,  near=bright
     blur    = max(0, (0.4-depth)×10) → far=blurry, ≥0.4 = sharp
     mouseX  = Δx × depth × 90       → far=barely moves, near=flies
     mouseY  = Δy × depth × 70
     scrollY = scrollY × depth × 0.9 → far=slow, near=fast
══════════════════════════════════════════════════ */

/* section scroll doodles — declared here so the scroll listener below can use it */
const sdoodles = [...document.querySelectorAll('[data-sy]')];

const layers = [...document.querySelectorAll('#pworld .pl')].map(el => ({
  el,
  depth: parseFloat(el.dataset.depth || 0.3),
  tx:0, ty:0,   // mouse target
  cx:0, cy:0,   // mouse current (lerped)
  sy:0,         // scroll offset
}));

let heroEl   = document.getElementById('hero');
let heroRect = heroEl.getBoundingClientRect();
let inHero   = false;

window.addEventListener('resize',()=>{ heroRect = heroEl.getBoundingClientRect(); },{passive:true});
heroEl.addEventListener('mouseenter',()=>{ inHero=true; });
heroEl.addEventListener('mouseleave',()=>{ inHero=false; layers.forEach(l=>{ l.tx=0; l.ty=0; }); });

document.addEventListener('mousemove', e => {
  if (!inHero) return;
  const cxH = heroRect.left + heroRect.width  / 2;
  const cyH = heroRect.top  + heroRect.height / 2;
  const dx  = (e.clientX - cxH) / (heroRect.width  / 2);
  const dy  = (e.clientY - cyH) / (heroRect.height / 2);
  layers.forEach(l => {
    l.tx = dx * l.depth * 90;   // near layers move up to ±90px
    l.ty = dy * l.depth * 70;
  });
});

window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  layers.forEach(l => {
    // far layers barely scroll, near layers scroll fast past
    l.sy = sy * l.depth * 0.9;
  });

  // also animate section scroll doodles
  sdoodles.forEach(el => {
    const speed = parseFloat(el.dataset.sy);
    el.style.transform = `translateY(${window.scrollY * speed}px)`;
  });
},{passive:true});

/* Animation loop: lerp mouse position, combine with scroll, apply depth cues */
(function animLayers(){
  layers.forEach(l => {
    l.cx += (l.tx - l.cx) * 0.055;
    l.cy += (l.ty - l.cy) * 0.055;

    const totalX = l.cx;
    const totalY = l.cy + l.sy;

    // ── Depth visual cues ──────────────────────────────
    // Scale: depth 0.04 → 0.31×  |  depth 1.6 → 1.43×
    const scale   = Math.max(0.28, 0.28 + l.depth * 0.72);

    // Opacity: depth 0.04 → 0.04  |  depth 0.62 → 0.10 (very subtle background)
    const opacity = Math.min(0.12, 0.02 + l.depth * 0.10);

    // Blur: only for depth < 0.4  (far layers softened)
    const blur    = Math.max(0, (0.4 - l.depth) * 10);

    l.el.style.transform = `translate(${totalX}px, ${totalY}px) scale(${scale.toFixed(3)})`;
    l.el.style.opacity   = opacity.toFixed(3);
    l.el.style.filter    = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
  });
  requestAnimationFrame(animLayers);
})();

/* ══════════════════════════════════════════════════
   DOODLE PARALLAX WORLD — generated depth layers
   Each entry: [depth, left%, top%, rotateDeg, widthPx, animClass, durationS, file]
══════════════════════════════════════════════════ */
(function buildDoodleWorld() {
  const layers = [
    /* --- FAR (ghost, barely moves) --- */
    [0.04,  6,  9,  -14,  58, 'f2', 14, 'snail'],
    [0.05, 86, 62,   22,  62, 'f1', 12, 'sweet'],
    /* --- FAR --- */
    [0.12,  3, 75,   36,  78, 'f1', 10, 'mushroom'],
    [0.16, 80, 10,  -28,  82, 'f2', 16, 'cactus'],
    /* --- MID-FAR --- */
    [0.28, 14, 45,   18, 112, 'f1', 11, 'cat'],
    [0.36, 68, 58,  -32, 118, 'f2',  9, 'cup'],
    /* --- MID --- */
    [0.50,  5, 24,   44, 158, 'f1', 13, 'snail'],
    [0.62, 82, 80,  -16, 152, 'f2',  8, 'sweet'],
    /* MID-NEAR and above removed — kept background layers only */
  ];

  const pw = document.getElementById('pworld');

  layers.forEach(([depth, lx, ty, rot, w, animCls, dur, file]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'pl';
    wrapper.dataset.depth = depth;
    wrapper.style.cssText = `top:${ty}%;left:${lx}%;`;

    const inner = document.createElement('div');
    inner.className = `pi ${animCls}`;
    inner.style.animationDuration = dur + 's';

    const img = document.createElement('img');
    img.src = `doodle/${file}.svg`;
    img.width = w;
    img.style.cssText = `transform:rotate(${rot}deg);filter:brightness(0) invert(1);display:block;`;
    img.draggable = false;

    inner.appendChild(img);
    wrapper.appendChild(inner);
    pw.appendChild(wrapper);
  });
})();
