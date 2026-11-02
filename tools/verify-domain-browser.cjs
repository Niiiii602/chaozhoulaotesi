const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const directory = path.join(__dirname, '..', '.wrangler');
  fs.mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      let errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const pathname of ['/', '/about-us', '/factory-tour', '/products', '/quality-delivery', '/contact', '/qa', '/analytics']) {
        errors = [];
        const response = await page.goto('https://maylendy.com' + pathname + '?utm_source=domain-migration-check', { waitUntil: 'load', timeout: 60000 });
        assert.equal(response.status(), 200, pathname);
        await page.waitForTimeout(700);
        const state = await page.evaluate(() => ({
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          width: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          quoteHeadingColor: document.querySelector('.quote-intro h2') ? getComputedStyle(document.querySelector('.quote-intro h2')).color : null,
          brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
          oldWebsiteLinks: [...document.querySelectorAll('a[href], img[src], script[src], link[href]')].map((element) => element.href || element.src).filter((url) => /^https?:\/\/(?:www\.)?laotes\.com/i.test(url)),
        }));
        assert.deepEqual(errors, [], pathname + ' JavaScript errors');
        assert.deepEqual(state.brokenImages, [], pathname + ' broken images');
        assert.deepEqual(state.oldWebsiteLinks, [], pathname + ' old website links');
        assert.ok(state.documentWidth <= state.width + 2, pathname + ' horizontal overflow');
        assert.equal(state.canonical, 'https://maylendy.com' + pathname);
        if (pathname === '/contact') assert.notEqual(state.quoteHeadingColor, 'rgb(255, 254, 250)', 'Contact heading must not be white on the paper background');
        if (['/', '/products', '/contact', '/analytics'].includes(pathname)) {
          const name = pathname === '/' ? 'home' : pathname.slice(1);
          await page.screenshot({ path: path.join(directory, 'maylendy-' + name + '-' + viewport.width + '.png'), fullPage: false });
        }
        results.push({ path: pathname, viewport: viewport.width, ...state });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(directory, 'domain-migration-browser-report.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ checks: results.length, brokenImages: 0, oldWebsiteLinks: 0, javascriptErrors: 0, horizontalOverflow: 0 }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
