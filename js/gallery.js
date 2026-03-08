/* ══════════════════════════════════════════════════
   GALLERY — dual marquee rows
   ─────────────────────────────────────────────────
   OPTION A — Google Drive folder (auto-loads all images):
     1. Create a folder in Google Drive
     2. Right-click → Share → "Anyone with the link" → Viewer
     3. Copy the folder ID from the URL:
        drive.google.com/drive/folders/THIS_PART_IS_THE_ID
     4. Go to console.cloud.google.com → New project
        → Enable "Google Drive API"
        → Credentials → Create API Key
        → Restrict it to "HTTP referrers" → your domain
     5. Paste both below and leave GALLERY_FILES empty

   OPTION B — local files:
     Leave DRIVE_FOLDER_ID empty, add filenames to GALLERY_FILES
══════════════════════════════════════════════════ */

const DRIVE_FOLDER_ID = '';          // ← paste your folder ID here
const DRIVE_API_KEY   = '';          // ← paste your API key here

const GALLERY_FILES = [
  "IMG_4159 2.JPG",
  "IMG_4159.JPG",
  "IMG_4160.JPG",
  "IMG_4161.JPG"
];

/* ── Image source helper ───────────────────────────
   Returns array of { src, thumb, label } objects    */
async function resolveImages() {
  /* Drive folder configured → fetch from API */
  if (DRIVE_FOLDER_ID && DRIVE_API_KEY) {
    try {
      const q   = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed=false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime%20desc&pageSize=100&key=${DRIVE_API_KEY}&fields=files(id,name)`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Drive API error ' + res.status);
      const data = await res.json();
      if (!data.files || !data.files.length) throw new Error('No images found in folder');
      return data.files.map(f => ({
        /* Full-size view URL — works for publicly shared files */
        src:   `https://lh3.googleusercontent.com/d/${f.id}=s1600`,
        /* Thumbnail for the marquee (faster load) */
        thumb: `https://lh3.googleusercontent.com/d/${f.id}=s400`,
        label: f.name
      }));
    } catch (err) {
      console.warn('[Gallery] Drive fetch failed, falling back to local files:', err.message);
    }
  }

  /* Fallback → local files */
  let files = [...GALLERY_FILES];
  if (location.protocol !== 'file:') {
    try {
      const r = await fetch('gallery/manifest.json');
      if (r.ok) {
        const extra = await r.json();
        files = [...new Set([...files, ...extra])];
      }
    } catch(_) {}
  }
  return files.map(f => ({
    src:   'gallery/' + encodeURIComponent(f),
    thumb: 'gallery/' + encodeURIComponent(f),
    label: f
  }));
}

/* ── Main ─────────────────────────────────────────── */
(async function initGallery() {
  const wrap = document.getElementById('galGrid');
  wrap.innerHTML = '<p style="text-align:center;padding:60px;color:var(--dim)">Loading…</p>';

  const images = await resolveImages();

  if (!images.length) {
    wrap.innerHTML = '<p style="text-align:center;padding:60px;color:var(--dim)">No images found. Add images to the gallery/ folder or configure DRIVE_FOLDER_ID.</p>';
    return;
  }

  wrap.innerHTML = '';
  wrap.className = 'gal-marquee-wrap';

  const ROTS = [-1.8, 2.2, -0.6, 1.5, -1.2, 1.8];

  /* Repeat images until we have enough to fill the screen width seamlessly */
  function fillTrack(imgs) {
    const minCount = Math.max(10, Math.ceil(14 / imgs.length) * imgs.length);
    const out = [];
    while (out.length < minCount) out.push(...imgs);
    return out;
  }

  const row1 = fillTrack(images);
  const row2 = fillTrack([...images].reverse());

  function buildTrack(imgs, reverse) {
    const track = document.createElement('div');
    track.className = 'gal-track' + (reverse ? ' rev' : '');

    /* Duplicate so CSS -50% translateX loops seamlessly */
    [...imgs, ...imgs].forEach((img, i) => {
      const origIdx = images.indexOf(img);
      const item    = document.createElement('div');
      item.className = 'gal-item';
      item.style.setProperty('--gr', ROTS[i % ROTS.length] + 'deg');
      item.innerHTML = `
        <img src="${img.thumb}" alt="${img.label}" loading="lazy" draggable="false">
        <div class="gal-ov">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </div>`;
      item.addEventListener('click', () => openLb(origIdx >= 0 ? origIdx : i % images.length));
      track.appendChild(item);
    });

    return track;
  }

  wrap.appendChild(buildTrack(row1, false));
  wrap.appendChild(buildTrack(row2, true));

  /* ── Lightbox ── */
  const lb      = document.getElementById('gal-lb');
  const lbImg   = document.getElementById('lb-img');
  const lbCount = document.getElementById('lb-count');
  let cur = 0;

  function openLb(idx) {
    cur = idx;
    lbImg.style.opacity = '0';
    lbImg.src = images[idx].src;
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
