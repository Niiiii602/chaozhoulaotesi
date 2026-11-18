/* Thin production routing adapter; the existing API/mail/tracking worker is preserved. */
import legacy from './legacy-worker.mjs';
const aliases = /*RELEASE_ALIASES*/;
const hosts = new Set(['maylendy.com','www.maylendy.com']);
const laotesHosts = new Set(['laotes.com','www.laotes.com']);
const laotesPages = new Set(['products','factory-tour','quality-delivery','about-us','qa','contact','analytics']);
async function laotesAsset(request, env, url) {
  const canonical = new URL(url);
  canonical.protocol = 'https:'; canonical.port = '';
  if (/^\/index(?:\.html)?\/?$/.test(url.pathname)) canonical.pathname = '/';
  else if (/^\/oem-tooling(?:\.html)?\/?$/.test(url.pathname)) canonical.pathname = '/quality-delivery';
  else {
    const page = url.pathname.match(/^\/([^/]+?)(?:\.html)?\/?$/);
    if (page && laotesPages.has(page[1])) canonical.pathname = '/' + page[1];
  }
  if (canonical.href !== url.href) return new Response(null, { status: 302, headers: { Location: canonical.href, 'Cache-Control': 'no-store' } });
  const assetUrl = new URL(url); assetUrl.pathname = url.pathname === '/' ? '/__laotes' : '/__laotes' + url.pathname;
  let response = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (response.status === 404) {
    assetUrl.pathname = '/__laotes/404';
    const fallback = await env.ASSETS.fetch(new Request(assetUrl, request));
    return new Response(request.method === 'HEAD' ? null : fallback.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
  }
  const location = response.headers.get('Location');
  if (location) {
    const target = new URL(location, url);
    if (target.pathname.startsWith('/__laotes')) target.pathname = target.pathname.slice('/__laotes'.length) || '/';
    target.hostname = url.hostname; target.protocol = 'https:';
    const headers = new Headers(response.headers); headers.set('Location', target.href);
    headers.set('Cache-Control', 'no-store');
    response = new Response(response.body, { status: response.status, headers });
  }
  const headers = new Headers(response.headers);
  if (headers.get('Content-Type')?.includes('text/html')) headers.set('Cache-Control', 'no-store');
  if (url.searchParams.get('refresh') === 'laotes') {
    headers.set('Clear-Site-Data', '"cache"');
    headers.set('Cache-Control', 'no-store');
  }
  return new Response(response.body, { status: response.status, headers });
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/r/') && !url.pathname.startsWith('/o/')) {
      if (url.pathname.startsWith('/__laotes')) return new Response('Not found', { status: 404 });
      if (laotesHosts.has(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
        if (/^\/(?:review(?:\.html)?|tools|data|launch|sandbox[^/]*)(?:\/|$)/i.test(url.pathname) || /\.(?:zip|ps1|cmd|toml|py)$/i.test(url.pathname)) return new Response('Not found', { status: 404 });
        return laotesAsset(request, env, url);
      }
      if (/^\/(?:review(?:\.html)?|tools|data|launch|sandbox[^/]*)(?:\/|$)/i.test(url.pathname) || /\.(?:zip|ps1|cmd|toml|py)$/i.test(url.pathname)) {
        return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      if (request.method === 'GET' || request.method === 'HEAD') {
        const target = new URL(url);
        if (hosts.has(url.hostname)) { target.protocol = 'https:'; target.hostname = 'maylendy.com'; target.port = ''; }
        if (Object.hasOwn(aliases, url.pathname)) target.pathname = aliases[url.pathname];
        if (target.href !== url.href) return Response.redirect(target.href, 301);
      }
    }
    const response = await legacy.fetch(request, env, ctx);
    if (!url.pathname.endsWith('/factory-workshop-maylendy.mp4') || response.status !== 200) return response;
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    const range = request.headers.get('Range');
    if (request.method !== 'GET' || !range) return new Response(response.body, { status: response.status, headers });
    const ifRange = request.headers.get('If-Range');
    if (ifRange && ifRange !== headers.get('ETag') && ifRange !== headers.get('Last-Modified')) return new Response(response.body, { status: 200, headers });
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const data = await response.arrayBuffer(), size = data.byteLength;
    if (!match || (!match[1] && !match[2])) {
      headers.set('Content-Range', 'bytes */' + size); headers.set('Content-Length', '0');
      return new Response(null, { status: 416, headers });
    }
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
      headers.set('Content-Range', 'bytes */' + size); headers.set('Content-Length', '0');
      return new Response(null, { status: 416, headers });
    }
    headers.delete('Content-Encoding');
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(data.slice(start, end + 1), { status: 206, headers });
  }
};
