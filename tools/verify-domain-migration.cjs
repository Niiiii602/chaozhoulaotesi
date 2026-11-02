const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('node:dns').setDefaultResultOrder('ipv4first');

const origin = 'https://maylendy.com';
const pages = ['/', '/about-us', '/factory-tour', '/products', '/quality-delivery', '/contact', '/qa', '/analytics'];
const report = { origin, at: new Date().toISOString(), pages: [], assets: [], redirects: [], apis: [] };

async function request(url, options = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(new URL(url, origin), { redirect: 'manual', signal: AbortSignal.timeout(30000), ...options });
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  const assets = new Set();
  for (const pathname of pages) {
    const response = await request(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.ok(html.includes('rel="canonical" href="' + origin + pathname + '"'), pathname);
    assert.doesNotMatch(html, /https?:\/\/(?:www\.)?laotes\.com/i, pathname);
    for (const match of html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)) {
      const url = new URL(match[1].replaceAll('&amp;', '&'), origin + pathname);
      if (url.origin === origin && /\.[a-z0-9]{2,5}$/i.test(url.pathname)) assets.add(url.href);
    }
    report.pages.push({ path: pathname, status: response.status, canonical: origin + pathname });
  }
  for (const filename of ['script.js', 'products.js', 'about-us.js', 'qa.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    for (const match of source.matchAll(/assets\/[a-z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg|pdf)/gi)) assets.add(new URL(match[0], origin).href);
  }
  const list = [...assets];
  for (let i = 0; i < list.length; i += 12) {
    await Promise.all(list.slice(i, i + 12).map(async (url) => {
      const response = await request(url, { method: 'HEAD' });
      assert.equal(response.status, 200, url);
      report.assets.push({ url, status: response.status });
    }));
  }
  for (const host of ['laotes.com', 'www.laotes.com', 'www.maylendy.com']) {
    const url = 'https://' + host + '/products.html?utm_source=domain-migration-check';
    const response = await request(url);
    assert.equal(response.status, 301, url);
    assert.equal(response.headers.get('location'), origin + '/products?utm_source=domain-migration-check');
    report.redirects.push({ url, status: response.status, location: response.headers.get('location') });
  }
  const health = await request('/api/health');
  const healthData = await health.json();
  assert.equal(health.status, 200);
  assert.equal(healthData.channel, 'zoho');
  assert.equal(healthData.trackKv.bound, true);
  report.apis.push({ path: '/api/health', status: health.status, channel: healthData.channel });
  const unauthorized = await request('/api/analytics');
  assert.equal(unauthorized.status, 401);
  report.apis.push({ path: '/api/analytics', status: 401, protected: true });
  const fields = { name: 'Domain migration verification', company: 'LAOTESI website self-check', email: healthData.to, country: 'Internal check', category: 'Stainless steel food storage', quantity: '1000', message: '[Migration self-test - not a customer enquiry] Checking maylendy.com Contact delivery after the domain migration. No quotation or reply is needed.', _page: origin + '/contact?utm_source=domain-migration-check' };
  const blocked = await request('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, message: 'gOoGlE SEO marketing services' }) });
  const blockedData = await blocked.json();
  assert.equal(blocked.status, 422);
  assert.equal(blockedData.error, 'marketing_content');
  report.apis.push({ path: '/api/quote', status: 422, marketingBlocked: true });
  if (process.argv.includes('--send-test')) {
    const delivered = await request('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    const delivery = await delivered.json();
    assert.equal(delivered.status, 200, JSON.stringify(delivery));
    assert.equal(delivery.ok, true);
    assert.ok(delivery.id, 'Mail provider must acknowledge a message id');
    report.delivery = { to: healthData.to, status: delivered.status, channel: delivery.channel, id: delivery.id };
  }
  const directory = path.join(__dirname, '..', '.wrangler');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'domain-migration-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pages: report.pages.length, assets: report.assets.length, redirects: report.redirects.length, apis: report.apis, delivery: report.delivery, report: '.wrangler/domain-migration-report.json' }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
