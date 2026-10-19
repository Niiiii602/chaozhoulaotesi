const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const pages = new Map([
  ['/', 'index.html'],
  ['/about-us', 'about-us.html'],
  ['/factory-tour', 'factory-tour.html'],
  ['/products', 'products.html'],
  ['/quality-delivery', 'quality-delivery.html'],
  ['/contact', 'contact.html'],
  ['/qa', 'qa.html'],
]);
const read = (filename) => fs.readFileSync(path.join(project, filename), 'utf8');

function loadWorker() {
  const assets = [];
  const sandbox = {
    Request, Response, Headers, URL, URLSearchParams,
    Uint8Array, TextEncoder, TextDecoder, Date, Math,
    console, setTimeout, clearTimeout, atob, btoa,
  };
  vm.runInNewContext(read('worker.js').replace(/export\s+default\s+/, 'globalThis.worker = '), sandbox);
  const env = {
    ASSETS: {
      async fetch(request) {
        assets.push(request);
        return new Response('asset response');
      },
    },
  };
  return { worker: sandbox.worker, env, assets };
}

test('Sitemap contains exactly the seven public canonical URLs', () => {
  const xml = read('sitemap.xml');
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, [...pages.keys()].map((pathname) => 'https://laotes.com' + pathname));
  assert.equal(new Set(urls).size, urls.length);
  assert.doesNotMatch(xml, /preview|oem-tooling|<lastmod>|<priority>|<changefreq>/);
});

test('Each public page has one absolute self-canonical and unique metadata', () => {
  const titles = [];
  const descriptions = [];
  for (const [pathname, filename] of pages) {
    const html = read(filename);
    const links = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/>/g)];
    assert.equal(links.length, 1, filename);
    assert.equal(links[0][1], 'https://laotes.com' + pathname, filename);
    assert.ok(html.indexOf(links[0][0]) < html.indexOf('</head>'), filename);
    titles.push(html.match(/<title>([^<]+)<\/title>/)[1]);
    descriptions.push(html.match(/<meta name="description" content="([^"]+)"/)[1]);
    assert.doesNotMatch(html, /href="(?:index|about-us|factory-tour|products|quality-delivery|contact|qa)\.html(?:[#?"])/, filename);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/, filename);
  }
  assert.equal(new Set(titles).size, pages.size);
  assert.equal(new Set(descriptions).size, pages.size);
});

test('Robots allows public search crawling and advertises the canonical sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent: \*\r?\nAllow: \/\r?\n/);
  assert.match(robots, /Sitemap: https:\/\/laotes\.com\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Disallow: \/\s*$/m);
  for (const prefix of ['/api/', '/r/', '/o/']) assert.ok(robots.includes('Disallow: ' + prefix));
});

test('Homepage structured data uses the documented company identity without invented reviews', () => {
  const html = read('index.html');
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const organization = data['@graph'].find((entry) => entry['@type'] === 'Organization');
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(organization.legalName, 'Chaozhou Laotesi Enterprise Co., Ltd.');
  assert.equal(organization.url, 'https://laotes.com/');
  assert.equal(organization.address.addressCountry, 'CN');
  assert.ok(fs.existsSync(path.join(project, new URL(organization.logo).pathname)));
  assert.doesNotMatch(JSON.stringify(data), /aggregateRating|reviewCount|foundingDate|price/);
});

test('Worker executes before assets and uses explicit extensionless HTML handling', () => {
  const config = read('wrangler.toml');
  assert.match(config, /run_worker_first = true/);
  assert.match(config, /html_handling = "drop-trailing-slash"/);
  const exclusions = read('.assetsignore');
  for (const filename of ['tests/', 'tools/', 'worker.js', 'wrangler.toml', 'SEO_GEO_AUDIT.md', 'about-us-preview.*']) {
    assert.ok(exclusions.includes(filename), filename);
  }
});

test('HTTP, www and HTML aliases converge in one permanent redirect preserving the query', async () => {
  const harness = loadWorker();
  for (const [pathname, filename] of pages) {
    const response = await harness.worker.fetch(new Request('http://www.laotes.com/' + filename + '?utm_source=test'), harness.env);
    assert.equal(response.status, 301, filename);
    assert.equal(response.headers.get('location'), 'https://laotes.com' + pathname + '?utm_source=test', filename);
  }
  assert.equal(harness.assets.length, 0);
});

test('Homepage aliases, trailing slashes and old tooling route have permanent targets', async () => {
  const harness = loadWorker();
  const aliases = new Map([
    ['/index', '/'], ['/index/', '/'], ['/index.html/', '/'],
    ['/products/', '/products'], ['/products.html/', '/products'],
    ['/qa.html', '/qa'], ['/oem-tooling', '/quality-delivery'],
    ['/oem-tooling.html', '/quality-delivery'],
  ]);
  for (const [from, to] of aliases) {
    const response = await harness.worker.fetch(new Request('https://laotes.com' + from), harness.env);
    assert.equal(response.status, 301, from);
    assert.equal(response.headers.get('location'), 'https://laotes.com' + to, from);
  }
});

test('Canonical pages and static files reach assets without redirect loops', async () => {
  const harness = loadWorker();
  for (const pathname of [...pages.keys(), '/products?category=storage', '/sitemap.xml', '/robots.txt', '/assets/logo.png', '/missing.html']) {
    const request = new Request('https://laotes.com' + pathname);
    const response = await harness.worker.fetch(request, harness.env);
    assert.equal(response.status, 200, pathname);
    assert.equal(response.headers.get('location'), null, pathname);
    assert.equal(harness.assets.at(-1), request, pathname);
  }
});

test('HEAD uses the same canonical redirect without a response body', async () => {
  const harness = loadWorker();
  const response = await harness.worker.fetch(new Request('http://www.laotes.com/contact.html', { method: 'HEAD' }), harness.env);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://laotes.com/contact');
  assert.equal(await response.text(), '');
});

test('POST and OPTIONS on the quote endpoint are not redirected', async () => {
  const harness = loadWorker();
  const options = await harness.worker.fetch(new Request('http://www.laotes.com/api/quote', { method: 'OPTIONS' }), harness.env);
  assert.equal(options.status, 204);
  const post = await harness.worker.fetch(new Request('http://www.laotes.com/api/quote', { method: 'POST', body: 'invalid' }), harness.env);
  assert.notEqual(post.status, 301);
  assert.equal(post.headers.get('location'), null);
});

test('Existing email click and pixel routes retain their original behavior', async () => {
  const harness = loadWorker();
  const click = await harness.worker.fetch(new Request('https://laotes.com/r/testtoken123'), harness.env);
  assert.equal(click.status, 302);
  assert.equal(click.headers.get('location'), 'https://laotes.com/');
  const pixel = await harness.worker.fetch(new Request('https://laotes.com/o/testtoken123.gif'), harness.env);
  assert.equal(pixel.headers.get('content-type'), 'image/gif');
  assert.ok((await pixel.arrayBuffer()).byteLength > 0);
});

test('Local development keeps its host and scheme', async () => {
  const harness = loadWorker();
  const response = await harness.worker.fetch(new Request('http://localhost:8787/about-us.html'), harness.env);
  assert.equal(response.headers.get('location'), 'http://localhost:8787/about-us');
});
