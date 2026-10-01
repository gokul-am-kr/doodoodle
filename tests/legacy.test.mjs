import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { makeServer } from '../server.mjs';

test('current site is the default and legacy pages and assets stay under /old', async t => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/webinar/', '/workshop/', '/old/', '/old/webinar/', '/old/workshop/']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.equal(html, await readFile(new URL('..' + path + 'index.html', import.meta.url), 'utf8'));
    for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      const url = new URL(match[1], base + path);
      if (url.origin !== base || !/\.(css|js|svg|png|webp|jpg)$/i.test(url.pathname)) continue;
      const asset = await fetch(url);
      assert.equal(asset.status, 200, url.pathname);
      await asset.arrayBuffer();
    }
  }
  for (const path of ['/old', '/old/webinar', '/old/workshop']) {
    const response = await fetch(base + path + '?test=1', { redirect: 'manual' });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), path + '/?test=1');
  }
  for (const path of ['/old/.env', '/old/server.mjs', '/old/tests/server.test.mjs', '/old/.git/config']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
  }
  const manifest = await fetch(base + '/old/gallery/manifest.json');
  assert.match(manifest.headers.get('content-type'), /application\/json/);
  assert.ok((await manifest.json()).length);
});
