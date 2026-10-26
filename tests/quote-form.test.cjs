const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Test the actual form handler without a browser or any real network requests.
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = source.indexOf('  function setupForm() {');
const end = source.indexOf('  // Keep the catalog', start);
assert.ok(start >= 0 && end > start, 'Locate the current form implementation');
const setupSource = source.slice(start, end);

async function submit(responseFactory, formEntries = []) {
  let handler;
  let resets = 0;
  let refreshes = 0;
  const alerts = [];
  const button = { disabled: false };
  const success = { hidden: false, scrollIntoView() {} };
  const form = {
    action: 'https://audit.invalid/api/quote',
    addEventListener(type, callback) { if (type === 'submit') handler = callback; },
    reportValidity() { return true; },
    querySelector() { return button; },
    reset() { resets += 1; },
  };
  const context = vm.createContext({
    qs(selector) { return selector === '#quote-form' ? form : selector === '#form-success' ? success : null; },
    FormData: class MockFormData {
      entries() { return formEntries[Symbol.iterator](); }
    },
    fetch: responseFactory,
    console: { error() {} },
    window: { alert(message) { alerts.push(message); } },
    refreshIcons() { refreshes += 1; },
  });
  new vm.Script(setupSource + ';setupForm();').runInContext(context);
  await handler({ preventDefault() {} });
  return { resets, refreshes, alerts, button, success };
}

for (const [label, body] of [
  ['business error', JSON.stringify({ ok: false })],
  ['missing acknowledgement', JSON.stringify({})],
  ['null response', 'null'],
  ['invalid JSON', '<html>not an acknowledgement</html>'],
]) {
  test('Does not report success for ' + label, async () => {
    const result = await submit(async () => new Response(body));
    assert.equal(result.success.hidden, true);
    assert.equal(result.resets, 0);
    assert.equal(result.alerts.length, 1);
    assert.match(result.alerts[0], /nichole@laotes\.com/);
    assert.equal(result.button.disabled, false);
  });
}

test('Displays an attachment-limit failure and preserves the form', async () => {
  const result = await submit(async () => new Response(JSON.stringify({
    ok: false, error: 'attachments_too_large', message: 'Please keep attachments within 4 MiB in total. Your enquiry has not been sent.',
  }), { status: 413 }));
  assert.match(result.alerts[0], /4 MiB/);
  assert.equal(result.success.hidden, true);
  assert.equal(result.resets, 0);
  assert.equal(result.button.disabled, false);
});

test('Blocks marketing content before making the request', async () => {
  let requested = false;
  const result = await submit(async () => {
    requested = true;
    return new Response(JSON.stringify({ ok: true }));
  }, [['message', 'Please improve our Google SEO ranking.']]);
  assert.equal(requested, false);
  assert.equal(result.resets, 0);
  assert.equal(result.success.hidden, true);
  assert.match(result.alerts[0], /product and OEM enquiries only/i);
  assert.equal(result.button.disabled, false);
});

test('Reports success only after an explicit acknowledgement', async () => {
  const result = await submit(async () => new Response(JSON.stringify({ ok: true, id: 'mock-message' })));
  assert.equal(result.success.hidden, false);
  assert.equal(result.resets, 1);
  assert.equal(result.refreshes, 1);
  assert.equal(result.alerts.length, 0);
  assert.equal(result.button.disabled, false);
});

test('Rejects non-success HTTP status even with ok true', async () => {
  const result = await submit(async () => new Response(JSON.stringify({ ok: true }), { status: 502 }));
  assert.equal(result.resets, 0);
  assert.equal(result.success.hidden, true);
});

test('Network errors preserve entered data and clear old success state', async () => {
  const result = await submit(async () => { throw new Error('Mock network failure'); });
  assert.equal(result.resets, 0);
  assert.equal(result.success.hidden, true);
  assert.equal(result.alerts.length, 1);
  assert.equal(result.button.disabled, false);
});
