const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const coreSource = fs.readFileSync(path.join(project, 'script.js'), 'utf8');
const pageSource = fs.readFileSync(path.join(project, 'products.js'), 'utf8');
const html = fs.readFileSync(path.join(project, 'products.html'), 'utf8');
const callbacks = [];
const sandbox = {
  window: {},
  document: {
    body: { classList: { contains: (name) => name === 'page-products' } },
    addEventListener(event, callback) { callbacks.push({ event, callback }); },
  },
};
vm.runInNewContext(coreSource, sandbox);
const originalCatalog = JSON.stringify(sandbox.window.LAOTESI_PRODUCT_DATA);
vm.runInNewContext(pageSource, sandbox);
const catalog = sandbox.window.LAOTESI_PRODUCT_DATA;
const collections = sandbox.window.LAOTESI_PRODUCT_COLLECTIONS;
const storageModels = sandbox.window.LAOTESI_STORAGE_MODELS;
const lidTypes = sandbox.window.LAOTESI_STORAGE_LIDS;
const seriesById = new Map(catalog.series.map((series) => [series.id, series]));

function modelsFor(series) { return series.panelModels || series.catalogModels || []; }

test('Products overview preserves all four categories without the duplicate baking range', () => {
  assert.equal(collections.length, 12);
  assert.equal(new Set(collections.map((collection) => collection.id)).size, 12);
  assert.deepEqual(Object.fromEntries(['storage', 'cookware', 'plates', 'kettles'].map((category) => [category, collections.filter((collection) => collection.category === category).length])), { storage: 8, cookware: 2, plates: 1, kettles: 1 });
});

test('Products redesign does not mutate the shared product catalog', () => {
  assert.equal(JSON.stringify(catalog), originalCatalog);
});

test('The original twenty single models are partitioned once into rectangular, square and divided collections', () => {
  const single = collections.filter((collection) => collection.seriesId === 'storage-featured-2603-single' && collection.id !== 'baking');
  assert.deepEqual(Array.from(single, (collection) => collection.indexes.length), [14, 3, 3]);
  const indexes = Array.from(single).flatMap((collection) => Array.from(collection.indexes)).sort((first, second) => first - second);
  assert.deepEqual(indexes, Array.from({ length: 20 }, (_, index) => index));
  assert.equal(new Set(indexes).size, 20);
});

test('All fifty-two unique storage catalog options and eleven set configurations remain reachable', () => {
  const storage = collections.filter((collection) => collection.category === 'storage');
  assert.equal(storage.reduce((total, collection) => total + collection.modelCount, 0), 52);
  assert.equal(collections.find((collection) => collection.id === 'sets').modelCount, 11);
  for (const collection of storage) {
    const sourceModels = modelsFor(seriesById.get(collection.seriesId));
    assert.equal(collection.modelCount, collection.indexes.length);
    for (const index of collection.indexes) {
      assert.ok(sourceModels[index]?.code, collection.id + ':' + index);
      assert.ok(fs.existsSync(path.join(project, sourceModels[index].image)), sourceModels[index].image);
    }
  }
});

test('Every collection preview has a local image and a valid original detail-gallery index', () => {
  for (const collection of collections) {
    const series = seriesById.get(collection.seriesId);
    assert.ok(series, collection.seriesId);
    assert.equal(series.category, collection.category);
    assert.equal(collection.previews.length, 3);
    for (const preview of collection.previews) {
      assert.ok(collection.indexes.includes(preview.index), collection.id);
      assert.ok(series.images[preview.index]?.src, collection.id);
      assert.ok(preview.alt.length > 15, collection.id);
      assert.ok(fs.statSync(path.join(project, preview.src)).size > 0, preview.src);
    }
  }
});

test('The category interface defaults to all collections and provides accessible model search', () => {
  assert.match(html, /id="collection-tab-all"[^>]+aria-selected="true"/);
  for (const category of ['all', 'storage', 'cookware', 'plates', 'kettles']) {
    assert.ok(html.includes('data-collection-filter="' + category + '"'));
  }
  assert.match(html, /for="collection-search"/);
  assert.match(html, /id="collection-status" role="status" aria-live="polite"/);
  assert.match(html, /id="product-grid" role="tabpanel" aria-labelledby="collection-tab-all"/);
  assert.match(html, /id="collection-reset"/);
});

test('Page-specific assets load after the existing catalog and do not reuse legacy event selectors', () => {
  assert.ok(html.indexOf('styles.css?') < html.indexOf('products.css?'));
  assert.ok(html.indexOf('script.js?') < html.indexOf('products.js?'));
  assert.doesNotMatch(pageSource, /data-product-id|data-series-thumb|class="product-open"/);
  assert.match(pageSource, /window\.LAOTESI_OPEN_PRODUCT/);
  assert.match(pageSource, /event\.key === "Tab"/);
});

test('Product enquiries and use-care links lead to visible dedicated pages', () => {
  assert.doesNotMatch(html, /href="#quote"/);
  assert.match(html, /href="\/contact#quote"[^>]*>Discuss this range/);
  assert.match(html, /href="\/qa#use-care"/);
});

test('Existing product-use stories remain available after the collection grid', () => {
  assert.ok(html.indexOf('id="product-grid"') < html.indexOf('id="storage-feature-story-slot"'));
  assert.match(html, /<details class="products-context" data-collection-context="storage">/);
  assert.match(html, /<details class="products-context" data-collection-context="cookware">/);
  assert.match(html, /id="cookware-scene-panel"/);
});

test('Every storage model is classified once under the four requested lid types', () => {
  assert.deepEqual(Array.from(lidTypes, (lid) => lid.id), ['integrated-pp', 'silicone-glass', 'pure-silicone', 'detachable-pp']);
  assert.deepEqual(Array.from(lidTypes, (lid) => storageModels.filter((entry) => entry.lidType === lid.id).length), [31, 7, 6, 8]);
  assert.equal(storageModels.length, 52);
  assert.equal(new Set(storageModels.map((entry) => entry.id)).size, 52);
  for (const collection of collections.filter((entry) => entry.category === 'storage')) {
    const entries = storageModels.filter((entry) => entry.collectionId === collection.id);
    assert.deepEqual(Array.from(entries, (entry) => entry.index).sort((first, second) => first - second), Array.from(collection.indexes).sort((first, second) => first - second));
  }
});

test('Every capacity has visible structured dimensions including each set component', () => {
  for (const entry of storageModels) {
    const collection = collections.find((item) => item.id === entry.collectionId);
    const original = modelsFor(seriesById.get(collection.seriesId))[entry.index];
    assert.ok(entry.model.details.length > 0, entry.id);
    assert.equal(entry.model.details.length, original.details.length, entry.id);
    for (const [componentIndex, detail] of entry.model.details.entries()) {
      if (entry.id === 'sets-1' && componentIndex === 2) assert.equal(detail.capacity, 'To confirm');
      else assert.match(detail.capacity, /\d[\d,]* ml(?: x \d+)?$/);
      assert.match(detail.size, /\d+(?:\.\d+)?(?: x \d+(?:\.\d+)?){1,2} cm$/);
    }
  }
  assert.match(pageSource, /<th scope="col">Capacity<\/th>/);
  assert.match(pageSource, /<th scope="col">Dimensions<\/th>/);
  assert.match(pageSource, /entries\.map\(renderStorageModel\)/);
});

test('Same-code models with different lid materials and silicone profiles remain distinct', () => {
  const variants = storageModels.filter((entry) => entry.model.code === '10RC900');
  assert.equal(variants.length, 3);
  assert.deepEqual(Array.from(variants, (entry) => entry.lidType).sort(), ['pure-silicone', 'pure-silicone', 'silicone-glass']);
  assert.equal(new Set(variants.map((entry) => entry.model.variant)).size, 3);
  assert.equal(new Set(variants.map((entry) => entry.image)).size, 3);
});

test('Every model uses a catalog-original white-background photo with recorded provenance', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'assets/catalog-white/source.json'), 'utf8'));
  assert.equal(manifest.catalog, '2026电子图册.ai');
  assert.match(manifest.treatment, /color-managed CMYK to sRGB/);
  assert.match(manifest.colorManagement.sourceProfile, /Web Coated.*SWOP/i);
  assert.equal(manifest.colorManagement.outputProfile, 'sRGB');
  assert.equal(manifest.images.length, 56);
  for (const entry of storageModels) {
    assert.ok(fs.statSync(path.join(project, entry.image)).size > 0, entry.image);
    const source = manifest.images.find((image) => image.file === entry.image);
    assert.ok(source, entry.image);
    assert.ok(source.page >= 2 && source.page <= 12);
    assert.equal(source.code.toLowerCase(), entry.model.code.toLowerCase());
    assert.match(source.sourceColorSpace, /DeviceCMYK/);
    assert.ok(fs.readFileSync(path.join(project, entry.image)).includes(Buffer.from('ICCP')), entry.image);
  }
  const css = fs.readFileSync(path.join(project, 'products.css'), 'utf8');
  assert.doesNotMatch(css, /mix-blend-mode:\s*multiply|background:\s*#f3f6f3/);
  assert.doesNotMatch(pageSource, /-warm\.webp|-ai\.webp/);
});

test('Only the seven reported cool-cast photographs use corrected cache-safe assets', () => {
  const correctedIds = ['rectangular-12', 'rectangular-13', 'divided-19', 'sets-0', 'sets-3', 'sets-6', 'sets-7'];
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'assets/catalog-white/source.json'), 'utf8'));
  assert.equal(manifest.images.filter((image) => image.colorAdjustment).length, 7);
  for (const entry of storageModels) {
    const corrected = correctedIds.includes(entry.id);
    assert.equal(entry.image.endsWith('-neutral.webp'), corrected, entry.id);
    const source = manifest.images.find((image) => image.file === entry.image);
    assert.ok(source, entry.id);
    assert.equal(Boolean(source.colorAdjustment), corrected, entry.id);
    if (corrected) assert.equal(source.colorAdjustment.method, 'Selective cool-cast neutralization');
  }
  for (const collection of collections.filter((entry) => entry.category === 'storage')) {
    for (const preview of collection.previews) {
      const model = storageModels.find((entry) => entry.collectionId === collection.id && entry.index === preview.index);
      assert.equal(preview.src, model.image);
    }
  }
  assert.ok(html.includes('products.js?v=20261019nestable7'));
  assert.ok(html.includes('products.css?v=20261019nesting6'));
});

test('Product image scale follows displayed physical dimensions within each shape family', () => {
  const entryById = new Map(storageModels.map((entry) => [entry.id, entry]));
  for (const entry of storageModels) {
    assert.ok(Number.isFinite(entry.imageScale), entry.id);
    assert.ok(entry.imageScale >= 0.6 && entry.imageScale <= 1, entry.id);
  }
  assert.equal(entryById.get('rectangular-0').model.size, '16.5 x 12.5 x 4.5 cm');
  assert.equal(entryById.get('rectangular-2').model.size, '17.5 x 13 x 5.8 cm');
  assert.ok(entryById.get('rectangular-0').imageScale < entryById.get('rectangular-2').imageScale);
  assert.ok(entryById.get('rectangular-2').imageScale < entryById.get('rectangular-11').imageScale);
  assert.equal(entryById.get('rectangular-0').imageScale, entryById.get('rectangular-1').imageScale);
  assert.ok(entryById.get('silicone-glass-3').imageScale < entryById.get('silicone-glass-6').imageScale);
  assert.equal(entryById.get('silicone-glass-2').imageScale, 1);
  assert.equal(entryById.get('silicone-glass-6').imageScale, 1);
  assert.ok(storageModels.filter((entry) => entry.collectionId === 'sets').every((entry) => entry.imageScale === 1));
});

test('The product stage consumes the stable image scale and separates specifications visually', () => {
  const css = fs.readFileSync(path.join(project, 'products.css'), 'utf8');
  assert.match(pageSource, /style="--product-image-scale:/);
  assert.ok(css.includes('var(--product-image-scale, 1)'));
  assert.match(css, /--product-panel: #f1f4f3/);
  assert.ok(css.includes('background: var(--product-panel)'));
  assert.ok(css.includes('border-top: 1px solid var(--product-border)'));
});

test('01SQ1000 has a bounded optical correction without changing its photo or dimensions', () => {
  const model = storageModels.find((entry) => entry.id === 'square-15');
  assert.equal(model.imageScale, 0.72);
  assert.equal(model.image, 'assets/catalog-white/square-15.webp');
  assert.equal(model.model.code, '01SQ1000');
  assert.equal(model.model.size, '25.2 x 12.3 x 7 cm');
  assert.ok(model.imageScale > storageModels.find((entry) => entry.id === 'square-14').imageScale);
  assert.ok(model.imageScale < storageModels.find((entry) => entry.id === 'divided-17').imageScale);
});

test('All eleven nestable sets render in their own section after the single models', () => {
  const renderCallbacks = [];
  const renderComplete = new Error('Rendered grid captured');
  let rendered = '';
  const grid = { set innerHTML(value) { rendered = value; throw renderComplete; } };
  const renderSandbox = {
    window: { LAOTESI_PRODUCT_DATA: catalog, LAOTESI_OPEN_PRODUCT() {} },
    document: {
      body: { classList: { contains: () => true } },
      addEventListener(event, callback) { renderCallbacks.push(callback); },
      querySelector(selector) { return selector === '#product-grid' ? grid : {}; },
      querySelectorAll() { return []; },
    },
  };
  vm.runInNewContext(pageSource, renderSandbox);
  assert.throws(() => renderCallbacks[0](), (error) => error === renderComplete);
  const section = rendered.match(/<section class="storage-set-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /aria-labelledby="storage-nesting-sets-title"/);
  assert.match(section, /<h4 id="storage-nesting-sets-title">Nestable Container Sets<\/h4>/);
  assert.match(section, /data-set-count>11 sets/);
  assert.deepEqual(Array.from(section.matchAll(/data-storage-model="([^"]+)"/g), (match) => match[1]), Array.from({ length: 11 }, (_, index) => 'sets-' + index));
  assert.match(section, /<h5>01-BXH650\/1300ml<\/h5>/);
  assert.match(section, /<h5>01-KP400\*4\/4300ml<\/h5>/);
  assert.ok(rendered.indexOf('data-storage-model="square-16"') < rendered.indexOf(section));
  assert.ok(rendered.indexOf(section) < rendered.indexOf('id="lid-silicone-glass"'));
  assert.equal(Array.from(rendered.matchAll(/data-storage-model="/g)).length, 52);
});

test('Nesting-set sections hide and update their own count when filtering', () => {
  assert.ok(pageSource.includes('grid.querySelectorAll("[data-storage-sets]")'));
  assert.ok(pageSource.includes('section.querySelector("[data-set-count]").textContent = visibleCount + (visibleCount === 1 ? " set" : " sets")'));
  const css = fs.readFileSync(path.join(project, 'products.css'), 'utf8');
  assert.match(css, /\.storage-set-section\[hidden\][^{]*\{ display: none !important;/);
  assert.match(css, /\.storage-set-section \{[^}]*border-top: 1px solid var\(--line\)/);
  assert.match(css, /\.storage-set-heading \{[^}]*flex-wrap: wrap/);
});

test('Printed catalog corrections are local and conflicting set capacity is not invented', () => {
  const corrected = storageModels.find((entry) => entry.id === 'sets-3');
  assert.equal(corrected.model.details[1].size, '29.8 x 21.4 x 7 cm');
  const unresolved = storageModels.find((entry) => entry.id === 'sets-1');
  assert.equal(unresolved.model.details[2].capacity, 'To confirm');
  assert.match(unresolved.model.capacityNote, /capacity to confirm/i);
  assert.equal(JSON.stringify(catalog), originalCatalog);
});

test('Duplicate baking cards are removed while their rectangular models remain exactly once', () => {
  assert.ok(!collections.some((collection) => collection.id === 'baking'));
  assert.ok(!storageModels.some((entry) => entry.collectionId === 'baking'));
  for (const code of ['01RC2000', '01RC2500', '01RC3000', '01RC5000']) {
    assert.equal(storageModels.filter((entry) => entry.model.code === code).length, 1, code);
  }
  assert.equal(storageModels.filter((entry) => entry.collectionId === 'sets').length, 11);
});

test('Small square and divided models precede 01RC2000 and the long divided model follows 01RC3700', () => {
  const integrated = storageModels.filter((entry) => entry.lidType === 'integrated-pp');
  assert.deepEqual(Array.from(integrated.slice(0, 20), (entry) => entry.model.code), [
    '01RC400', '01RC550', '01RC650', '01RC1000', '01RC1300', '01RC2250',
    '01SQ400', '01SQ1000', '01-SG450/280ml', '01-SSG400/280/280ml',
    '01RC2000', '01RC2500', '01RC4200', '01RC3000', '01RC5000', '01RC6600', '01RC2600', '01RC3700',
    '01-CTXSSG1700ml', '01SQ4300',
  ]);
  assert.deepEqual(Array.from(integrated.slice(20), (entry) => entry.id), Array.from({ length: 11 }, (_, index) => 'sets-' + index));
});
