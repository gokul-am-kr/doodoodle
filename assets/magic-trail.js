(() => {
  'use strict';

  // Magic Ink Cursor Trail for Doo Doodle
  // Emits whimsical hand-drawn doodle sparks (stars, squiggles, bubbles, hearts, flowers)
  // Highly optimized: 0% CPU when pointer is idle, disabled on reduced-motion or touch devices.

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  if (reducedMotion.matches || !finePointer.matches) return;

  const colors = ['#526ce6', '#ffcf40', '#ff8ca4', '#48bb8b', '#20211f'];
  const shapes = ['star', 'squiggle', 'bubble', 'heart', 'flower', 'smile'];

  let canvas, ctx;
  let particles = [];
  let animId = null;
  let isRunning = false;
  let lastX = 0, lastY = 0;
  let enabled = true;

  function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'magicCursorCanvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize, { passive: true });
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticle(x, y, vx, vy) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = shape === 'bubble' || shape === 'flower' ? 7 + Math.random() * 6 : 8 + Math.random() * 8;
    return {
      x, y,
      vx: (vx || (Math.random() - 0.5) * 1.4) * 0.4 + (Math.random() - 0.5) * 0.6,
      vy: (vy || (Math.random() - 0.5) * 1.4) * 0.4 - 0.4 - Math.random() * 0.5,
      size,
      color,
      shape,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.08,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.015,
      scale: 0.2
    };
  }

  function drawShape(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.scale(p.scale, p.scale);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 0.9));

    const s = p.size;
    const c = p.color;

    switch (p.shape) {
      case 'star': {
        // 4-pointed sparkle
        ctx.beginPath();
        const rOuter = s, rInner = s * 0.26;
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? rOuter : rInner;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = c;
        ctx.fill();
        break;
      }
      case 'squiggle': {
        // Cute spiral squiggle
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 1.6);
        ctx.strokeStyle = c;
        ctx.lineWidth = Math.max(1.8, s * 0.22);
        ctx.lineCap = 'round';
        ctx.stroke();
        break;
      }
      case 'bubble': {
        // Hollow bubble with tiny highlight
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = c;
        ctx.lineWidth = Math.max(1.4, s * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.16, -s * 0.16, s * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        break;
      }
      case 'heart': {
        // Whimsical doodle heart
        const h = s * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.3);
        ctx.bezierCurveTo(-h, -h * 0.6, -h * 0.9, h * 0.5, 0, h);
        ctx.bezierCurveTo(h * 0.9, h * 0.5, h, -h * 0.6, 0, h * 0.3);
        ctx.fillStyle = c;
        ctx.fill();
        break;
      }
      case 'flower': {
        // Five-petal daisy
        const petals = 5;
        const pr = s * 0.35;
        for (let i = 0; i < petals; i++) {
          const a = (i * Math.PI * 2) / petals;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * pr, Math.sin(a) * pr, pr * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = c;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, pr * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcf40';
        ctx.fill();
        break;
      }
      case 'smile': {
        // Little curve smile with two eye dots
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.strokeStyle = c;
        ctx.lineWidth = Math.max(1.6, s * 0.2);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-s * 0.22, -s * 0.12, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.22, -s * 0.12, s * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  function loop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.angle += p.vAngle;
      p.life -= p.decay;

      // Pop in then smoothly fade
      if (p.scale < 1.0) p.scale = Math.min(1.0, p.scale + 0.18);
      else p.scale = Math.max(0.2, p.life);

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      drawShape(p);
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      isRunning = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function onPointerMove(e) {
    if (!enabled || !canvas) return;

    // Do not draw trail over the doodle canvas itself
    const target = e.target;
    if (target && (target.id === 'doodleCanvas' || target.closest('.canvas-wrap'))) {
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);

    if (dist >= 18) {
      const vx = dx * 0.1;
      const vy = dy * 0.1;
      particles.push(createParticle(e.clientX, e.clientY, vx, vy));

      if (dist > 40 && particles.length < 35) {
        particles.push(createParticle(e.clientX - dx * 0.5, e.clientY - dy * 0.5, vx * 0.8, vy * 0.8));
      }

      if (particles.length > 35) particles.shift();

      lastX = e.clientX;
      lastY = e.clientY;

      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(loop);
      }
    }
  }

  function start() {
    initCanvas();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.toggleMagicTrail = (state) => {
    enabled = typeof state === 'boolean' ? state : !enabled;
    if (!enabled && isRunning) {
      particles = [];
      isRunning = false;
      if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    return enabled;
  };
})();
