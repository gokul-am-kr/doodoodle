(() => {
  if (typeof window.Lenis !== 'function') return;

  const lenis = new window.Lenis({
    autoRaf: true,
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    allowNestedScroll: true,
    prevent: node => node.matches('dialog, [data-lenis-prevent]'),
  });

  // Native dialogs must keep their own scroll while the page stays still.
  const syncDialogs = () => {
    if (document.querySelector('dialog[open]')) lenis.stop();
    else lenis.start();
  };
  new MutationObserver(syncDialogs).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['open'],
  });
  syncDialogs();

  // Run after the feature handlers so links that open dialogs remain theirs.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;
    let id;
    try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target || lenis.isStopped) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    lenis.scrollTo(target, {
      onComplete: () => {
        const temporaryTabindex = !target.hasAttribute('tabindex');
        if (temporaryTabindex) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (temporaryTabindex) target.removeAttribute('tabindex');
      },
    });
  });
})();
