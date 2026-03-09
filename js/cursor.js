/* ══════════════════════════════════════════════════
   CURSOR
══════════════════════════════════════════════════ */
const dot  = document.getElementById('cdot');
const ring = document.getElementById('cring');
let mx=-200, my=-200, rx=-200, ry=-200;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx+'px'; dot.style.top = my+'px';
});
(function animRing(){
  rx += (mx-rx)*0.12; ry += (my-ry)*0.12;
  ring.style.left = rx+'px'; ring.style.top = ry+'px';
  requestAnimationFrame(animRing);
})();
document.querySelectorAll('button,a,.mc,.bi,.sc,.tc,.pc').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));
});

/* ── DOODLE TRAIL ────────────────────────────────────
   5 tiny doodle SVGs trail behind the cursor with
   increasing lag; fade out when cursor is idle.     */
(function doodleTrail(){
  const FILES  = ['cactus','cat','cup','snail','sweet'];
  const SIZES  = [22, 25, 20, 28, 24];
  const LERPS  = [0.058, 0.046, 0.036, 0.028, 0.020];
  const OPACS  = [0.22, 0.18, 0.14, 0.10, 0.07];
  const ROTS   = [0, 48, 96, 144, 192];   // base rotation per element

  const trail = FILES.map((f, i) => {
    const img = document.createElement('img');
    img.src = (window.DOODLE_PATH || 'doodle/') + f + '.svg';
    img.style.cssText = [
      'position:fixed',
      `width:${SIZES[i]}px`,
      'pointer-events:none',
      'z-index:9850',
      'filter:brightness(0) invert(1)',
      'opacity:0',
      `transform:translate(-50%,-50%) rotate(${ROTS[i]}deg)`,
      'will-change:transform',
      'transition:opacity .5s ease',
    ].join(';');
    document.body.appendChild(img);
    return { el: img, x: -300, y: -300, lerp: LERPS[i], opacity: OPACS[i], rot: ROTS[i] };
  });

  let idleTimer = null;
  let cursorMoved = false;

  document.addEventListener('mousemove', () => {
    if (!cursorMoved) {
      // First move — fade in
      cursorMoved = true;
      trail.forEach(t => { t.el.style.opacity = t.opacity; });
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      trail.forEach(t => { t.el.style.opacity = '0'; });
      cursorMoved = false;
    }, 1200);
  });

  let trailTick = 0;
  (function animTrail(){
    trail.forEach((t, i) => {
      t.x += (mx - t.x) * t.lerp;
      t.y += (my - t.y) * t.lerp;
      t.rot += 0.18 * (i % 2 === 0 ? 1 : -1);
      t.el.style.left = t.x + 'px';
      t.el.style.top  = t.y + 'px';
      t.el.style.transform = `translate(-50%,-50%) rotate(${t.rot.toFixed(1)}deg)`;
    });
    trailTick++;
    requestAnimationFrame(animTrail);
  })();
})();
