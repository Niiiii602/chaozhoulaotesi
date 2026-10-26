'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const workerPath = path.join(__dirname, '..', 'worker.js');
const workerSource = fs.readFileSync(workerPath, 'utf8');

class MemoryKV {
  constructor() { this.data = new Map(); }
  async get(key) { return this.data.get(key) || null; }
  async put(key, value) { this.data.set(key, String(value)); }
}

function loadWorker(env) {
  const sandbox = {
    ArrayBuffer, Blob, Date, FormData, Headers, Math, Promise, Request, Response,
    TextDecoder, TextEncoder, URL, URLSearchParams, Uint8Array,
    atob: globalThis.atob, btoa: globalThis.btoa,
    clearTimeout, console: { error() {}, log() {}, warn() {} }, fetch: async () => new Response('unexpected'), setTimeout,
  };
  vm.runInNewContext(workerSource.replace(/export\s+default\s+/, 'globalThis.__worker = '), sandbox, { filename: workerPath });
  return { worker: sandbox.__worker, env };
}

function visitRequest(body, ip = '198.51.100.90') {
  return new Request('https://laotes.com/api/visit', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip, 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' },
    body: JSON.stringify(body),
  });
}

test('records anonymous page and product events and exposes only authorized summaries', async () => {
  const env = { ANALYTICS_KV: new MemoryKV(), ANALYTICS_ADMIN_TOKEN: 'test-admin-token' };
  const harness = loadWorker(env);
  const page = await harness.worker.fetch(visitRequest({ visitorId: 'visitor-one', event: 'page_view', path: '/products', title: 'Products', source: 'google', campaign: 'spring' }), env);
  const product = await harness.worker.fetch(visitRequest({ visitorId: 'visitor-one', event: 'product_view', path: '/products', product: 'Storage series' }), env);
  assert.equal(page.status, 202);
  assert.equal(product.status, 202);

  const unauthorized = await harness.worker.fetch(new Request('https://laotes.com/api/analytics?days=1'), env);
  assert.equal(unauthorized.status, 401);

  const authorized = await harness.worker.fetch(new Request('https://laotes.com/api/analytics?days=1', { headers: { authorization: 'Bearer test-admin-token' } }), env);
  const report = await authorized.json();
  assert.equal(authorized.status, 200);
  assert.equal(report.ok, true);
  assert.equal(report.daily[0].pageViews, 1);
  assert.equal(report.daily[0].productViews, 1);
  assert.equal(report.daily[0].uniqueVisitors, 1);
  assert.equal(report.daily[0].topPages[0].value, '/products');
  assert.equal(report.daily[0].topProducts[0].value, 'Storage series');
  assert.equal(report.visitors[0].id, 'visitor-one');
  assert.equal(report.visitors[0].device, 'mobile');
});

test('returns unavailable when no analytics KV is bound', async () => {
  const env = { ANALYTICS_ADMIN_TOKEN: 'test-admin-token' };
  const harness = loadWorker(env);
  const response = await harness.worker.fetch(visitRequest({ visitorId: 'visitor-two', event: 'page_view' }), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'analytics_unavailable');
});
