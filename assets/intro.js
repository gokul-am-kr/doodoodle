(() => {
  'use strict';

  const overlay = document.getElementById('brandIntro');
  if (!overlay) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    overlay.remove();
    window.doodleIntroPending = false;
    document.dispatchEvent(new Event('doodle:intro-end'));
    return;
  }

  // The overlay also plays on hash URLs. Keep the hero paused until it ends.
  window.doodleIntroPending = true;

  const line = document.getElementById('introThread');
  const logo = document.getElementById('introLogo');
  const skipBtn = overlay.querySelector('.intro-skip');

  let finished = false;
  let raf = null;

  function finish() {
    if (finished) return;
    finished = true;
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(failsafe);

    window.doodleIntroPending = false;
    document.dispatchEvent(new Event('doodle:intro-end'));

    overlay.classList.add('intro-done');
    setTimeout(() => {
      if (overlay.parentElement) overlay.remove();
    }, 550);
  }

  // Failsafe: auto-release after 6.5s so user is never stuck
  const failsafe = setTimeout(finish, 6500);

  if (skipBtn) skipBtn.addEventListener('click', finish);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') finish();
  });
  reducedMotion.addEventListener('change', e => {
    if (e.matches) finish();
  });

  if (!line || !logo) {
    finish();
    return;
  }

  // A single uninterrupted pen path: d o o d o o d l e.
  const word = 'M 100 287 C 117 285 125 265 133 247 C 148 210 183 212 177 250 C 171 293 126 299 128 268 C 132 226 187 174 195 133 C 207 77 168 130 172 197 C 174 242 164 283 183 285 C 204 286 211 245 230 231 C 259 209 268 243 252 270 C 235 300 205 291 214 262 C 223 236 251 235 267 247 C 281 258 283 249 294 235 C 318 211 339 231 327 262 C 315 299 278 297 285 265 C 290 241 312 229 336 248 C 350 258 358 245 369 235 C 391 213 413 227 402 259 C 390 292 361 297 359 272 C 355 232 414 178 426 135 C 442 76 400 126 399 191 C 399 238 393 282 413 285 C 435 287 445 244 462 232 C 489 212 507 238 491 268 C 475 297 440 296 448 263 C 454 239 483 232 506 250 C 521 260 525 243 539 233 C 564 213 583 237 568 267 C 551 299 518 295 526 264 C 533 239 558 232 584 250 C 600 259 609 241 621 232 C 645 213 662 240 649 268 C 635 296 602 294 609 265 C 615 232 666 176 677 134 C 691 78 651 124 650 192 C 650 236 645 282 664 285 C 686 289 710 209 727 164 C 747 107 724 101 707 152 C 690 205 682 280 705 285 C 726 289 744 251 761 238 C 792 215 813 229 792 248 C 780 258 756 261 745 265 C 732 296 782 301 812 275 C 830 260 847 267 865 278 C 880 287 894 280 901 270';
  // Centreline of the Doo Doodle rose/spiral loop
  const loop = 'M 595 218 C 489 99 331 67 229 119 C 92 181 31 367 56 530 C 88 765 260 971 471 1008 C 663 1046 873 967 1027 831 C 1175 705 1302 502 1300 354 C 1297 190 1231 48 1070 49 C 875 48 691 174 585 264 C 487 350 463 469 509 569 C 548 656 621 668 661 600 C 733 476 650 286 596 223 C 701 141 812 139 885 222 C 976 323 958 484 922 634 C 888 779 825 936 735 992';

  let a, b, totalLen;
  try {
    function samples(d, map) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      const length = p.getTotalLength();
      return Array.from({ length: 420 }, (_, i) => {
        const q = p.getPointAtLength(length * i / 419);
        return map ? map(q) : { x: q.x, y: q.y };
      });
    }

    a = samples(word);
    b = samples(loop, p => ({
      x: 340 + p.x * 320 / 1347.77,
      y: 250 + (p.y - 542.2) * 320 / 1347.77
    }));

    line.setAttribute('d', word);
    totalLen = line.getTotalLength();
    line.style.strokeDasharray = totalLen;
    line.style.strokeDashoffset = totalLen;
  } catch (err) {
    console.warn('SVG intro fallback:', err);
    finish();
    return;
  }

  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  let startTime;

  function tick(now) {
    if (finished) return;
    if (startTime === undefined) startTime = now;
    const elapsed = now - startTime;

    // 1. Draw "doodoodle" cursive script (0 to 2200ms)
    if (elapsed < 2200) {
      const progress = Math.min(1, elapsed / 2200);
      line.style.strokeDashoffset = totalLen * (1 - ease(progress));
    }
    // 2. Pause briefly on completed text (2200 to 2600ms)
    else if (elapsed < 2600) {
      line.style.strokeDashoffset = 0;
    }
    // 3. Morph from letters into Doo Doodle spiral (2600 to 3800ms)
    else if (elapsed < 3800) {
      line.style.strokeDasharray = 'none';
      const k = ease((elapsed - 2600) / 1200);
      line.setAttribute('d', a.map((p, i) => (i ? 'L' : 'M') + (p.x + (b[i].x - p.x) * k).toFixed(2) + ' ' + (p.y + (b[i].y - p.y) * k).toFixed(2)).join(' '));
      line.setAttribute('stroke-width', (6 + 17 * k).toFixed(2));
    }
    // 4. Crossfade from SVG stroke to actual Doo Doodle rose logo (3800 to 4200ms)
    else if (elapsed < 4200) {
      const k = (elapsed - 3800) / 400;
      line.style.opacity = Math.max(0, 1 - k);
      logo.style.opacity = Math.min(1, k);
    }
    // 5. Fly logo toward hero stage and reveal site (4200ms+)
    else {
      line.style.opacity = 0;
      logo.style.opacity = 1;
      const target = document.querySelector('#artStage .logo');
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          logo.style.left = (rect.left + rect.width / 2) + 'px';
          logo.style.top = (rect.top + rect.height / 2) + 'px';
          logo.style.width = rect.width + 'px';
          logo.style.height = rect.height + 'px';
        }
      }
      setTimeout(finish, 850);
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  // Start immediately!
  raf = requestAnimationFrame(tick);
})();
