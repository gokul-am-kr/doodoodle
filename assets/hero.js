(() => {
  const stage = document.getElementById('artStage');
  if (!stage) return;
  const brandButton = document.createElement('button');
  brandButton.type = 'button';
  brandButton.dataset.select = 'brand';
  brandButton.textContent = 'Doo Doodle';
  brandButton.setAttribute('aria-pressed', 'false');
  document.querySelector('.shape-controls').append(brandButton);
  const buttons = [...document.querySelectorAll('[data-select]')];
  if (!stage || !buttons.length) return;
  const artwork = stage.closest('.orbit');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const wordmark = document.createElement('span');
  wordmark.className = 'hero-wordmark';
  wordmark.textContent = 'doodoodle';
  stage.append(wordmark);
  const butterflyIndex = buttons.findIndex(button => button.dataset.select === 'butterfly');
  let active = butterflyIndex >= 0 ? butterflyIndex : 0, started = false, paused = false, timer;

  function select(index) {
    active = index;
    stage.dataset.shape = buttons[index].dataset.select;
    wordmark.setAttribute('aria-hidden', String(stage.dataset.shape !== 'brand'));
    stage.classList.add('ready');
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  function schedule() {
    clearTimeout(timer);
    if (!started || paused || motion.matches || document.hidden) return;
    timer = setTimeout(() => {
      select((active + 1) % buttons.length);
      schedule();
    }, 1500);
  }

  buttons.forEach((button, i) => button.addEventListener('click', () => { select(i); schedule(); }));
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  function start() {
    if (started) return;
    started = true;
    select(active);
    schedule();
  }
  if (window.doodleIntroPending) document.addEventListener('doodle:intro-end', start, { once: true });
  else requestAnimationFrame(() => requestAnimationFrame(start));
})();
