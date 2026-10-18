'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const workerPath = process.env.QUOTE_WORKER_PATH || path.join(__dirname, '..', 'worker.js');
const workerSource = fs.readFileSync(workerPath, 'utf8');
const API_URL = 'https://laotes.com/api/quote';

const VALID_FIELDS = {
  name: 'Ada Lovelace',
  company: 'Analytical Engines Ltd',
  email: 'ada@example.test',
  country: 'United Kingdom',
  category: 'Precision components',
  quantity: '1000',
  message: 'Please send a quotation.',
};

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function textResponse(value, status = 200) {
  return new Response(value, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function buildEnv({ zoho = true, resend = false, ...overrides } = {}) {
  const env = {
    QUOTE_TO: 'quotes@example.test',
    QUOTE_FROM: 'website@example.test',
    QUOTE_SUBJECT_PREFIX: '[Website enquiry]',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) },
  };

  if (zoho) {
    Object.assign(env, {
      WEBMAIL_KV: {
        get: async (key) => (key === 'zoho_refresh_token' ? 'refresh-token' : null),
      },
      ZOHO_CLIENT_ID: 'client-id',
      ZOHO_CLIENT_SECRET: 'client-secret',
      ZOHO_ACCOUNT_ID: 'account-1',
    });
  }
  if (resend) env.RESEND_API_KEY = 'resend-api-key';
  return Object.assign(env, overrides);
}

function loadHarness(route, { env = buildEnv() } = {}) {
  const calls = [];
  const logs = [];
  const btoaFn = globalThis.btoa || ((value) => Buffer.from(value, 'binary').toString('base64'));
  const atobFn = globalThis.atob || ((value) => Buffer.from(value, 'base64').toString('binary'));
  const sandbox = {
    ArrayBuffer,
    Blob,
    Date,
    FormData,
    Headers,
    Math,
    Promise,
    Request,
    Response,
    TextDecoder,
    TextEncoder,
    URL,
    URLSearchParams,
    Uint8Array,
    atob: atobFn,
    btoa: btoaFn,
    clearTimeout,
    console: {
      error: (...args) => logs.push(args.join(' ')),
      log: () => {},
      warn: () => {},
    },
    fetch: async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input && input.url;
      const call = { init, url: String(url) };
      calls.push(call);
      return route(call);
    },
    setTimeout,
  };

  const transformed = workerSource.replace(/export\s+default\s+/, 'globalThis.__worker = ');
  assert.notEqual(transformed, workerSource, 'worker source must expose an ES module default export');
  vm.runInNewContext(transformed, sandbox, { filename: workerPath });
  assert.ok(sandbox.__worker && typeof sandbox.__worker.fetch === 'function');

  return { calls, env, logs, worker: sandbox.__worker };
}

function requestHeaders(ip = '198.51.100.10') {
  return {
    'cf-connecting-ip': ip,
    'user-agent': 'quote-worker-test',
  };
}

function jsonRequest(fields = VALID_FIELDS, { ip = '198.51.100.10' } = {}) {
  return new Request(API_URL, {
    method: 'POST',
    headers: { ...requestHeaders(ip), 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

function makeFile(name, bytes, type = 'application/octet-stream') {
  return { bytes: Uint8Array.from(bytes), name, type };
}

function formRequest(fields = VALID_FIELDS, files = [], { ip = '198.51.100.10' } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  for (const file of files) {
    form.append('attachments', new Blob([file.bytes], { type: file.type }), file.name);
  }
  return new Request(API_URL, {
    method: 'POST',
    headers: requestHeaders(ip),
    body: form,
  });
}

function isTokenRequest(url) {
  return url.hostname === 'accounts.zoho.com' && url.pathname === '/oauth/v2/token';
}

function isZohoUpload(url) {
  return url.hostname === 'mail.zoho.com' && /\/messages\/attachments$/.test(url.pathname);
}

function isZohoSend(url) {
  return url.hostname === 'mail.zoho.com' && /\/messages$/.test(url.pathname);
}

function isResendSend(url) {
  return url.hostname === 'api.resend.com' && url.pathname === '/emails';
}

function tokenResponse() {
  return jsonResponse({ access_token: 'access-token', expires_in: 3600 });
}

async function readJsonResponse(response) {
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep malformed provider responses available to the assertion.
  }
  return { body, status: response.status, text };
}

async function readMultipartAttachments(body) {
  const attachments = [];
  for (const [field, value] of body.entries()) {
    if (field !== 'attach') continue;
    attachments.push({
      bytes: new Uint8Array(await value.arrayBuffer()),
      name: value.name,
      type: value.type,
    });
  }
  return attachments;
}

function jsonBody(call) {
  assert.equal(typeof call.init.body, 'string');
  return JSON.parse(call.init.body);
}

function callsFor(harness, predicate) {
  return harness.calls.filter((call) => predicate(new URL(call.url), call));
}

test('no-file quote succeeds only with a real Zoho message id', async () => {
  const harness = loadHarness(async ({ url: rawUrl }) => {
    const url = new URL(rawUrl);
    if (isTokenRequest(url)) return tokenResponse();
    if (isZohoSend(url)) return jsonResponse({ status: { code: 200 }, data: { messageId: 'zoho-message-1' } });
    throw new Error(`unexpected provider call: ${rawUrl}`);
  });

  const response = await harness.worker.fetch(jsonRequest(), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.id, 'zoho-message-1');
  assert.equal(result.body.channel, 'zoho');
  assert.equal(callsFor(harness, isZohoUpload).length, 0);
  assert.equal(callsFor(harness, isZohoSend).length, 1);
  assert.equal(jsonBody(callsFor(harness, isZohoSend)[0]).attachments, undefined);
});

test('attachments upload together as multipart and forward Zoho metadata', async () => {
  const files = [
    makeFile('brief.txt', [0, 1, 2, 255], 'text/plain'),
    makeFile('drawing.bin', [10, 20, 30, 40, 50], 'application/octet-stream'),
  ];
  const metadata = [
    { storeName: 'store-brief', attachmentPath: '/attachments/brief', attachmentName: 'brief.txt' },
    { storeName: 'store-drawing', attachmentPath: '/attachments/drawing', attachmentName: 'drawing.bin' },
  ];
  const harness = loadHarness(async ({ url: rawUrl }) => {
    const url = new URL(rawUrl);
    if (isTokenRequest(url)) return tokenResponse();
    if (isZohoUpload(url)) return jsonResponse({ status: { code: 200 }, data: metadata });
    if (isZohoSend(url)) return jsonResponse({ status: { code: 200 }, data: { messageId: 'zoho-message-with-files' } });
    throw new Error(`unexpected provider call: ${rawUrl}`);
  });

  const response = await harness.worker.fetch(formRequest(VALID_FIELDS, files), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.id, 'zoho-message-with-files');

  const uploadCalls = callsFor(harness, isZohoUpload);
  assert.equal(uploadCalls.length, 1);
  const uploadUrl = new URL(uploadCalls[0].url);
  assert.equal(uploadUrl.searchParams.get('uploadType'), 'multipart');
  assert.equal(uploadUrl.searchParams.get('isInline'), 'false');
  const uploaded = await readMultipartAttachments(uploadCalls[0].init.body);
  assert.equal(uploaded.length, files.length);
  for (let i = 0; i < files.length; i += 1) {
    assert.equal(uploaded[i].name, files[i].name);
    assert.equal(uploaded[i].type, files[i].type);
    assert.deepEqual(Array.from(uploaded[i].bytes), Array.from(files[i].bytes));
  }

  const sendCalls = callsFor(harness, isZohoSend);
  assert.equal(sendCalls.length, 1);
  const sendBody = jsonBody(sendCalls[0]);
  assert.deepEqual(sendBody.attachments, metadata);
});

const sendFailureCases = [
  {
    name: 'HTTP 200 logical business error',
    response: () => jsonResponse({ status: { code: 500 }, data: { messageId: 'ignored' } }),
  },
  {
    name: 'HTTP 200 missing message id',
    response: () => jsonResponse({ status: { code: 200 }, data: {} }),
  },
  {
    name: 'HTTP 200 malformed body',
    response: () => textResponse('not-json'),
  },
];

for (const failureCase of sendFailureCases) {
  test(`send ${failureCase.name} falls back to Resend`, async () => {
    const harness = loadHarness(async ({ url: rawUrl }) => {
      const url = new URL(rawUrl);
      if (isTokenRequest(url)) return tokenResponse();
      if (isZohoSend(url)) return failureCase.response();
      if (isResendSend(url)) return jsonResponse({ id: 'resend-message-1' });
      throw new Error(`unexpected provider call: ${rawUrl}`);
    }, { env: buildEnv({ resend: true }) });

    const response = await harness.worker.fetch(jsonRequest(), harness.env);
    const result = await readJsonResponse(response);

    assert.equal(response.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.channel, 'resend');
    assert.equal(result.body.id, 'resend-message-1');
    assert.ok(result.body.fallbacks.some((attempt) => attempt.startsWith('zoho:')));
    assert.equal(callsFor(harness, isResendSend).length, 1);
  });
}

test('a send business error returns 502 when no fallback provider exists', async () => {
  const harness = loadHarness(async ({ url: rawUrl }) => {
    const url = new URL(rawUrl);
    if (isTokenRequest(url)) return tokenResponse();
    if (isZohoSend(url)) return jsonResponse({ status: { code: 200 }, data: {} });
    throw new Error(`unexpected provider call: ${rawUrl}`);
  });

  const response = await harness.worker.fetch(jsonRequest(), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 502);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.error, 'send_failed');
  assert.equal(callsFor(harness, isResendSend).length, 0);
});

const uploadFailureCases = [
  {
    name: 'HTTP failure',
    response: () => jsonResponse({ status: { code: 500 }, data: [] }, 500),
  },
  {
    name: 'logical business failure',
    response: () => jsonResponse({ status: { code: 500 }, data: [] }),
  },
  {
    name: 'malformed JSON shape',
    response: () => jsonResponse({ status: { code: 200 }, data: {} }),
  },
  {
    name: 'malformed body',
    response: () => textResponse('not-json'),
  },
];

for (const failureCase of uploadFailureCases) {
  test(`upload ${failureCase.name} falls back while preserving original bytes`, async () => {
    const file = makeFile('original.bin', [0, 17, 34, 128, 255], 'application/octet-stream');
    const harness = loadHarness(async ({ url: rawUrl }) => {
      const url = new URL(rawUrl);
      if (isTokenRequest(url)) return tokenResponse();
      if (isZohoUpload(url)) return failureCase.response();
      if (isZohoSend(url)) throw new Error('Zoho send must not run after upload failure');
      if (isResendSend(url)) return jsonResponse({ id: 'resend-with-original-bytes' });
      throw new Error(`unexpected provider call: ${rawUrl}`);
    }, { env: buildEnv({ resend: true }) });

    const response = await harness.worker.fetch(formRequest(VALID_FIELDS, [file]), harness.env);
    const result = await readJsonResponse(response);

    assert.equal(response.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.channel, 'resend');
    const resendCalls = callsFor(harness, isResendSend);
    assert.equal(resendCalls.length, 1);
    const resendBody = jsonBody(resendCalls[0]);
    assert.equal(resendBody.attachments.length, 1);
    assert.equal(resendBody.attachments[0].filename, file.name);
    assert.equal(resendBody.attachments[0].content, Buffer.from(file.bytes).toString('base64'));
    assert.equal(callsFor(harness, isZohoSend).length, 0);
  });
}
test('more than three attachments is rejected before any external call', async () => {
  const files = [1, 2, 3, 4].map((index) => makeFile(`file-${index}.txt`, [index], 'text/plain'));
  const harness = loadHarness(async ({ url }) => {
    throw new Error(`unexpected external call: ${url}`);
  });

  const response = await harness.worker.fetch(formRequest(VALID_FIELDS, files), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 413);
  assert.equal(result.body.ok, false);
  assert.equal(harness.calls.length, 0);
});

test('aggregate attachments over four MiB are rejected before any external call', async () => {
  const files = [
    makeFile('two-megabytes-a.bin', new Uint8Array(2 * 1024 * 1024)),
    makeFile('two-megabytes-b.bin', new Uint8Array(2 * 1024 * 1024 + 1)),
  ];
  const harness = loadHarness(async ({ url }) => {
    throw new Error(`unexpected external call: ${url}`);
  });

  const response = await harness.worker.fetch(formRequest(VALID_FIELDS, files, { ip: '198.51.100.11' }), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 413);
  assert.equal(result.body.ok, false);
  assert.equal(harness.calls.length, 0);
});

test('missing required fields are rejected without provider calls', async () => {
  const harness = loadHarness(async ({ url }) => {
    throw new Error(`unexpected external call: ${url}`);
  });
  const fields = { name: VALID_FIELDS.name, company: VALID_FIELDS.company };

  const response = await harness.worker.fetch(jsonRequest(fields), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 400);
  assert.equal(result.body.error, 'missing_fields');
  assert.deepEqual(result.body.fields, ['email']);
  assert.equal(harness.calls.length, 0);
});

test('invalid email is rejected without provider calls', async () => {
  const harness = loadHarness(async ({ url }) => {
    throw new Error(`unexpected external call: ${url}`);
  });

  const response = await harness.worker.fetch(jsonRequest({ ...VALID_FIELDS, email: 'not-an-email' }), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 400);
  assert.equal(result.body.error, 'invalid_email');
  assert.equal(harness.calls.length, 0);
});

test('missing sender configuration returns 503 without provider calls', async () => {
  const harness = loadHarness(async ({ url }) => {
    throw new Error(`unexpected external call: ${url}`);
  }, { env: buildEnv({ zoho: false }) });

  const response = await harness.worker.fetch(jsonRequest(), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 503);
  assert.equal(result.body.error, 'no_sender_configured');
  assert.equal(harness.calls.length, 0);
});

test('honeypot submissions are accepted without provider calls', async () => {
  const harness = loadHarness(async ({ url }) => {
    throw new Error(`unexpected external call: ${url}`);
  }, { env: buildEnv({ zoho: false }) });

  const response = await harness.worker.fetch(jsonRequest({ ...VALID_FIELDS, _honey: 'filled' }), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 200);
  assert.deepEqual(result.body, { ok: true, accepted: true });
  assert.equal(harness.calls.length, 0);
});

test('the sixth request from one IP is rate limited before any provider call', async () => {
  const harness = loadHarness(async ({ url: rawUrl }) => {
    const url = new URL(rawUrl);
    if (isTokenRequest(url)) return tokenResponse();
    if (isZohoSend(url)) return jsonResponse({ status: { code: 200 }, data: { messageId: 'rate-limit-test' } });
    throw new Error(`unexpected provider call: ${rawUrl}`);
  });
  const ip = '198.51.100.12';

  for (let i = 0; i < 5; i += 1) {
    const response = await harness.worker.fetch(jsonRequest({ ...VALID_FIELDS, message: `submission-${i}` }, { ip }), harness.env);
    assert.equal(response.status, 200);
  }
  const callsBeforeLimitedRequest = harness.calls.length;

  const response = await harness.worker.fetch(jsonRequest({ ...VALID_FIELDS, message: 'submission-6' }, { ip }), harness.env);
  const result = await readJsonResponse(response);

  assert.equal(response.status, 429);
  assert.equal(result.body.error, 'rate_limited');
  assert.equal(harness.calls.length, callsBeforeLimitedRequest);
});


test('Zoho failure falls back to configured ZeptoMail with original attachment bytes', async () => {
  const file = makeFile('drawing.bin', [0, 7, 128, 255]);
  let fallbackBody;
  const harness = loadHarness(async ({ url: rawUrl, init }) => {
    const url = new URL(rawUrl);
    if (isTokenRequest(url)) return tokenResponse();
    if (isZohoUpload(url)) return jsonResponse({ status: { code: 500 }, data: [] });
    if (url.hostname === 'api.zeptomail.com') {
      fallbackBody = JSON.parse(init.body);
      return jsonResponse({ request_id: 'zepto-confirmed', message: 'OK' });
    }
    throw new Error('Unexpected mocked endpoint: ' + rawUrl);
  }, { env: buildEnv({ ZEPTOMAIL_TOKEN: 'mock-token' }) });
  const response = await harness.worker.fetch(formRequest(VALID_FIELDS, [file]), harness.env);
  const result = await readJsonResponse(response);
  assert.equal(response.status, 200);
  assert.equal(result.body.channel, 'zeptomail');
  assert.equal(result.body.id, 'zepto-confirmed');
  assert.equal(fallbackBody.attachments[0].name, file.name);
  assert.deepEqual([...Buffer.from(fallbackBody.attachments[0].content, 'base64')], [...file.bytes]);
});

for (const [label, metadata] of [
  ['missing metadata field', [{ storeName: 'store', attachmentName: 'brief.txt' }]],
  ['incomplete upload count', []],
]) {
  test('Does not send without all uploaded attachments: ' + label, async () => {
    const harness = loadHarness(async ({ url: rawUrl }) => {
      const url = new URL(rawUrl);
      if (isTokenRequest(url)) return tokenResponse();
      if (isZohoUpload(url)) return jsonResponse({ status: { code: 200 }, data: metadata });
      throw new Error('No send should occur after incomplete upload');
    });
    const response = await harness.worker.fetch(formRequest(VALID_FIELDS, [makeFile('brief.txt', [1, 2])]), harness.env);
    const result = await readJsonResponse(response);
    assert.equal(response.status, 502);
    assert.equal(result.body.ok, false);
    assert.equal(callsFor(harness, isZohoSend).length, 0);
  });
}
