/* Production-only enquiry and analytics integration. No tokens are shipped. */
(() => {
  'use strict';
  const form = document.querySelector('#quote-form');
  const pattern = /(?:\b(?:seo|aeo|geo|bing|sem|ppc)\b|\bgoogle\b|\badvertis(?:e|ing|ement)\b|\bbacklinks?\b|\blink\s*building\b|\bdigital\s+marketing\b|\bsearch\s+engine\s+optimization\b|\blead\s+generation\b|\bguest\s+post(?:ing)?\b|\bsponsored\s+post\b|\bweb\s+traffic\b|\bwebsite\s+ranking\b|\bmarketing\s+promotion\b)/i;
  if (form) {
    const button = form.querySelector('button[type="submit"]');
    const result = form.querySelector('.form-result');
    const heading = result.querySelector('h3');
    const description = result.querySelector('p');
    const draft = result.querySelector('[data-export-brief]');
    let sending = false;
    function show(title, message, failed) {
      heading.textContent = title; description.textContent = message;
      result.hidden = false; result.dataset.state = failed ? 'error' : 'success';
      result.setAttribute('role', failed ? 'alert' : 'status');
      draft.hidden = !failed;
      result.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    form.addEventListener('submit', async event => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (sending || !form.reportValidity()) return;
      result.hidden = true;
      const body = new FormData(form);
      body.set('_visitor', window.LAOTESI_VISITOR_ID || '');
      body.set('_page', location.href);
      const files = [...body.values()].filter(value => typeof value !== 'string' && value.size > 0);
      if (files.length > 3 || files.reduce((total, file) => total + file.size, 0) > 4 * 1024 * 1024) {
        show('Please check your attachment.', 'Use up to three files, no more than 4 MiB in total. Your enquiry has not been sent.', true); return;
      }
      if ([...body.values()].some(value => pattern.test(typeof value === 'string' ? value : value.name || ''))) {
        show('Product and OEM enquiries only.', 'Please remove marketing or SEO-related content. Your enquiry has not been sent.', true); return;
      }
      const original = button.textContent; sending = true; button.disabled = true; button.textContent = 'Sending enquiry…';
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 60000);
      try {
        const response = await fetch('/api/quote', { method: 'POST', body, headers: { Accept: 'application/json' }, signal: abort.signal });
        let payload = null;
        try { payload = await response.json(); } catch { /* A response without acknowledgement is a failure. */ }
        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.message || 'We could not confirm delivery. Your entered details are kept; please retry or use the email address shown on this page.');
        }
        form.reset();
        const label = form.querySelector('[data-file-label]');
        if (label) label.textContent = 'Choose a drawing, logo or reference photo';
        const notice = form.querySelector('.brief-notice');
        if (notice) notice.hidden = true;
        show('Enquiry sent.', 'Thank you. Your enquiry has been accepted by our mail service. Our team will review your product requirements.', false);
      } catch (error) {
        show('Your enquiry has not been confirmed.', error.name === 'AbortError' ? 'The request timed out. Your details are kept. Please contact us before resending if you are unsure whether it was received.' : error.message, true);
      } finally {
        clearTimeout(timeout); sending = false; button.disabled = false; button.textContent = original;
      }
    }, true);
  }
  const index = JSON.parse(document.querySelector('#catalog-index')?.textContent || '[]');
  const byId = new Map(index.map(item => [item.id, item]));
  const track = item => { if (item) window.LAOTESI_TRACK?.('product_view', { product: item.name }); };
  function openedProduct() {
    const id = decodeURIComponent(location.hash.slice(1));
    const item = byId.get(id);
    if (item && new URL(item.url, location.href).pathname === location.pathname) track(item);
  }
  openedProduct(); addEventListener('hashchange', openedProduct);
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-compare],a[href*="model="]');
    if (!control) return;
    const id = control.dataset.compare || new URL(control.href).searchParams.get('model');
    track(byId.get(id));
  });
})();
