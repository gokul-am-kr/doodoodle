/* ══════════════════════════════════════════════════
   DOODLE COVER → RAIN  — screen starts fully covered,
   doodles fall away revealing the site beneath
══════════════════════════════════════════════════ */
(function doodleRain() {
  const DOODLES = ['cactus','cat','cup','mushroom','snail','sweet'];
  const COLORS  = [
    'brightness(0) invert(1)',                                             // white
    'brightness(0) invert(1) sepia(1) saturate(8) hue-rotate(-15deg)',    // coral
    'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(8deg)',      // gold
    'brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(160deg)',    // mint
  ];
  const COUNT = 100;

  const rain = document.createElement('div');
  rain.id = 'doodle-rain';
  document.body.appendChild(rain);
  document.body.style.overflow = 'hidden'; // no scroll during intro
  document.body.classList.add('site-hidden');  // hide site content under cover

  for (let i = 0; i < COUNT; i++) {
    const img   = document.createElement('img');
    const size  = Math.round(22 + Math.random() * 62);          // 22–84 px
    const x     = (-4 + Math.random() * 108).toFixed(1);        // -4% to 104% (bleed edges)
    const y     = (-4 + Math.random() * 108).toFixed(1);        // -4% to 104% (full height)
    const r0    = Math.round(Math.random() * 360);
    const r1    = r0 + 60 + Math.round(Math.random() * 240);
    const op    = (0.55 + Math.random() * 0.45).toFixed(2);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    // stagger: all pause on screen first (0.15s min), then fall with spread
    const delay = (0.15 + Math.random() * 0.35).toFixed(3);     // 0.15–0.5 s
    const dur   = (0.7  + Math.random() * 0.5).toFixed(3);      // 0.7–1.2 s

    img.src = `doodle/${DOODLES[i % DOODLES.length]}.svg`;
    img.draggable = false;
    img.style.cssText =
      `position:absolute;top:${y}%;left:${x}%;width:${size}px;` +
      `filter:${color};--r0:${r0}deg;--r1:${r1}deg;--op:${op};` +
      `will-change:transform;` +
      `animation:doodle-fall ${dur}s ease-in ${delay}s both;`;
    rain.appendChild(img);
  }

  // All doodles out by: maxDelay(0.5) + maxDur(1.2) = 1.7s → reveal at 1.8s
  // bg fades (0.7s → done at 2.5s), site animates in simultaneously
  // opacity fades (0.5s → done at 3.0s), removed
  setTimeout(() => {
    rain.style.background = 'transparent';          // fade dark cover
    document.body.classList.remove('site-hidden');  // trigger site entrance
    document.body.classList.add('site-revealed');
    setTimeout(() => {
      rain.style.opacity = '0';                     // fade any lingering doodles
      setTimeout(() => {
        rain.remove();
        document.body.classList.remove('site-revealed');
        document.body.style.overflow = '';          // restore scrolling
      }, 520);
    }, 700);
  }, 1800);
})();
