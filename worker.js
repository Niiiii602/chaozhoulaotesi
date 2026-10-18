/**
 * laotes.com — Cloudflare Worker
 *
 * Routes
 *   GET  /api/health  -> which sending channel is wired up (never exposes secrets)
 *   POST /api/quote   -> enquiry form endpoint: validate, rate-limit, then send
 *   *                 -> static assets (env.ASSETS)
 *
 * Sending channels (first one configured wins):
 *   1. env.EMAIL              Cloudflare Email Service binding  ([[send_email]])
 *   2. env.RESEND_API_KEY     Resend HTTP API
 *   3. env.ZEPTOMAIL_TOKEN    Zoho ZeptoMail HTTP API
 *
 * Config vars (wrangler [vars] / secrets):
 *   QUOTE_TO      destination mailbox            default: nichole@laotes.com
 *   QUOTE_FROM    From address                   default: website@laotes.com
 *   QUOTE_SUBJECT_PREFIX                         default: [Website enquiry]
 *   ZEPTOMAIL_API ZeptoMail endpoint             default: https://api.zeptomail.com/v1.1/email
 *
 * If no channel is configured the endpoint returns 503 and the page falls back to
 * the "email us directly" alert, so nothing is silently lost.
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 5;
const MAX_FILES = 3;
const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024; // provider limits are ~5 MiB per message

const rateBuckets = new Map(); // isolate-local, best-effort flood protection

const FIELDS = [
  ['name', 'Name'],
  ['company', 'Company'],
  ['email', 'Work email'],
  ['country', 'Country / market'],
  ['category', 'Product category'],
  ['quantity', 'Estimated quantity'],
  ['message', 'What they need'],
];

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

function rateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start > RATE_WINDOW_MS) {
    if (rateBuckets.size > 5000) rateBuckets.clear();
    rateBuckets.set(ip, { start: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX_PER_WINDOW;
}

/**
 * Channels are tried in order until one succeeds, so a single provider outage
 * (or an expired ZeptoMail credit) can never silently swallow an enquiry.
 */
function availableChannels(env) {
  const channels = [];
  if (env.WEBMAIL_KV && env.ZOHO_CLIENT_ID && env.ZOHO_CLIENT_SECRET) channels.push('zoho');
  if (env.EMAIL) channels.push('cloudflare-email-service');
  if (env.RESEND_API_KEY) channels.push('resend');
  if (env.ZEPTOMAIL_TOKEN) channels.push('zeptomail');
  return channels;
}

/** Back-compat: the first configured channel. */
function configuredChannel(env) {
  return availableChannels(env)[0] || null;
}

let zohoTokenCache = { value: null, expiresAt: 0 };

async function zohoAccessToken(env) {
  const now = Date.now();
  if (zohoTokenCache.value && now < zohoTokenCache.expiresAt) return zohoTokenCache.value;
  const refreshToken = await env.WEBMAIL_KV.get('zoho_refresh_token');
  if (!refreshToken) throw new Error('zoho refresh token not found in KV');
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.ZOHO_CLIENT_ID,
      client_secret: env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`zoho token refresh failed: ${JSON.stringify(body).slice(0, 160)}`);
  }
  zohoTokenCache = {
    value: body.access_token,
    expiresAt: now + (Number(body.expires_in || 3600) - 120) * 1000,
  };
  return body.access_token;
}

async function zohoAccountId(env, token) {
  if (env.ZOHO_ACCOUNT_ID) return env.ZOHO_ACCOUNT_ID;
  const res = await fetch('https://mail.zoho.com/api/accounts', {
    headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  const first = (body.data || [])[0];
  if (!first) throw new Error('no Zoho account available');
  return String(first.accountId);
}

// Zoho can return an API-level error inside an HTTP-success response.
// Never treat an unreadable or incomplete acknowledgement as a sent message.
async function readZohoResponse(response, operation) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`zoho ${operation}: invalid JSON response (HTTP ${response.status})`);
  }
  const code = body && body.status && body.status.code;
  const hasApiError = body && (body.error || body.errorCode ||
    (body.data && (body.data.error || body.data.errorCode)));
  if (!response.ok || !body || typeof body !== 'object' || Array.isArray(body) ||
      (code != null && !(Number(code) >= 200 && Number(code) < 300)) || hasApiError) {
    throw new Error(`zoho ${operation}: request rejected (HTTP ${response.status})`);
  }
  return body;
}

async function uploadZohoAttachments(env, message, token, accountId) {
  if (!message.files.length) return [];
  const form = new FormData();
  for (const file of message.files) form.append('attach', file.value, file.name);
  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${accountId}/messages/attachments?uploadType=multipart&isInline=false`,
    {
      method: 'POST',
      headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json' },
      body: form,
    },
  );
  const body = await readZohoResponse(response, 'attachment upload');
  if (!Array.isArray(body.data) || body.data.length !== message.files.length) {
    throw new Error('zoho attachment upload: incomplete acknowledgement');
  }
  return body.data.map((attachment) => {
    const keys = ['storeName', 'attachmentPath', 'attachmentName'];
    if (!attachment || keys.some((key) =>
      !['string', 'number'].includes(typeof attachment[key]) || !String(attachment[key]).trim())) {
      throw new Error('zoho attachment upload: missing attachment metadata');
    }
    return Object.fromEntries(keys.map((key) => [key, String(attachment[key])]));
  });
}

/** Send through the mailbox itself, uploading every attachment before sending. */
async function sendViaZoho(env, message) {
  const token = await zohoAccessToken(env);
  const accountId = await zohoAccountId(env, token);
  const attachments = await uploadZohoAttachments(env, message, token, accountId);
  const res = await fetch(`https://mail.zoho.com/api/accounts/${accountId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fromAddress: message.from,
      toAddress: Array.isArray(message.to) ? message.to.join(',') : message.to,
      subject: message.subject,
      content: message.html,
      mailFormat: 'html',
      askReceipt: 'no',
      ...(attachments.length ? { attachments } : {}),
    }),
  });
  const body = await readZohoResponse(res, 'send');
  const id = body.data && body.data.messageId;
  if (!['string', 'number'].includes(typeof id) || !String(id).trim()) {
    throw new Error('zoho send: missing message acknowledgement');
  }
  return String(id);
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function parseSubmission(request) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/json')) {
    const body = await request.json();
    return { fields: body || {}, files: [] };
  }
  const form = await request.formData();
  const fields = {};
  const files = [];
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') {
      fields[key] = value;
      continue;
    }
    if (value && typeof value === 'object' && 'arrayBuffer' in value && value.size > 0) {
      files.push({ name: value.name || 'attachment', type: value.type || 'application/octet-stream', size: value.size, value });
    }
  }
  return { fields, files };
}

function buildMessage(fields, files, request, env, destinations) {
  const prefix = destinations.subjectPrefix || env.QUOTE_SUBJECT_PREFIX || '[Website enquiry]';
  const who = fields.company || fields.name || 'Unknown company';
  // A probe supplies its own subject so it is never mistaken for a real enquiry.
  const subject = destinations.subject || `${prefix} ${who} — ${fields.category || 'general'}`;

  const rows = FIELDS.filter(([key]) => String(fields[key] || '').trim()).map(
    ([key, label]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(label)}</td>` +
      `<td style="padding:6px 0;color:#111827"><strong>${esc(fields[key]).replace(/\n/g, '<br>')}</strong></td></tr>`,
  );

  const meta = [
    ['Received', new Date().toISOString()],
    ['Page', fields._page || request.headers.get('referer') || ''],
    ['IP', request.headers.get('cf-connecting-ip') || ''],
    ['User agent', request.headers.get('user-agent') || ''],
    ['Attachments', files.length ? files.map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`).join(', ') : 'none'],
  ].map(
    ([label, value]) =>
      `<tr><td style="padding:2px 12px 2px 0;color:#9ca3af;white-space:nowrap">${esc(label)}</td><td style="padding:2px 0;color:#9ca3af">${esc(value)}</td></tr>`,
  );

  // Zoho's send API has no per-message Reply-To, so the notification leads with a
  // one-click mailto back to the enquirer (ZeptoMail sets Reply-To natively).
  const replyTo = String(fields.email || '').trim();
  const replyLink = replyTo
    ? `<p style="margin:0 0 14px;padding:12px 14px;background:#fdeee7;border-radius:8px">` +
      `<a href="mailto:${esc(replyTo)}?subject=${encodeURIComponent(`Re: ${subject}`)}" ` +
      `style="color:#b8471c;font-weight:700;text-decoration:none">→ 点击回复 ${esc(fields.name || replyTo)} &lt;${esc(replyTo)}&gt;</a>` +
      `</p>`
    : '';

  const html =
    `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;line-height:1.5">` +
    `<h2 style="margin:0 0 12px;font-size:17px">New enquiry from laotes.com</h2>` +
    replyLink +
    `<table style="border-collapse:collapse">${rows.join('')}</table>` +
    `<hr style="margin:18px 0;border:0;border-top:1px solid #e5e7eb">` +
    `<table style="border-collapse:collapse;font-size:12px">${meta.join('')}</table>` +
    `</div>`;

  const text = [
    'New enquiry from laotes.com',
    '',
    ...FIELDS.filter(([key]) => String(fields[key] || '').trim()).map(([key, label]) => `${label}: ${fields[key]}`),
    '',
    `Attachments: ${files.length ? files.map((f) => f.name).join(', ') : 'none'}`,
  ].join('\n');

  return {
    to: destinations.to,
    from: env.QUOTE_FROM || 'website@laotes.com',
    replyTo: fields.email || undefined,
    subject,
    html,
    text,
    files,
  };
}

async function sendViaCloudflare(env, message) {
  const attachments = [];
  for (const file of message.files) {
    attachments.push({
      content: toBase64(await file.value.arrayBuffer()),
      filename: file.name,
      type: file.type,
      disposition: 'attachment',
    });
  }
  const result = await env.EMAIL.send({
    to: message.to,
    from: message.from,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
    attachments: attachments.length ? attachments : undefined,
  });
  return result && result.messageId ? result.messageId : 'sent';
}

async function sendViaResend(env, message) {
  const attachments = [];
  for (const file of message.files) {
    attachments.push({ filename: file.name, content: toBase64(await file.value.arrayBuffer()) });
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: message.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      attachments: attachments.length ? attachments : undefined,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`resend ${res.status}: ${body.slice(0, 300)}`);
  try {
    return JSON.parse(body).id || 'sent';
  } catch {
    return 'sent';
  }
}

async function sendViaZeptoMail(env, message, account) {
  const attachments = [];
  for (const file of message.files) {
    attachments.push({ name: file.name, content: toBase64(await file.value.arrayBuffer()), mime_type: file.type });
  }
  const endpoint = env.ZEPTOMAIL_API || 'https://api.zeptomail.com/v1.1/email';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { address: message.from, name: env.QUOTE_FROM_NAME || 'LAOTESI Website' },
      to: (Array.isArray(message.to) ? message.to : [message.to]).map((address) => ({
        email_address: { address, name: account },
      })),
      reply_to: message.replyTo ? [{ address: message.replyTo, name: '' }] : undefined,
      subject: message.subject,
      htmlbody: message.html,
      textbody: message.text,
      attachments: attachments.length ? attachments : undefined,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`zeptomail ${res.status}: ${body.slice(0, 300)}`);
  try {
    // ZeptoMail returns { data: [...], message: "OK", request_id: "..." }
    return JSON.parse(body).request_id || 'sent';
  } catch {
    return 'sent';
  }
}

async function handleQuote(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (rateLimited(ip)) {
    return json({ ok: false, error: 'rate_limited', message: 'Too many submissions, please try again shortly.' }, 429);
  }

  const length = Number(request.headers.get('content-length') || 0);
  if (length > 8 * 1024 * 1024) {
    return json({ ok: false, error: 'too_large', message: 'Attachment too large.' }, 413);
  }

  let submission;
  try {
    submission = await parseSubmission(request);
  } catch (error) {
    return json({ ok: false, error: 'bad_request', message: 'Could not read the submission.' }, 400);
  }

  const { fields, files } = submission;

  // Honeypot: real users never fill this hidden field.
  if (String(fields._honey || fields.website || '').trim()) {
    return json({ ok: true, accepted: true });
  }

  const missing = ['name', 'company', 'email'].filter((key) => !String(fields[key] || '').trim());
  if (missing.length) {
    return json({ ok: false, error: 'missing_fields', fields: missing, message: 'Please fill in the required fields.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(fields.email).trim())) {
    return json({ ok: false, error: 'invalid_email', message: 'Please check the email address.' }, 400);
  }

  // Reject excess attachments instead of silently dropping customer files.
  if (files.length > MAX_FILES) {
    return json({ ok: false, error: 'too_many_attachments',
      message: `Please attach no more than ${MAX_FILES} files. Your enquiry has not been sent.` }, 413);
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_ATTACHMENT_BYTES) {
    return json({ ok: false, error: 'attachments_too_large',
      message: 'Please keep attachments within 4 MiB in total. Your enquiry has not been sent.' }, 413);
  }

  const channels = availableChannels(env);
  if (!channels.length) {
    return json(
      {
        ok: false,
        error: 'no_sender_configured',
        message: 'The enquiry endpoint is not connected to a mailbox yet.',
      },
      503,
    );
  }

  const destination = env.QUOTE_TO || 'nichole@laotes.com';
  const message = buildMessage({ ...fields, email: String(fields.email).trim() }, files, request, env, { to: destination });

  const attempts = [];
  let id = null;
  let channel = null;
  for (const candidate of channels) {
    try {
      if (candidate === 'zoho') id = await sendViaZoho(env, message);
      else if (candidate === 'cloudflare-email-service') id = await sendViaCloudflare(env, message);
      else if (candidate === 'resend') id = await sendViaResend(env, message);
      else id = await sendViaZeptoMail(env, message, fields.company || 'laotes.com website');
      channel = candidate;
      break;
    } catch (error) {
      attempts.push(`${candidate}: ${error && error.message}`);
      console.error('enquiry send failed via', candidate, error && error.message);
    }
  }

  if (!channel) {
    return json(
      {
        ok: false,
        error: 'send_failed',
        message: 'We could not send your enquiry automatically.',
        attempts,
      },
      502,
    );
  }
  return json({ ok: true, id, channel, fallbacks: attempts });
}

/**
 * 外发健康探针。
 *
 * 为什么不能拿 /api/quote 当探针：那条链路是 website@laotes.com -> nichole@laotes.com，
 * 属于**同组织内部投递**。而 Zoho 的出站过滤器掐的是**对外**发送，
 * 内部邮件往往照常。所以探针必须真发一封到**外部地址**才有意义。
 *
 * 需要 x-probe-token 头，避免任何人拿它当免费发信器。
 */
async function handleProbe(request, env) {
  const provided = request.headers.get('x-probe-token') || '';
  if (!env.PROBE_TOKEN || provided !== env.PROBE_TOKEN) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }
  const to = String(env.PROBE_TO || '').trim();
  if (!to) {
    return json({ ok: false, error: 'probe_to_not_configured', message: 'Set PROBE_TO to an external mailbox.' }, 503);
  }

  const url = new URL(request.url);
  // ?channel=zeptomail 可以强制走某一条渠道，用于单独验证降级链
  // （否则只要 Zoho 正常，后面的渠道永远不会被真实触发过）。
  const forced = String(url.searchParams.get('channel') || '').trim();
  const all = availableChannels(env);
  const channels = forced ? all.filter((c) => c === forced) : all;
  if (!channels.length) {
    return json({ ok: false, error: 'no_sender_configured', requested: forced || null, available: all }, 503);
  }

  const stamp = new Date().toISOString();
  const message = buildMessage(
    {
      name: 'Outbound health probe',
      company: 'laotes.com',
      email: env.PROBE_REPLY_TO || env.QUOTE_FROM || 'website@laotes.com',
      country: '-',
      product: 'laotes.com outbound probe',
      quantity: '-',
      message: `Automated outbound health check. If you are reading this, website@laotes.com could still send EXTERNAL mail at ${stamp}.`,
    },
    [],
    request,
    env,
    { to, subject: `[HEALTH PROBE] laotes.com outbound OK @ ${stamp}` },
  );

  const attempts = [];
  for (const candidate of channels) {
    try {
      const id = candidate === 'zoho'
        ? await sendViaZoho(env, message)
        : candidate === 'cloudflare-email-service'
          ? await sendViaCloudflare(env, message)
          : candidate === 'resend'
            ? await sendViaResend(env, message)
            : await sendViaZeptoMail(env, message, 'outbound probe');
      return json({ ok: true, to, channel: candidate, id, stamp, fallbacks: attempts });
    } catch (error) {
      attempts.push(`${candidate}: ${error && error.message}`);
    }
  }
  // 全部渠道失败 = 外发大概率被拦了，这正是要告警的时刻。
  return json({ ok: false, error: 'probe_send_failed', to, stamp, attempts }, 502);
}

/* ------------------------------------------------------------------ *
 * 开发信互动追踪：/r/<token> 跳转、/o/<token>.gif 像素
 *
 * 为什么挂在这个域名（laotes.com）而不是 mail.laotes.com：
 * mail.laotes.com 整个站在 Cloudflare Access 后面，收件人点链接会被拦下来
 * 要求邮箱验证码 —— 追踪记不到，而且对方会看到我们的登录页，非常难看。
 * laotes.com 本来就是公网首页，而且是**信里那个链接本身的域名**，
 * 换过去看不出跳转痕迹。代价是这里要多绑一个 KV。
 *
 * 两个端点都是无登录的公开写入口，所以：
 *   · token 必须是不可猜的随机串（webmail 侧生成 24 位十六进制）
 *   · 只有 token 能解析到真实草稿时才写（不知道 token 就没法制造噪声）
 *   · 计数有上限，防止有人拿一个有效 token 刷数
 * ------------------------------------------------------------------ */

const TRACK_KEY = 'outreach:track';
const DRAFTS_KEY = 'outreach:drafts';
const COUNT_CAP = 999;

/** 1×1 透明 GIF。 */
const PIXEL_GIF = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (c) => c.charCodeAt(0),
);

async function draftIdForTrack(env, trackId) {
  const kv = env && env.OUTREACH_KV;
  if (!kv || !trackId) return null;
  const raw = await kv.get(TRACK_KEY);
  if (!raw) return null;
  try {
    const idx = JSON.parse(raw);
    const hit = idx && idx[trackId];
    return (hit && hit.draftId) || null;
  } catch {
    return null;
  }
}

/**
 * 记一次互动。
 *
 * **关键：每次取图都要记下 UA 和来源国，不能只加一个计数。**
 * 判断「真人打开」还是「机器预取」全靠这两样：
 *   · UA 告诉我们取图方是谁（Gmail 代理 / Apple 设备 / 安全网关）
 *   · 取图时间与发出时间的差告诉我们是不是送达时的预取
 * 只存一个 openedAt 的话，Apple 隐私保护的预取和真人打开就分不开了。
 *
 * 判定逻辑放在 webmail 侧（engagement.js），这里只如实记录原始事实。
 * 故意不复用 webmail 的 store.js —— 这是独立部署的 worker，不跨项目 import。
 */
async function recordHit(env, draftId, kind, meta) {
  const kv = env && env.OUTREACH_KV;
  if (!kv || !draftId) return false;
  const raw = await kv.get(DRAFTS_KEY);
  if (!raw) return false;
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!Array.isArray(list)) return false;
  const i = list.findIndex((d) => d && d.id === draftId);
  if (i < 0) return false;

  const prev = list[i].engagement || {};
  const now = Date.now();
  const hit = {
    at: now,
    ua: String((meta && meta.ua) || '').slice(0, 200),
    country: (meta && meta.country) || null,
  };
  const eng = { ...prev, trackId: prev.trackId || null };

  if (kind === 'click') {
    const arr = Array.isArray(prev.clicks) ? prev.clicks.slice(-9) : [];
    arr.push(hit);
    eng.clicks = arr;
    eng.clickCount = Math.min(COUNT_CAP, (Number(prev.clickCount) || 0) + 1);
    eng.clickedAt = prev.clickedAt || now;
    eng.lastClickAt = now;
  } else {
    const arr = Array.isArray(prev.opens) ? prev.opens.slice(-9) : [];
    arr.push(hit);
    eng.opens = arr;
    eng.openCount = Math.min(COUNT_CAP, (Number(prev.openCount) || 0) + 1);
    eng.openedAt = prev.openedAt || now;
    eng.lastOpenAt = now;
  }
  list[i] = { ...list[i], engagement: eng };
  await kv.put(DRAFTS_KEY, JSON.stringify(list));
  return true;
}

/** 从请求里取出判断用的元信息。 */
function hitMeta(request) {
  return {
    ua: request.headers.get('user-agent') || '',
    country: (request.cf && request.cf.country) || null,
  };
}

async function handleTrack(request, env, url) {
  const clickMatch = url.pathname.match(/^\/r\/([A-Za-z0-9_-]{8,64})$/);
  const openMatch = url.pathname.match(/^\/o\/([A-Za-z0-9_-]{8,64})\.gif$/);
  const meta = hitMeta(request);

  if (clickMatch) {
    const draftId = await draftIdForTrack(env, clickMatch[1]);
    if (draftId) { try { await recordHit(env, draftId, 'click', meta); } catch { /* 记不上也不能挡住跳转 */ } }
    // 不管 token 认不认得出来，都跳到首页 —— 认不出还报错等于告诉对方这是个追踪链接。
    return new Response(null, {
      status: 302,
      headers: { Location: 'https://laotes.com/', 'Cache-Control': 'no-store' },
    });
  }

  if (openMatch) {
    const draftId = await draftIdForTrack(env, openMatch[1]);
    if (draftId) { try { await recordHit(env, draftId, 'open', meta); } catch { /* 同上 */ } }
    return new Response(PIXEL_GIF, {
      headers: {
        'Content-Type': 'image/gif',
        // 必须 no-store：被缓存住就再也记不到第二次打开了
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    });
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/r/') || url.pathname.startsWith('/o/')) {
      const tracked = await handleTrack(request, env, url);
      if (tracked) return tracked;
    }

    if (url.pathname === '/api/quote') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      return handleQuote(request, env);
    }

    if (url.pathname === '/api/probe') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
      return handleProbe(request, env);
    }

    if (url.pathname === '/api/health') {
      // 顺带自检追踪用的 KV 是否真的绑上了 —— 追踪端点认不出 token 时是**静默**的
      // （为了不暴露这是个追踪链接），所以必须有一条能主动查的路径，
      // 否则「绑定忘了加」会表现成「一切正常但永远记不到点击」。
      let trackKv = { bound: false };
      if (env.OUTREACH_KV) {
        trackKv.bound = true;
        try {
          const raw = await env.OUTREACH_KV.get('outreach:drafts');
          const list = raw ? JSON.parse(raw) : [];
          const idx = JSON.parse((await env.OUTREACH_KV.get('outreach:track')) || '{}');
          trackKv.draftsVisible = Array.isArray(list) ? list.length : 0;
          trackKv.tokensBound = Object.keys(idx || {}).length;
          trackKv.draftsWithTrackId = (Array.isArray(list) ? list : []).filter((d) => d && d.trackId).length;
        } catch (e) {
          trackKv.error = String((e && e.message) || e);
        }
      }
      return json({
        ok: true,
        channel: configuredChannel(env),
        channels: availableChannels(env),
        to: env.QUOTE_TO || 'nichole@laotes.com',
        from: env.QUOTE_FROM || 'website@laotes.com',
        probeConfigured: Boolean(env.PROBE_TOKEN && env.PROBE_TO),
        probeTo: env.PROBE_TO || null,
        trackKv,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
