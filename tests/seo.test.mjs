import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { makeServer } from '../server.mjs';

const origin = 'https://www.doodoodle.in';
test('all public pages have unique metadata, matching canonicals and valid structured data', async () => {
  const titles = new Set();
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const route of ['/', '/webinar/', '/workshop/']) {
    const html = await readFile(new URL('..' + route + 'index.html', import.meta.url), 'utf8');
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title)); titles.add(title);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.ok(html.includes(`<link rel="canonical" href="${origin}${route}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${origin}${route}">`));
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(graph['@context'], 'https://schema.org');
    assert.ok(graph['@graph'].some(node => node['@type'] === 'WebPage' && node.url === origin + route));
    assert.ok(!graph['@graph'].some(node => node['@type'] === 'Event'), 'Do not invent unscheduled events');
    assert.ok(sitemap.includes(`<loc>${origin}${route}</loc>`));
  }
  assert.ok((await stat(new URL('../assets/og-cover.jpg', import.meta.url))).size > 0);
  assert.ok((await stat(new URL('../assets/instructor/gokul-sketch.jpg', import.meta.url))).size < 300000);
});

test('crawl files, redirects, compression, cache validation and private-file protection', async t => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, type] of [['/robots.txt', 'text/plain'], ['/sitemap.xml', 'application/xml'], ['/assets/og-cover.jpg', 'image/jpeg']]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').startsWith(type));
    await res.arrayBuffer();
  }
  for (const [path, target] of [['/index.html', '/'], ['/webinar/index.html', '/webinar/'], ['/workshop', '/workshop/']]) {
    const res = await fetch(base + path + '?source=test', { redirect: 'manual' });
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), target + '?source=test');
    await res.arrayBuffer();
  }
  const res = await fetch(base + '/', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(res.headers.get('content-encoding'), 'gzip');
  const html = await res.text();
  assert.ok(Number(res.headers.get('content-length')) < Buffer.byteLength(html) / 2);
  const cached = await fetch(base + '/', { headers: { 'If-None-Match': res.headers.get('etag') } });
  assert.equal(cached.status, 304);
  const raw = await fetch(base + '/', { headers: { 'Accept-Encoding': 'gzip;q=0' } });
  assert.equal(raw.headers.get('content-encoding'), null); await raw.arrayBuffer();
  const head = await fetch(base + '/', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  for (const path of ['/.env', '/server.mjs', '/tests/seo.test.mjs', '/missing-page']) {
    const denied = await fetch(base + path);
    assert.equal(denied.status, 404); await denied.arrayBuffer();
  }
});
