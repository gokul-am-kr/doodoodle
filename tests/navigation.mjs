import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch();
try {
  for (const home of ['http://localhost:8000/index.html', pathToFileURL(resolve('index.html')).href]) {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.route('https://**/*', route => route.abort());
    for (const section of ['webinar', 'workshop']) {
      await page.goto(home + '#workshops');
      await page.locator(`#workshops a[href^="${section}/"]`).click();
      console.log(JSON.stringify({ mode: new URL(home).protocol, section, url: page.url(), title: await page.title() }));
      assert.equal(await page.locator(`#${section}-form`).count(), 1, `${section} page must open from ${home}`);
      await page.getByRole('link', { name: '← Home', exact: true }).click();
      assert.equal(await page.locator('#workshops').count(), 1, 'Home link returns to the website');
    }
    await page.close();
  }
  console.log('Webinar/workshop navigation passes over HTTP and direct file opening.');
} finally { await browser.close(); }
