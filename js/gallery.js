/* ══════════════════════════════════════════════════
   GALLERY IMAGES
   ► Drop images into the gallery/ folder
   ► Add the filename to the array below
   ► Works when opening the file directly (no server needed)
══════════════════════════════════════════════════ */
const GALLERY_FILES = [
  "IMG_4159 2.JPG",
  "IMG_4159.JPG",
  "IMG_4160.JPG",
  "IMG_4161.JPG"
  // add more here: "my-photo.jpg",
];

(async function initGallery() {
  const grid = document.getElementById('galGrid');
  const ROTS = [-1.8, 2.2, -0.6, 1.5];
  let images = [...GALLERY_FILES];

  /* bonus: if served via HTTP, also try manifest.json for extra images */
  if (location.protocol !== 'file:') {
    try {
      const r = await fetch('gallery/manifest.json');
      if (r.ok) {
        const extra = await r.json();
        // merge, dedupe
        images = [...new Set([...images, ...extra])];
      }
    } catch(_) {}
  }

  if (!images.length) {
    grid.innerHTML = '<p style="text-align:center;padding:60px;color:var(--dim)">Add images to the GALLERY_FILES array in js/gallery.js.</p>';
    return;
  }

  /* render cards */
  grid.innerHTML = '';
  images.forEach((file, i) => {
    const item = document.createElement('div');
    item.className = 'gal-item';
    item.style.cssText = `--gr:${ROTS[i % ROTS.length]}deg;transition-delay:${(i % 4) * 90}ms`;
    item.dataset.idx = i;
    item.innerHTML = `
      <img src="gallery/${encodeURIComponent(file)}" alt="Student artwork ${i+1}" loading="lazy">
      <div class="gal-ov">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>`;
    item.addEventListener('click', () => openLb(i));
    grid.appendChild(item);
  });

  /* reveal via IntersectionObserver defined in ui.js */
  document.querySelectorAll('.gal-item').forEach(el => io.observe(el));

  /* ── Lightbox ── */
  const lb      = document.getElementById('gal-lb');
  const lbImg   = document.getElementById('lb-img');
  const lbCount = document.getElementById('lb-count');
  let cur = 0;

  function openLb(idx) {
    cur = idx;
    lbImg.style.opacity = '0';
    lbImg.src = 'gallery/' + encodeURIComponent(images[idx]);
    lbImg.onload = () => { lbImg.style.opacity = '1'; };
    lbCount.textContent = `${idx + 1} / ${images.length}`;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function nav(d)    { openLb((cur + d + images.length) % images.length); }

  document.querySelector('.lb-prev').onclick  = () => nav(-1);
  document.querySelector('.lb-next').onclick  = () => nav(1);
  document.querySelector('.lb-close').onclick = closeLb;
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  nav(-1);
    if (e.key === 'ArrowRight') nav(1);
    if (e.key === 'Escape')     closeLb();
  });
})();
