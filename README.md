# Doo Doodle website

The current website is served at `/`. The previous website is preserved at `/old/`,
with its webinar and workshop pages at `/old/webinar/` and `/old/workshop/`.
Both versions work on static hosting (including GitHub Pages) and with `npm start`.
The existing CNAME and Git repository are retained.

The legacy homepage was recovered from commit `cf104b6` because the local
`index.html` was empty at migration time. Its other files use the local versions.

# Doo Doodle website

The redesigned site now includes the functional flows from the sibling `../doodoodle` project, while keeping its handwriting intro, illustrated hero, colours and 21-lesson preview. The original project was read only; its empty working-copy homepage was inspected through Git history.

## Run

Use Node.js 22 or later:

    npm start

Open http://localhost:8000. No runtime packages or build step are needed.

The site and checkout can be hosted as static files; Node is optional for local preview. `python3 -m http.server 8000` also works. Checkout uses the original account's browser-only Razorpay popup and does not call the local payment API.

## Features

- Course enrolment: validated name, age and mobile; lifetime access ₹1,499.
- Add-ons: art kit ₹499 and T-shirt ₹499; size and Indian delivery address required only when needed.
- Circle reward: FIRSTMARK gives ₹150 off; reward checkout starts at ₹1,349.
- Drawing: mouse, pen and touch, clear, colour picker, PNG download and resize preservation.
- Payments: original Razorpay popup, course/add-on/discount totals, browser-reported Google Sheets logging and WhatsApp follow-up.
- Webinar: `/webinar/`, preferred date, published slot loading and registration/contact fallback.
- Workshops: `/workshop/`, kids, adults, family and corporate tracks.
- Notify me: email/mobile form using the existing Apps Script endpoint.
- Gallery: all 11 community images and four transformations; scrolling rows, pause, lightbox, arrows, swipe and keyboard controls.
- Reviews: manual selector, autoplay and pause.
- Policies: dialog in footer and checkout, retaining the reference’s terms.
- Visual interactions: instructor photo/parallax, card tilt, button glow, doodle cursor trail and confetti.
- Existing redesigned features retained: intro/skip, hero selection, mobile navigation, scroll reveals, curriculum, workbook, FAQ and contact links.

Native dialogs support Escape, focus containment and restored focus. Reduced-motion preferences are respected; hover effects are desktop-only.

## SEO and performance

All three pages include unique titles/descriptions, canonical URLs, Open Graph/Twitter previews and static JSON-LD. The homepage describes the organization, website and current course; event-interest pages use WebPage and breadcrumb data, not fabricated event dates or ratings. The public origin is `https://www.doodoodle.in`: update metadata, JSON-LD, robots.txt and sitemap.xml together if the production domain changes.

The Node server serves robots.txt and sitemap.xml, redirects index.html URLs to their canonical paths, compresses text/SVG responses with gzip, and uses ETags with revalidation to avoid stale assets. API responses remain uncached. Static/CDN hosting must configure equivalent compression, caching and redirects independently. The displayed sketch is a smaller 900px JPEG; its original PNG is retained. Social previews use the local 1200×630 assets/og-cover.jpg.

Before launch: configure HTTPS and a non-www → www redirect at the host, protect staging from indexing, verify all three production URLs, validate structured data in Google's Rich Results Test, and submit `/sitemap.xml` in Search Console. Real ranking, indexing and Core Web Vitals require production measurements; metadata alone does not guarantee search placement. Run `npm test` for SEO and server regression checks.

## Payment configuration

`assets/site-config.js` contains the original site's public `razorpayKeyId` and Apps Script `registrationUrl`. No API secret or backend deployment is needed by the current frontend. The legacy server payment APIs remain available in source but are not used by this checkout.

This intentionally mirrors the original account's client-only integration, which the owner reports is capturing/settling payments. It does not create Orders API orders or independently verify amounts, signatures or capture. Razorpay's current standard integration documentation requires orders and warns that orderless payments cannot be captured; this legacy account's compatibility must be checked on the deployed domain before launch. Do not assume it works for another account. See [Razorpay’s integration guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

Spreadsheet `SUCCESS` records preserve the original contract but are browser-reported, not proof of payment; an additional `verification: browser_callback_unverified` field makes this explicit. Reconcile each payment ID, captured status and amount in the Razorpay dashboard before granting access or shipping add-ons. Client prices and callbacks can be modified. No automatic course delivery is enabled. An opaque Apps Script response cannot prove spreadsheet delivery.

Success callbacks disable repeat checkout for the current page session and show the payment reference even if registration logging fails. Reloading is not a durable duplicate-payment safeguard. Keep the reference and contact the team rather than paying again. All development tests mock payment and registration services: no real charges, spreadsheet writes or deployment were performed.

## Configure registrations

Public settings are in `assets/site-config.js`:

- `registrationUrl` carries over the reference Apps Script endpoint and its `notify`/`workshop` payloads.
- `webinarUrl` is blank because the reference contains only a placeholder. The validated form prepares an explicit WhatsApp link with the chosen details until a working endpoint is supplied. The user sends the request themselves.
- `slotsUrl` uses the reference’s published Google Sheet CSV: column A is a slot label, column B must be `TRUE`. Quoted commas are supported. Empty/unreachable feeds offer a request for available times instead of inventing slots. Dates are preferences, not confirmed bookings.
- Apps Script responses are opaque across origins. Forms report that a request was sent without claiming confirmed spreadsheet delivery; network errors remain retryable.
- Personal details are not saved in browser local storage.

The reference policy includes both a 10-day guarantee and an exclusion for digital products after access. That ambiguity is disclosed in the policy dialog rather than silently changing the owner’s terms.

## Files

- `index.html`: homepage, original styles, illustrated hero and intro hooks.
- `assets/features.js`, `assets/features.css`: forms, dialogs, drawing, gallery and interactions.
- `assets/site-config.js`: public endpoints and contacts.
- `assets/intro.js`, `assets/intro.css`: original handwriting intro.
- `assets/hero.js`, `assets/hero.css`: open hero artwork with smooth pop-in transitions, a 1.5-second autoplay cycle, logo rotation, a final logo with black Fredoka wordmark, manual selection and pause controls.
- `assets/gallery/`, `assets/doodles/`, `assets/instructor/`: reference artwork.
- `webinar/index.html`, `workshop/index.html`: event registration pages.
- `server.mjs`: dependency-free static server and payment APIs.
- `tests/server.test.mjs`: pricing, validation, signatures, API behaviour and private-file protection.
- `tests/browser.mjs`: browser checks with external services mocked.

## Verify

    npm test

Browser checks need Playwright/Chromium and the local server on port 8000. Run `node tests/browser.mjs` when Playwright is installed locally, or pass the installed Playwright `index.mjs` path as the first argument. Screenshots are saved to `/tmp/doodoodle-*.png`.

The browser checks cover totals, conditional fields, unavailable checkout, nested dialogs, drawing/coupon redemption, PNG export, gallery controls/focus, notification retries, CSV slots, webinar fallback, workshop payloads, mocked payment, mobile navigation and overflow.

`node tests/static-checkout.mjs [path-to-playwright/index.mjs]` checks the client-only checkout on HTTP and file URLs: all add-on totals, cancellation/retry, failure logging, success with logging failure, duplicate callbacks and absence of backend requests. All external services are mocked.

## Host

For static hosting publish `index.html`, `assets/`, `webinar/`, `workshop/`, `robots.txt` and `sitemap.xml`. No Node backend is required for the configured checkout. Configure compression and redirects at your static host and verify payment capture on the production domain. Never publish `.env` or put secrets in browser JavaScript. Fonts load from Google Fonts with offline fallbacks.
