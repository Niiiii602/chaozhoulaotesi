const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(project, 'qa.html'), 'utf8');

const answerFor = (id) => {
  const start = source.indexOf('id="faq-' + id + '"');
  assert.ok(start >= 0, 'Question exists: ' + id);
  return source.slice(start, source.indexOf('</details>', start));
};

test('Q&A contains twenty-two native, keyboard-accessible product disclosures', () => {
  assert.equal((source.match(/<details class="qa-item" name="product-questions" id="faq-[^"]+">/g) || []).length, 22);
  assert.equal((source.match(/<summary>/g) || []).length, 22);
  assert.equal((source.match(/class="qa-answer"/g) || []).length, 22);
  assert.equal((source.match(/<h1 /g) || []).length, 1);
  assert.ok(source.includes('href="#questions">Skip to content'));
});

test('Four topic links lead to photo-interspersed question groups', () => {
  for (const id of ['product-options', 'use-care', 'quality-storage', 'oem-delivery']) {
    assert.ok(source.includes('href="#' + id + '"'));
    assert.match(source, new RegExp('<section[^>]+id="' + id + '"'));
  }
  assert.equal((source.match(/<figure class="qa-group-media/g) || []).length, 4);
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Element ids are unique');
});

test('Materials, lid choices and all-model sealing follow manufacturer confirmation', () => {
  assert.match(answerFor('materials'), /201, 304 or 316 stainless steel, as well as titanium/);
  for (const material of ['PP lids', 'high-clarity MS lids', 'silicone-wrapped glass lids', 'silicone lids']) {
    assert.ok(answerFor('lids').includes(material));
  }
  assert.doesNotMatch(answerFor('lids'), /stainless steel lid designs/);
  assert.match(answerFor('leakproof'), /All our food storage containers feature an airtight, leak-proof design/);
});

test('Compartment differences and development status are not overstated', () => {
  const answer = answerFor('compartments');
  for (const fact of ['standard and fully partitioned', 'to a degree', 'standard version does not isolate', 'Three-compartment', 'standard version only', 'four-compartment', 'currently in development']) {
    assert.ok(answer.includes(fact), fact);
  }
});

test('Heating answers distinguish microwave models, steam venting and oven lid removal', () => {
  const microwave = answerFor('microwave');
  for (const fact of ['regular models', 'SGS test reports', 'without a steam vent, remove the lid', 'silicone-wrapped glass lid', 'with the lid in place', 'Some special models are not suitable']) {
    assert.ok(microwave.includes(fact), fact);
  }
  assert.match(answerFor('oven'), /remove all lids before heating/);
  assert.match(answerFor('oven'), /not stovetop cookware/);
  assert.match(answerFor('temperatures'), /&minus;20 to 230&deg;C/);
  assert.match(answerFor('temperatures'), /&minus;20 to 90&deg;C/);
  assert.match(answerFor('temperatures'), /&minus;40 to 180&deg;C/);
  assert.match(answerFor('temperatures'), /component limits/);
});

test('Care and food-contact answers retain the user-confirmed product coverage', () => {
  assert.match(answerFor('cold-storage'), /both refrigerators and freezers/);
  assert.match(answerFor('dishwasher'), /dishwasher cleaning/);
  assert.match(answerFor('dishwasher'), /cool, shaded, well-ventilated/);
  assert.match(answerFor('bpa'), /All our food storage products are BPA-free/);
  for (const standard of ['FDA', 'LFGB', 'DGCCRF']) assert.ok(answerFor('compliance').includes(standard));
  assert.doesNotMatch(answerFor('stacking'), /The lid profile, handle and set configuration affect the result/);
});

test('Branding, tooling and ordering answers retain all specific commitments', () => {
  for (const fact of ['laser-engraved', 'screen-printed', 'heat-transfer', 'lid colors', 'silicone gasket colors']) assert.ok(answerFor('branding').includes(fact));
  for (const fact of ['initial idea, drawing or physical reference', '30-40 days', 'expedited schedule']) assert.ok(answerFor('tooling').includes(fact));
  assert.match(answerFor('moq'), /all regular models is 1,000 pieces/);
  for (const fact of ['before production', 'before packaging', 'For every order', 'one mass-production sample set', 'free of charge']) assert.ok(answerFor('samples').includes(fact));
  for (const fact of ['blister packs', 'PP bags', 'color-printed boxes', 'kraft boxes', 'display boxes', 'supermarket display stands']) assert.ok(answerFor('packaging').includes(fact));
  assert.match(answerFor('lead-time'), /40-50 days/);
});

test('Pre-shipment inspection covers all requested checks and evidence formats', () => {
  const answer = answerFor('inspection');
  for (const fact of ['pre-shipment inspection', 'photos and videos', 'inspection area and equipment', 'product dimensions', 'product weight', 'outer-carton dimensions', 'gross weight', 'leakage performance', 'freezer performance']) assert.ok(answer.includes(fact), fact);
});

test('Every published navigation places Q&A immediately after Contact', () => {
  for (const filename of ['index.html', 'about-us.html', 'factory-tour.html', 'products.html', 'quality-delivery.html', 'contact.html', 'qa.html']) {
    const html = fs.readFileSync(path.join(project, filename), 'utf8');
    assert.match(html, /<a href="\/contact">Contact<\/a>\s*<a href="\/qa"(?: aria-current="page")?>Q&amp;A<\/a>/, filename);
  }
});

test('Consumer gallery has six locally available images with alt text and provenance', () => {
  const images = [...source.matchAll(/<img src="(assets\/qa\/[^" ]+)" width="360" height="360" alt="([^"]+)" loading="lazy"/g)];
  assert.equal(images.length, 6);
  for (const [, filename, alt] of images) {
    assert.ok(alt.length > 20);
    assert.ok(fs.statSync(path.join(project, filename)).size > 0);
    assert.ok(JSON.parse(fs.readFileSync(path.join(project, filename + '.json'), 'utf8')).prompt.includes('Origin:'));
  }
});

test('Consumer scenes are unique, separate from the questions and use the requested series', () => {
  const questionImages = new Set([...source.split('id="everyday-use"')[0].matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1]));
  const gallery = source.match(/<div class="qa-photo-strip"[^>]*>([\s\S]*?)<\/div>/)[1];
  const sceneImages = [...gallery.matchAll(/src="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(sceneImages).size, 6);
  for (const filename of sceneImages) {
    assert.ok(!questionImages.has(filename), filename);
    const provenance = JSON.parse(fs.readFileSync(path.join(project, filename + '.json'), 'utf8'));
    assert.ok(provenance.prompt.includes('Origin: E:/照片/可用/保鲜盒/主推系列-01款/'), filename);
  }
});

test('Consumer section uses experience themes without invented reviews or ratings', () => {
  const experiences = source.slice(source.indexOf('id="everyday-use"'), source.indexOf('<footer'));
  assert.equal((experiences.match(/<article class="qa-experience">/g) || []).length, 3);
  assert.doesNotMatch(experiences, /<blockquote|aggregateRating|reviewRating|verified buyer|out of 5|ECOlunchbox/i);
});

test('Replacing a menu icon does not turn its opening click into an outside click', () => {
  const listeners = {};
  const attributes = { 'aria-expanded': 'false' };
  const header = {};
  let toggleClick;
  let open = false;
  let focused = false;
  const toggle = {
    addEventListener(event, handler) { if (event === 'click') toggleClick = handler; },
    getAttribute(name) { return attributes[name]; },
    setAttribute(name, value) { attributes[name] = value; },
    focus() { focused = true; },
  };
  const navigation = {
    classList: { toggle(name, value) { open = value; } },
    querySelectorAll() { return []; },
  };
  const document = {
    querySelector(selector) { return { '#menu-toggle': toggle, '#main-nav': navigation, '#site-header': header }[selector]; },
    addEventListener(event, handler) { listeners[event] = handler; },
  };
  const window = { matchMedia() { return { addEventListener() {} }; }, lucide: { createIcons() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(project, 'qa.js'), 'utf8'), { document, window });
  listeners.DOMContentLoaded();
  toggleClick();
  listeners.click({ target: { closest() { return null; } }, composedPath() { return [toggle, header]; } });
  assert.equal(open, true);
  assert.equal(attributes['aria-expanded'], 'true');
  listeners.keydown({ key: 'Escape' });
  assert.equal(open, false);
  assert.equal(focused, true);
  toggleClick();
  listeners.click({ composedPath() { return []; } });
  assert.equal(open, false);
});
