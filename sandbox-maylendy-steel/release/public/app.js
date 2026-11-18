(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const normalize = value => String(value).toLowerCase().normalize('NFKD').replace(/[\s,×]/g, '');
  const index = JSON.parse($('#catalog-index')?.textContent || '[]');
  const byId = new Map(index.map(item => [item.id, item]));
  let toastTimer;
  function notify(message) {
    const box = $('.toast');
    if (!box) return;
    clearTimeout(toastTimer); box.textContent = message; box.hidden = false;
    toastTimer = setTimeout(() => { box.hidden = true; }, 4200);
  }
  function navigation() {
    const menu = $('.menu-toggle');
    const nav = $('#main-nav');
    function close() {
      nav?.classList.remove('is-open'); document.body.classList.remove('menu-open');
      menu?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-label', 'Open menu');
    }
    menu?.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open);
      menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav?.classList.contains('is-open')) { close(); menu.focus(); }
    });
    addEventListener('resize', () => { if (menu && getComputedStyle(menu).display === 'none') close(); });
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => openTarget(a.getAttribute('href'))));
    addEventListener('hashchange', () => openTarget(location.hash));
    openTarget(location.hash);
  }
  function openTarget(hash) {
    if (!hash || hash === '#') return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.tagName === 'DETAILS') target.open = true;
    target.closest('details')?.setAttribute('open', '');
    target.closest('[data-reveal]')?.classList.remove('is-pending');
  }
  function catalog() {
    const cards = $$('[data-model]');
    const search = $('#catalog-search');
    if (!cards.length || !search) return;
    let category = 'all';
    const materialNumbers = new Set([201, 304, 316, 410, 430]);
    const params = new URLSearchParams(location.search);
    search.value = (params.get('q') || '').slice(0, 160);
    const entries = cards.map((card, order) => {
      const item = byId.get(card.dataset.productId || card.id.replace(/^card-/, ''));
      const capacities = item?.capacityMl || [...(item?.capacity || '').matchAll(/([\d,]+(?:\.\d+)?)\s*ml\b/gi)].map(m => Number(m[1].replace(/,/g, '')));
      const badge = document.createElement('span'); badge.className = 'capacity-match-badge'; badge.hidden = true; badge.dataset.matchBadge = '';
      $('.model-copy', card)?.prepend(badge);
      const words = `${card.dataset.search} ${card.dataset.category} ${card.dataset.category === 'storage' ? 'stainless steel food storage container lunch box meal prep' : ''}`;
      return { card, item, capacities, badge, order, words: normalize(words), code: normalize(item?.name || '') };
    });
    function capacityQuery(raw) {
      const unit = raw.match(/(?:^|\s)(\d[\d,]*(?:\.\d+)?)\s*(ml|millilit(?:er|re)s?|l|lit(?:er|re)s?)(?=$|\s)/i);
      if (unit) {
        const amount = Number(unit[1].replace(/,/g, '')) * (/^l/i.test(unit[2]) ? 1000 : 1);
        return { amount, rest: raw.replace(unit[0], ' ').trim() };
      }
      if (/^\s*\d[\d,]*(?:\.\d+)?\s*$/.test(raw)) {
        const amount = Number(raw.replace(/,/g, '').trim());
        if (amount >= 100 && !materialNumbers.has(amount)) return { amount, rest: '' };
      }
      return null;
    }
    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > 1) return 3;
      const row = Array.from({ length: b.length + 1 }, (_, i) => i);
      for (let i = 1; i <= a.length; i++) {
        let previous = row[0]; row[0] = i;
        for (let j = 1; j <= b.length; j++) {
          const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = old;
        }
      }
      return row[b.length];
    }
    function filter() {
      const raw = search.value.trim(); const capacity = capacityQuery(raw);
      const tokens = (capacity ? capacity.rest : raw).split(/\s+/).map(normalize).filter(Boolean);
      const eligible = entries.filter(entry => (category === 'all' || entry.card.dataset.category === category) && tokens.every(token => entry.words.includes(token)));
      let matches = eligible.map(entry => ({ entry, distance: 0, capacity: null, kind: 'text' }));
      if (capacity) {
        matches = eligible.filter(entry => entry.capacities.length).map(entry => {
          const nearest = entry.capacities.reduce((best, value) => Math.abs(value - capacity.amount) < Math.abs(best - capacity.amount) ? value : best);
          return { entry, distance: Math.abs(nearest - capacity.amount), capacity: nearest, kind: Math.abs(nearest - capacity.amount) < .01 ? 'exact' : 'near' };
        }).sort((a, b) => a.distance - b.distance || a.entry.order - b.entry.order);
        const range = Math.max(200, capacity.amount * .25);
        const nearby = matches.filter(match => match.distance <= range);
        if (nearby.length) matches = nearby;
        else if (matches.length) {
          const closest = [...new Set(matches.map(m => m.capacity))].slice(0, 3);
          matches = matches.filter(m => closest.includes(m.capacity)).slice(0, 12);
        }
      } else if (!matches.length && /^[a-z0-9-]{5,}$/i.test(raw)) {
        const query = normalize(raw);
        matches = entries.filter(entry => category === 'all' || entry.card.dataset.category === category).map(entry => ({ entry, distance: editDistance(query, entry.code), capacity: null, kind: 'similar' })).filter(m => m.distance <= 1).sort((a, b) => a.distance - b.distance || a.entry.order - b.entry.order);
      }
      const visible = new Map(matches.map((match, order) => [match.entry.card, { ...match, order }]));
      entries.forEach(entry => {
        const match = visible.get(entry.card); entry.card.hidden = !match;
        entry.card.style.order = match ? match.order : entry.order;
        entry.badge.hidden = !match || !capacity && match.kind !== 'similar';
        entry.card.dataset.match = match?.kind || '';
        if (match && capacity) entry.badge.textContent = `${match.kind === 'exact' ? 'Exact capacity' : 'Nearby capacity'} · ${match.capacity.toLocaleString('en-US')} ml`;
        else if (match?.kind === 'similar') entry.badge.textContent = 'Similar model code';
      });
      const grid = cards[0].parentElement;
      matches.forEach(match => grid.append(match.entry.card));
      entries.filter(entry => !visible.has(entry.card)).forEach(entry => grid.append(entry.card));
      const count = matches.length;
      const status = $('[data-catalog-status]');
      if (capacity) {
        const exact = matches.filter(m => m.kind === 'exact').length;
        status.textContent = `${count} options for approximately ${capacity.amount.toLocaleString('en-US')} ml${exact ? ` · ${exact} exact-capacity matches first` : ' · closest catalog capacities shown'}. Individual container or set-component capacities are used; the actual specifications below remain unchanged.`;
      } else status.textContent = `${count} ${count === 1 ? 'model or series' : 'models & series'}${raw ? ` matching “${raw}”` : ''}. Specifications are catalog references.`;
      $('.empty-state').hidden = count > 0;
      $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    }
    search.addEventListener('input', filter);
    search.closest('form').addEventListener('submit', event => { event.preventDefault(); filter(); });
    $$('[data-filter]').forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; filter(); }));
    $('[data-search-clear]')?.addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    $('[data-filter-reset]')?.addEventListener('click', () => { category = 'all'; search.value = ''; filter(); search.focus(); });
    filter();
    if (search.value) setTimeout(() => { search.closest('.section')?.scrollIntoView({ block: 'start' }); }, 60);
  }
  function comparison() {
    const selected = new Set();
    const dialog = $('#compare-dialog');
    const bar = $('.shortlist-bar');
    if (!dialog || !bar) return;
    function update() {
      $$('[data-compare]').forEach(button => {
        const active = selected.has(button.dataset.compare);
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-selected', active);
      });
      $('[data-shortlist-count]').textContent = selected.size;
      bar.hidden = selected.size === 0;
    }
    $$('[data-compare]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.compare;
      if (!byId.has(id)) return;
      if (selected.has(id)) selected.delete(id);
      else if (selected.size < 3) selected.add(id);
      else { notify('Compare up to three models at a time. Remove one to add another.'); return; }
      update();
    }));
    $('[data-clear-comparison]')?.addEventListener('click', () => { selected.clear(); update(); });
    $('[data-open-comparison]')?.addEventListener('click', () => {
      const products = [...selected].map(id => byId.get(id));
      if (!products.length) return;
      const container = $('[data-comparison-content]'); container.replaceChildren();
      const wrapper = document.createElement('div'); wrapper.className = 'table-scroll';
      const table = document.createElement('table'); table.className = 'compare-table';
      const caption = document.createElement('caption'); caption.textContent = 'Selected model specifications'; caption.className = 'sr-only'; table.append(caption);
      const head = document.createElement('thead'); const tr = document.createElement('tr');
      const label = document.createElement('th'); label.textContent = 'Details'; tr.append(label);
      products.forEach(product => {
        const th = document.createElement('th'); th.scope = 'col';
        const img = document.createElement('img'); img.src = product.image; img.alt = product.name;
        const a = document.createElement('a'); a.href = product.url; a.textContent = product.name;
        th.append(img, a); tr.append(th);
      });
      head.append(tr); table.append(head);
      const tbody = document.createElement('tbody');
      [['Capacity','capacity'],['Dimensions / sizes','size'],['Body material','material'],['Lid','lid']].forEach(([title,key]) => {
        const row = document.createElement('tr'); const th = document.createElement('th'); th.scope = 'row'; th.textContent = title; row.append(th);
        products.forEach(product => { const td = document.createElement('td'); td.textContent = product[key]; row.append(td); });
        tbody.append(row);
      });
      table.append(tbody); wrapper.append(table); container.append(wrapper);
      const note = document.createElement('p'); note.className = 'section-note'; note.textContent = 'Confirm final material, lid configuration, dimensions and performance by model before ordering.'; container.append(note);
      $('[data-discuss-selection]').href = `/contact?models=${encodeURIComponent([...selected].join(','))}`;
      dialog.showModal();
    });
  }
  function media() {
    const dialog = $('#image-dialog');
    $$('a[data-image]').forEach(a => a.addEventListener('click', event => {
      if (!dialog || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      $('img', dialog).src = a.href;
      $('img', dialog).alt = a.dataset.caption || $('img', a)?.alt || 'MayLendy reference image';
      $('p', dialog).textContent = a.dataset.caption || $('img', a)?.alt || '';
      dialog.showModal();
    }));
    $$('dialog').forEach(node => {
      $('.dialog-close', node)?.addEventListener('click', () => node.close());
      node.addEventListener('click', event => {
        if (event.target !== node) return;
        const rect = node.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) node.close();
      });
    });
    let request = 0;
    $$('[data-proof]').forEach(button => button.addEventListener('click', async () => {
      const sequence = ++request;
      const pending = new Image(); pending.src = button.dataset.src;
      try { await pending.decode(); } catch { notify('The image could not load. You can view the complete process on the Manufacturing page.'); return; }
      if (sequence !== request) return;
      const img = $('.proof-image img'); img.src = button.dataset.src; img.alt = button.dataset.alt;
      $('[data-proof-caption]').textContent = button.dataset.caption;
      $$('[data-proof]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    }));
    $$('[data-factory-video]').forEach(stage => {
      const video = $('video', stage);
      const play = $('[data-factory-play]', stage);
      const error = $('[data-factory-video-error]', stage.closest('figure'));
      if (!video || !play) return;
      play.hidden = false;
      let attempt = 0, needsReload = false;
      function failed() {
        needsReload = true;
        play.disabled = false; play.hidden = false;
        $('span', play).textContent = 'Try playing again';
        if (error) error.hidden = false;
      }
      play.addEventListener('click', async () => {
        const request = ++attempt;
        if (needsReload) { needsReload = false; video.load(); }
        play.disabled = true;
        if (error) error.hidden = true;
        try { await video.play(); } catch { if (request === attempt) failed(); }
      });
      video.addEventListener('play', () => {
        const moveFocus = document.activeElement === play;
        play.hidden = true; play.disabled = false;
        if (error) error.hidden = true;
        if (moveFocus) video.focus({ preventScroll: true });
      });
      video.addEventListener('ended', () => {
        play.hidden = false; play.disabled = false;
        $('span', play).textContent = 'Replay workshop video';
      });
      video.addEventListener('error', failed);
      $$('source', video).forEach(source => source.addEventListener('error', failed));
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) $$('[data-factory-video] video').forEach(video => video.pause());
    });
  }
  function questions() {
    const search = $('#question-search');
    if (!search) return;
    const questions = $$('[data-question]');
    search.addEventListener('input', () => {
      const term = normalize(search.value); let count = 0;
      questions.forEach(q => { const visible = normalize(q.textContent).includes(term); q.hidden = !visible; if (visible) count++; if (term && visible) q.open = true; });
      $$('.answer-group').forEach(group => { group.hidden = !$$('[data-question]', group).some(q => !q.hidden); });
      $('[data-answer-status]').textContent = term ? `${count} matching ${count === 1 ? 'answer' : 'answers'}. Clear the search to see all questions.` : '';
    });
  }
  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function enquiry() {
    const form = $('#quote-form');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const ids = (params.get('models') || params.get('model') || '').split(',').slice(0, 3).filter(id => byId.has(id));
    const products = ids.map(id => byId.get(id));
    const message = $('[name="message"]', form); const category = $('[name="category"]', form);
    const interests = { 'quality-pack': 'Please provide the relevant quality documents for our selected model, material and destination market.', 'factory-review': 'We would like to review the factory processes and inspection arrangements for our project.', tooling: 'We would like to discuss custom tooling and product development.', 'oem-brief': 'We would like to discuss an OEM kitchenware project.\nDrawing / reference sample:\nMaterial and construction:\nTarget market:\nQuantity and target date:', 'delivery-review': 'We would like to review the delivery plan for our order.\nProducts and quantities:\nRequired completion / shipping milestone:\nInspection requirements:', 'ms-lid': 'We would like to review MS lid options for an 01RC body.\nBody size / capacity:\nMaterial:\nQuantity:', '04-series': 'We would like to review the 04 series with stainless steel or bamboo lids.\nLid preference:\nCapacity / dimensions:\nQuantity:' };
    let text = products.length ? 'Models of interest:\n' + products.map(p => `${p.name} | ${p.capacity} | ${p.size} | ${p.material} | ${p.lid}`).join('\n') + '\n\nTarget market:\nQuantity:\nCustomization:' : interests[params.get('interest')] || '';
    if (text && !message.value) {
      message.value = text;
      const notice = $('.brief-notice', form); notice.hidden = false; notice.textContent = 'Your selected product information is ready to review. Add your requirements below; nothing has been sent.';
      const categories = { storage: 'Stainless steel food storage containers', cookware: 'Stainless steel cookware', plates: 'Stainless steel serving plates / trays', kettles: 'Stainless steel kettles' };
      if (products.length && products.every(p => p.category === products[0].category)) category.value = categories[products[0].category];
      else if (params.get('interest') === 'tooling') category.value = 'Custom OEM / tooling';
    }
    $('input[type="file"]', form)?.addEventListener('change', event => {
      const file = event.target.files[0]; $('[data-file-label]').textContent = file ? `${file.name} · ${Math.ceil(file.size / 1024)} KB` : 'Choose a drawing, logo or reference photo';
    });
    form.addEventListener('submit', event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      $('.form-result', form).hidden = false;
      $('.form-result', form).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'nearest' });
    });
    $('[data-export-brief]')?.addEventListener('click', () => {
      const data = new FormData(form);
      const labels = { name: 'Name', company: 'Company', email: 'Work email', country: 'Country / market', category: 'Product range', quantity: 'Estimated quantity', message: 'Product brief' };
      const text = 'MayLendy — project enquiry draft\nThis draft has not been sent.\n\n' + Object.entries(labels).map(([key,label]) => `${label}: ${data.get(key) || ''}`).join('\n\n') + '\n\nReference file: ' + ($('input[type="file"]', form)?.files[0]?.name || 'None') + '\nFile contents are not included.\n';
      download('MayLendy-project-brief.txt', text);
    });
  }
  function countUp() {
    const nodes = $$('[data-count-to]');
    if (!nodes.length) return;
    if (reduced.matches || typeof IntersectionObserver !== 'function') {
      nodes.forEach(node => { node.dataset.countState = 'static'; });
      return;
    }
    const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    const records = new Map();
    let frame = 0, lastTime = null, observer;
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastTime = null;
    }
    const active = () => [...records.values()].some(record => record.visible && record.started && !record.done);
    function schedule() {
      if (reduced.matches) { finishAll(); return; }
      if (!frame && !document.hidden && active()) frame = requestAnimationFrame(tick);
    }
    function finish(record) {
      record.value.textContent = record.final;
      record.done = true;
      record.node.dataset.countState = 'complete';
      observer?.unobserve(record.node);
    }
    function finishAll() {
      stop(); observer?.disconnect();
      records.forEach(finish);
    }
    function tick(time) {
      frame = 0;
      if (reduced.matches) { finishAll(); return; }
      if (document.hidden) { lastTime = null; return; }
      const delta = lastTime === null ? 0 : Math.max(0, time - lastTime);
      lastTime = time;
      records.forEach(record => {
        if (!record.started || !record.visible || record.done) return;
        record.elapsed = Math.min(record.duration, record.elapsed + delta);
        if (record.elapsed >= record.duration) { finish(record); return; }
        const progress = record.elapsed / record.duration;
        const text = number.format(Math.floor(record.target * (1 - (1 - progress) ** 3)));
        if (record.value.textContent !== text) record.value.textContent = text;
      });
      if (active()) schedule(); else lastTime = null;
    }
    nodes.forEach(node => {
      const value = $('[data-count-value]', node);
      const target = Number(node.dataset.countTo);
      if (!value || !Number.isSafeInteger(target) || target <= 0) { node.dataset.countState = 'static'; return; }
      records.set(node, { node, value, target, final: value.textContent, duration: 1000,
        elapsed: 0, started: false, done: false, visible: false });
      value.textContent = '0'; node.dataset.countState = 'waiting';
    });
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.get(entry.target);
        if (!record || record.done) return;
        record.visible = entry.isIntersecting && entry.intersectionRatio >= .6;
        if (record.visible) { record.started = true; record.node.dataset.countState = 'running'; }
        else if (record.started) record.node.dataset.countState = 'paused';
      });
      if (active()) schedule(); else stop();
    }, { threshold: [0, .6, 1], rootMargin: '0px 0px -48px 0px' });
    records.forEach(record => observer.observe(record.node));
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else schedule(); });
    const reduceChange = () => { if (reduced.matches) finishAll(); };
    if (reduced.addEventListener) reduced.addEventListener('change', reduceChange); else reduced.addListener(reduceChange);
    addEventListener('beforeprint', finishAll);
    addEventListener('pagehide', stop);
    addEventListener('pageshow', schedule);
  }
  function scroll() {
    let queued = false;
    function update() {
      const distance = document.documentElement.scrollHeight - innerHeight;
      $('.reading-progress').style.transform = `scaleX(${distance > 0 ? Math.min(1, scrollY / distance) : 0})`;
      $('.site-header').classList.toggle('is-scrolled', scrollY > 20);
      $('.back-top').classList.toggle('is-visible', scrollY > 700); queued = false;
    }
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    $('.back-top').addEventListener('click', () => scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' })); update();
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); } }), { threshold: .04 });
    $$('.section-heading,.range-card,.proof-layout,.project-steps li,.evidence-summary-grid,.process-layout,.responsibility-grid').forEach(node => { node.dataset.reveal = ''; if (node.getBoundingClientRect().top > innerHeight) node.classList.add('is-pending'); observer.observe(node); });
    document.addEventListener('focusin', event => event.target.closest('[data-reveal]')?.classList.remove('is-pending'));
    reduced.addEventListener('change', () => { if (reduced.matches) $$('.is-pending').forEach(n => n.classList.remove('is-pending')); });
  }
  document.addEventListener('DOMContentLoaded', () => {
    navigation(); catalog(); comparison(); media(); questions(); enquiry(); scroll(); countUp();
    window.lucide?.createIcons();
    document.documentElement.dataset.siteReady = 'true';
    document.documentElement.dataset.atelierReady = 'true';
  });
})();
