var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var SITE_HOSTNAME = "maylendy.com";
var WEBSITE_HOSTS = /* @__PURE__ */ new Set([SITE_HOSTNAME, "www." + SITE_HOSTNAME, "laotes.com", "www.laotes.com"]);
var RATE_WINDOW_MS = 6e4;
var RATE_MAX_PER_WINDOW = 5;
var MAX_FILES = 3;
var MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024;
var ANALYTICS_MAX_DAYS = 30;
var ANALYTICS_MAX_EVENTS_PER_DAY = 2e3;
var ANALYTICS_RETENTION_DAYS = 14;
var MARKETING_CONTENT_PATTERN = /(?:\b(?:seo|aeo|geo|bing|sem|ppc)\b|\bgoogle\b|\badvertis(?:e|ing|ement)\b|\bbacklinks?\b|\blink\s*building\b|\bdigital\s+marketing\b|\bsearch\s+engine\s+optimization\b|\blead\s+generation\b|\bguest\s+post(?:ing)?\b|\bsponsored\s+post\b|\bweb\s+traffic\b|\bwebsite\s+ranking\b|\bmarketing\s+promotion\b)/i;
var MARKETING_CONTENT_MESSAGE = "This form is for product and OEM enquiries only. Please remove marketing or SEO-related content.";
var rateBuckets = /* @__PURE__ */ new Map();
var FIELDS = [
  ["name", "Name"],
  ["company", "Company"],
  ["email", "Work email"],
  ["country", "Country / market"],
  ["category", "Product category"],
  ["quantity", "Estimated quantity"],
  ["message", "What they need"]
];
var HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var esc = /* @__PURE__ */ __name((value) => String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]), "esc");
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
}), "json");
function rateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start > RATE_WINDOW_MS) {
    if (rateBuckets.size > 5e3) rateBuckets.clear();
    rateBuckets.set(ip, { start: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX_PER_WINDOW;
}
__name(rateLimited, "rateLimited");
function availableChannels(env) {
  const channels = [];
  if (env.WEBMAIL_KV && env.ZOHO_CLIENT_ID && env.ZOHO_CLIENT_SECRET) channels.push("zoho");
  if (env.EMAIL) channels.push("cloudflare-email-service");
  if (env.RESEND_API_KEY) channels.push("resend");
  if (env.ZEPTOMAIL_TOKEN) channels.push("zeptomail");
  return channels;
}
__name(availableChannels, "availableChannels");
function configuredChannel(env) {
  return availableChannels(env)[0] || null;
}
__name(configuredChannel, "configuredChannel");
var zohoTokenCache = { value: null, expiresAt: 0 };
async function zohoAccessToken(env) {
  const now = Date.now();
  if (zohoTokenCache.value && now < zohoTokenCache.expiresAt) return zohoTokenCache.value;
  const refreshToken = await env.WEBMAIL_KV.get("zoho_refresh_token");
  if (!refreshToken) throw new Error("zoho refresh token not found in KV");
  const res = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.ZOHO_CLIENT_ID,
      client_secret: env.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token"
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`zoho token refresh failed: ${JSON.stringify(body).slice(0, 160)}`);
  }
  zohoTokenCache = {
    value: body.access_token,
    expiresAt: now + (Number(body.expires_in || 3600) - 120) * 1e3
  };
  return body.access_token;
}
__name(zohoAccessToken, "zohoAccessToken");
async function zohoAccountId(env, token) {
  if (env.ZOHO_ACCOUNT_ID) return env.ZOHO_ACCOUNT_ID;
  const res = await fetch("https://mail.zoho.com/api/accounts", {
    headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" }
  });
  const body = await res.json().catch(() => ({}));
  const first = (body.data || [])[0];
  if (!first) throw new Error("no Zoho account available");
  return String(first.accountId);
}
__name(zohoAccountId, "zohoAccountId");
async function readZohoResponse(response, operation) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`zoho ${operation}: invalid JSON response (HTTP ${response.status})`);
  }
  const code = body && body.status && body.status.code;
  const hasApiError = body && (body.error || body.errorCode || body.data && (body.data.error || body.data.errorCode));
  if (!response.ok || !body || typeof body !== "object" || Array.isArray(body) || code != null && !(Number(code) >= 200 && Number(code) < 300) || hasApiError) {
    throw new Error(`zoho ${operation}: request rejected (HTTP ${response.status})`);
  }
  return body;
}
__name(readZohoResponse, "readZohoResponse");
async function uploadZohoAttachments(env, message, token, accountId) {
  if (!message.files.length) return [];
  const form = new FormData();
  for (const file of message.files) form.append("attach", file.value, file.name);
  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${accountId}/messages/attachments?uploadType=multipart&isInline=false`,
    {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" },
      body: form
    }
  );
  const body = await readZohoResponse(response, "attachment upload");
  if (!Array.isArray(body.data) || body.data.length !== message.files.length) {
    throw new Error("zoho attachment upload: incomplete acknowledgement");
  }
  return body.data.map((attachment) => {
    const keys = ["storeName", "attachmentPath", "attachmentName"];
    if (!attachment || keys.some((key) => !["string", "number"].includes(typeof attachment[key]) || !String(attachment[key]).trim())) {
      throw new Error("zoho attachment upload: missing attachment metadata");
    }
    return Object.fromEntries(keys.map((key) => [key, String(attachment[key])]));
  });
}
__name(uploadZohoAttachments, "uploadZohoAttachments");
async function sendViaZoho(env, message) {
  const token = await zohoAccessToken(env);
  const accountId = await zohoAccountId(env, token);
  const attachments = await uploadZohoAttachments(env, message, token, accountId);
  const res = await fetch(`https://mail.zoho.com/api/accounts/${accountId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      fromAddress: message.from,
      toAddress: Array.isArray(message.to) ? message.to.join(",") : message.to,
      subject: message.subject,
      content: message.html,
      mailFormat: "html",
      askReceipt: "no",
      ...attachments.length ? { attachments } : {}
    })
  });
  const body = await readZohoResponse(res, "send");
  const id = body.data && body.data.messageId;
  if (!["string", "number"].includes(typeof id) || !String(id).trim()) {
    throw new Error("zoho send: missing message acknowledgement");
  }
  return String(id);
}
__name(sendViaZoho, "sendViaZoho");
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(binary);
}
__name(toBase64, "toBase64");
async function parseSubmission(request) {
  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (type.includes("application/json")) {
    const body = await request.json();
    return { fields: body || {}, files: [] };
  }
  const form = await request.formData();
  const fields = {};
  const files = [];
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      fields[key] = value;
      continue;
    }
    if (value && typeof value === "object" && "arrayBuffer" in value && value.size > 0) {
      files.push({ name: value.name || "attachment", type: value.type || "application/octet-stream", size: value.size, value });
    }
  }
  return { fields, files };
}
__name(parseSubmission, "parseSubmission");
function containsMarketingContent(fields, files = []) {
  const values = Object.values(fields || {}).map((value) => String(value ?? ""));
  values.push(...files.map((file) => String(file && file.name || "")));
  return values.some((value) => MARKETING_CONTENT_PATTERN.test(value));
}
__name(containsMarketingContent, "containsMarketingContent");
function analyticsStore(env) {
  return env.ANALYTICS_KV || env.OUTREACH_KV || null;
}
__name(analyticsStore, "analyticsStore");
function analyticsDay(date = /* @__PURE__ */ new Date()) {
  return date.toISOString().slice(0, 10);
}
__name(analyticsDay, "analyticsDay");
function analyticsText(value, max = 160) {
  return String(value ?? "").trim().slice(0, max);
}
__name(analyticsText, "analyticsText");
function analyticsPagePath(value, fallback = "/") {
  const path = analyticsText(value, 180);
  return path.startsWith("/") ? path.split("?")[0].split("#")[0] || "/" : fallback;
}
__name(analyticsPagePath, "analyticsPagePath");
function analyticsReferrer(value) {
  try {
    return new URL(String(value || "")).hostname.slice(0, 120);
  } catch {
    return "";
  }
}
__name(analyticsReferrer, "analyticsReferrer");
function analyticsDevice(userAgent) {
  const agent = String(userAgent || "");
  if (/tablet|ipad/i.test(agent)) return "tablet";
  if (/mobile|android|iphone/i.test(agent)) return "mobile";
  return "desktop";
}
__name(analyticsDevice, "analyticsDevice");
function normalizeAnalyticsEvent(request, body) {
  const visitorId = analyticsText(body && (body.visitorId || body.sessionId), 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(visitorId)) return null;
  const url = new URL(request.url);
  const event = body && body.event === "product_view" ? "product_view" : "page_view";
  const country = analyticsText(request.cf && request.cf.country, 8);
  return {
    at: (/* @__PURE__ */ new Date()).toISOString(),
    visitorId,
    event,
    path: analyticsPagePath(body && body.path, url.pathname),
    title: analyticsText(body && body.title, 160),
    product: event === "product_view" ? analyticsText(body && body.product, 160) : "",
    referrer: analyticsReferrer(body && body.referrer),
    source: analyticsText(body && body.source, 80),
    campaign: analyticsText(body && body.campaign, 120),
    country,
    device: analyticsDevice(request.headers.get("user-agent"))
  };
}
__name(normalizeAnalyticsEvent, "normalizeAnalyticsEvent");
async function handleVisit(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "analytics";
  if (rateLimited("analytics:" + ip)) return new Response(null, { status: 204 });
  const store = analyticsStore(env);
  if (!store) return json({ ok: false, error: "analytics_unavailable" }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const event = normalizeAnalyticsEvent(request, body);
  if (!event) return json({ ok: false, error: "invalid_event" }, 400);
  const day = analyticsDay();
  const key = "site:analytics:" + day;
  let record = { version: 1, day, events: [] };
  try {
    const raw = await store.get(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) record = parsed;
    }
  } catch {
  }
  if (record.events.length >= ANALYTICS_MAX_EVENTS_PER_DAY) return json({ ok: true, recorded: false }, 202);
  record.events.push(event);
  await store.put(key, JSON.stringify(record), { expirationTtl: ANALYTICS_RETENTION_DAYS * 86400 });
  return json({ ok: true, recorded: true }, 202);
}
__name(handleVisit, "handleVisit");
function analyticsAuthorized(request, env) {
  const expected = analyticsText(env.ANALYTICS_ADMIN_TOKEN, 200);
  const received = request.headers.get("authorization") || "";
  return Boolean(expected && received === "Bearer " + expected);
}
__name(analyticsAuthorized, "analyticsAuthorized");
function topAnalyticsValues(values, limit = 10) {
  const counts = /* @__PURE__ */ new Map();
  for (const value of values) {
    const key = analyticsText(value, 160) || "(direct)";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([value, count]) => ({ value, count }));
}
__name(topAnalyticsValues, "topAnalyticsValues");
async function handleAnalytics(request, env, url) {
  if (!analyticsText(env.ANALYTICS_ADMIN_TOKEN, 200)) {
    return json({ ok: false, error: "analytics_admin_not_configured" }, 503);
  }
  if (!analyticsAuthorized(request, env)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "WWW-Authenticate": "Bearer" }
    });
  }
  const requestedDays = Number(url.searchParams.get("days") || 7);
  const days = Math.min(ANALYTICS_MAX_DAYS, Math.max(1, Number.isFinite(requestedDays) ? Math.floor(requestedDays) : 7));
  const store = analyticsStore(env);
  if (!store) return json({ ok: false, error: "analytics_unavailable" }, 503);
  const visitorMap = /* @__PURE__ */ new Map();
  const daily = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(Date.now() - offset * 864e5);
    const day = analyticsDay(date);
    let events = [];
    try {
      const raw = await store.get("site:analytics:" + day);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.events)) events = parsed.events;
    } catch {
      events = [];
    }
    const pageViews = events.filter((event) => event.event === "page_view");
    const productViews = events.filter((event) => event.event === "product_view");
    const uniqueVisitors = new Set(events.map((event) => event.visitorId).filter(Boolean));
    daily.push({
      day,
      events: events.length,
      pageViews: pageViews.length,
      productViews: productViews.length,
      uniqueVisitors: uniqueVisitors.size,
      topPages: topAnalyticsValues(events.map((event) => event.path)),
      topProducts: topAnalyticsValues(productViews.map((event) => event.product)).filter((item) => item.value !== "(direct)"),
      sources: topAnalyticsValues(events.map((event) => event.source || event.referrer)),
      countries: topAnalyticsValues(events.map((event) => event.country)).filter((item) => item.value !== "(direct)")
    });
    for (const event of events) {
      if (!event.visitorId) continue;
      const existing = visitorMap.get(event.visitorId) || {
        id: event.visitorId.slice(0, 12),
        events: 0,
        firstSeen: event.at,
        lastSeen: event.at,
        pages: /* @__PURE__ */ new Set(),
        products: /* @__PURE__ */ new Set(),
        country: event.country || "",
        device: event.device || "",
        source: event.source || event.referrer || ""
      };
      existing.events += 1;
      existing.firstSeen = existing.firstSeen < event.at ? existing.firstSeen : event.at;
      existing.lastSeen = existing.lastSeen > event.at ? existing.lastSeen : event.at;
      if (event.path) existing.pages.add(event.path);
      if (event.product) existing.products.add(event.product);
      visitorMap.set(event.visitorId, existing);
    }
  }
  const visitors = [...visitorMap.values()].sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen))).map((visitor) => ({ ...visitor, pages: [...visitor.pages].slice(0, 20), products: [...visitor.products].slice(0, 20) }));
  return json({ ok: true, generatedAt: (/* @__PURE__ */ new Date()).toISOString(), days, retentionDays: ANALYTICS_RETENTION_DAYS, daily, visitors });
}
__name(handleAnalytics, "handleAnalytics");
function buildMessage(fields, files, request, env, destinations) {
  const prefix = destinations.subjectPrefix || env.QUOTE_SUBJECT_PREFIX || "[Website enquiry]";
  const who = fields.company || fields.name || "Unknown company";
  const subject = destinations.subject || `${prefix} ${who} \u2014 ${fields.category || "general"}`;
  const rows = FIELDS.filter(([key]) => String(fields[key] || "").trim()).map(
    ([key, label]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:#111827"><strong>${esc(fields[key]).replace(/\n/g, "<br>")}</strong></td></tr>`
  );
  const meta = [
    ["Received", (/* @__PURE__ */ new Date()).toISOString()],
    ["Page", fields._page || request.headers.get("referer") || ""],
    ["IP", request.headers.get("cf-connecting-ip") || ""],
    ["User agent", request.headers.get("user-agent") || ""],
    ...String(fields._visitor || "").trim() ? [["Anonymous visitor", String(fields._visitor).trim().slice(0, 12)]] : [],
    ["Attachments", files.length ? files.map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`).join(", ") : "none"]
  ].map(
    ([label, value]) => `<tr><td style="padding:2px 12px 2px 0;color:#9ca3af;white-space:nowrap">${esc(label)}</td><td style="padding:2px 0;color:#9ca3af">${esc(value)}</td></tr>`
  );
  const replyTo = String(fields.email || "").trim();
  const replyLink = replyTo ? `<p style="margin:0 0 14px;padding:12px 14px;background:#fdeee7;border-radius:8px"><a href="mailto:${esc(replyTo)}?subject=${encodeURIComponent(`Re: ${subject}`)}" style="color:#b8471c;font-weight:700;text-decoration:none">\u2192 \u70B9\u51FB\u56DE\u590D ${esc(fields.name || replyTo)} &lt;${esc(replyTo)}&gt;</a></p>` : "";
  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;line-height:1.5"><h2 style="margin:0 0 12px;font-size:17px">New enquiry from maylendy.com</h2>` + replyLink + `<table style="border-collapse:collapse">${rows.join("")}</table><hr style="margin:18px 0;border:0;border-top:1px solid #e5e7eb"><table style="border-collapse:collapse;font-size:12px">${meta.join("")}</table></div>`;
  const text = [
    "New enquiry from maylendy.com",
    "",
    ...FIELDS.filter(([key]) => String(fields[key] || "").trim()).map(([key, label]) => `${label}: ${fields[key]}`),
    "",
    `Attachments: ${files.length ? files.map((f) => f.name).join(", ") : "none"}`
  ].join("\n");
  return {
    to: destinations.to,
    from: env.QUOTE_FROM || "website@laotes.com",
    replyTo: fields.email || void 0,
    subject,
    html,
    text,
    files
  };
}
__name(buildMessage, "buildMessage");
async function sendViaCloudflare(env, message) {
  const attachments = [];
  for (const file of message.files) {
    attachments.push({
      content: toBase64(await file.value.arrayBuffer()),
      filename: file.name,
      type: file.type,
      disposition: "attachment"
    });
  }
  const result = await env.EMAIL.send({
    to: message.to,
    from: message.from,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
    attachments: attachments.length ? attachments : void 0
  });
  return result && result.messageId ? result.messageId : "sent";
}
__name(sendViaCloudflare, "sendViaCloudflare");
async function sendViaResend(env, message) {
  const attachments = [];
  for (const file of message.files) {
    attachments.push({ filename: file.name, content: toBase64(await file.value.arrayBuffer()) });
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: message.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      attachments: attachments.length ? attachments : void 0
    })
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`resend ${res.status}: ${body.slice(0, 300)}`);
  try {
    return JSON.parse(body).id || "sent";
  } catch {
    return "sent";
  }
}
__name(sendViaResend, "sendViaResend");
async function sendViaZeptoMail(env, message, account) {
  const attachments = [];
  for (const file of message.files) {
    attachments.push({ name: file.name, content: toBase64(await file.value.arrayBuffer()), mime_type: file.type });
  }
  const endpoint = env.ZEPTOMAIL_API || "https://api.zeptomail.com/v1.1/email";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: { address: message.from, name: env.QUOTE_FROM_NAME || "LAOTESI Website" },
      to: (Array.isArray(message.to) ? message.to : [message.to]).map((address) => ({
        email_address: { address, name: account }
      })),
      reply_to: message.replyTo ? [{ address: message.replyTo, name: "" }] : void 0,
      subject: message.subject,
      htmlbody: message.html,
      textbody: message.text,
      attachments: attachments.length ? attachments : void 0
    })
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`zeptomail ${res.status}: ${body.slice(0, 300)}`);
  try {
    return JSON.parse(body).request_id || "sent";
  } catch {
    return "sent";
  }
}
__name(sendViaZeptoMail, "sendViaZeptoMail");
async function handleQuote(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (rateLimited(ip)) {
    return json({ ok: false, error: "rate_limited", message: "Too many submissions, please try again shortly." }, 429);
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 8 * 1024 * 1024) {
    return json({ ok: false, error: "too_large", message: "Attachment too large." }, 413);
  }
  let submission;
  try {
    submission = await parseSubmission(request);
  } catch (error) {
    return json({ ok: false, error: "bad_request", message: "Could not read the submission." }, 400);
  }
  const { fields, files } = submission;
  if (String(fields._honey || fields.website || "").trim()) {
    return json({ ok: true, accepted: true });
  }
  if (containsMarketingContent(fields, files)) {
    return json({ ok: false, error: "marketing_content", message: MARKETING_CONTENT_MESSAGE }, 422);
  }
  const missing = ["name", "company", "email"].filter((key) => !String(fields[key] || "").trim());
  if (missing.length) {
    return json({ ok: false, error: "missing_fields", fields: missing, message: "Please fill in the required fields." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(fields.email).trim())) {
    return json({ ok: false, error: "invalid_email", message: "Please check the email address." }, 400);
  }
  if (files.length > MAX_FILES) {
    return json({
      ok: false,
      error: "too_many_attachments",
      message: `Please attach no more than ${MAX_FILES} files. Your enquiry has not been sent.`
    }, 413);
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_ATTACHMENT_BYTES) {
    return json({
      ok: false,
      error: "attachments_too_large",
      message: "Please keep attachments within 4 MiB in total. Your enquiry has not been sent."
    }, 413);
  }
  const channels = availableChannels(env);
  if (!channels.length) {
    return json(
      {
        ok: false,
        error: "no_sender_configured",
        message: "The enquiry endpoint is not connected to a mailbox yet."
      },
      503
    );
  }
  const destination = env.QUOTE_TO || "nichole@laotes.com";
  const message = buildMessage({ ...fields, email: String(fields.email).trim() }, files, request, env, { to: destination });
  const attempts = [];
  let id = null;
  let channel = null;
  for (const candidate of channels) {
    try {
      if (candidate === "zoho") id = await sendViaZoho(env, message);
      else if (candidate === "cloudflare-email-service") id = await sendViaCloudflare(env, message);
      else if (candidate === "resend") id = await sendViaResend(env, message);
      else id = await sendViaZeptoMail(env, message, fields.company || "maylendy.com website");
      channel = candidate;
      break;
    } catch (error) {
      attempts.push(`${candidate}: ${error && error.message}`);
      console.error("enquiry send failed via", candidate, error && error.message);
    }
  }
  if (!channel) {
    return json(
      {
        ok: false,
        error: "send_failed",
        message: "We could not send your enquiry automatically.",
        attempts
      },
      502
    );
  }
  return json({ ok: true, id, channel, fallbacks: attempts });
}
__name(handleQuote, "handleQuote");
async function handleProbe(request, env) {
  const provided = request.headers.get("x-probe-token") || "";
  if (!env.PROBE_TOKEN || provided !== env.PROBE_TOKEN) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
  const to = String(env.PROBE_TO || "").trim();
  if (!to) {
    return json({ ok: false, error: "probe_to_not_configured", message: "Set PROBE_TO to an external mailbox." }, 503);
  }
  const url = new URL(request.url);
  const forced = String(url.searchParams.get("channel") || "").trim();
  const all = availableChannels(env);
  const channels = forced ? all.filter((c) => c === forced) : all;
  if (!channels.length) {
    return json({ ok: false, error: "no_sender_configured", requested: forced || null, available: all }, 503);
  }
  const stamp = (/* @__PURE__ */ new Date()).toISOString();
  const message = buildMessage(
    {
      name: "Outbound health probe",
      company: "maylendy.com",
      email: env.PROBE_REPLY_TO || env.QUOTE_FROM || "website@laotes.com",
      country: "-",
      product: "maylendy.com outbound probe",
      quantity: "-",
      message: `Automated outbound health check. If you are reading this, website@laotes.com could still send EXTERNAL mail at ${stamp}.`
    },
    [],
    request,
    env,
    { to, subject: `[HEALTH PROBE] maylendy.com outbound OK @ ${stamp}` }
  );
  const attempts = [];
  for (const candidate of channels) {
    try {
      const id = candidate === "zoho" ? await sendViaZoho(env, message) : candidate === "cloudflare-email-service" ? await sendViaCloudflare(env, message) : candidate === "resend" ? await sendViaResend(env, message) : await sendViaZeptoMail(env, message, "outbound probe");
      return json({ ok: true, to, channel: candidate, id, stamp, fallbacks: attempts });
    } catch (error) {
      attempts.push(`${candidate}: ${error && error.message}`);
    }
  }
  return json({ ok: false, error: "probe_send_failed", to, stamp, attempts }, 502);
}
__name(handleProbe, "handleProbe");
var TRACK_KEY = "outreach:track";
var DRAFTS_KEY = "outreach:drafts";
var COUNT_CAP = 999;
var PIXEL_GIF = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0)
);
async function draftIdForTrack(env, trackId) {
  const kv = env && env.OUTREACH_KV;
  if (!kv || !trackId) return null;
  const raw = await kv.get(TRACK_KEY);
  if (!raw) return null;
  try {
    const idx = JSON.parse(raw);
    const hit = idx && idx[trackId];
    return hit && hit.draftId || null;
  } catch {
    return null;
  }
}
__name(draftIdForTrack, "draftIdForTrack");
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
    ua: String(meta && meta.ua || "").slice(0, 200),
    country: meta && meta.country || null
  };
  const eng = { ...prev, trackId: prev.trackId || null };
  if (kind === "click") {
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
__name(recordHit, "recordHit");
function hitMeta(request) {
  return {
    ua: request.headers.get("user-agent") || "",
    country: request.cf && request.cf.country || null
  };
}
__name(hitMeta, "hitMeta");
async function handleTrack(request, env, url) {
  const clickMatch = url.pathname.match(/^\/r\/([A-Za-z0-9_-]{8,64})$/);
  const openMatch = url.pathname.match(/^\/o\/([A-Za-z0-9_-]{8,64})\.gif$/);
  const meta = hitMeta(request);
  if (clickMatch) {
    const draftId = await draftIdForTrack(env, clickMatch[1]);
    if (draftId) {
      try {
        await recordHit(env, draftId, "click", meta);
      } catch {
      }
    }
    return new Response(null, {
      status: 302,
      headers: { Location: "https://maylendy.com/", "Cache-Control": "no-store" }
    });
  }
  if (openMatch) {
    const draftId = await draftIdForTrack(env, openMatch[1]);
    if (draftId) {
      try {
        await recordHit(env, draftId, "open", meta);
      } catch {
      }
    }
    return new Response(PIXEL_GIF, {
      headers: {
        "Content-Type": "image/gif",
        // 必须 no-store：被缓存住就再也记不到第二次打开了
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache"
      }
    });
  }
  return null;
}
__name(handleTrack, "handleTrack");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/r/") || url.pathname.startsWith("/o/")) {
      const tracked = await handleTrack(request, env, url);
      if (tracked) return tracked;
    }
    if ((request.method === "GET" || request.method === "HEAD") && !url.pathname.startsWith("/api/")) {
      const canonicalUrl = new URL(url);
      if (WEBSITE_HOSTS.has(url.hostname)) {
        canonicalUrl.protocol = "https:";
        canonicalUrl.hostname = SITE_HOSTNAME;
        canonicalUrl.port = "";
      }
      if (/^\/index(?:\.html)?\/?$/.test(url.pathname)) {
        canonicalUrl.pathname = "/";
      } else if (/^\/oem-tooling(?:\.html)?\/?$/.test(url.pathname)) {
        canonicalUrl.pathname = "/quality-delivery";
      } else {
        const page = url.pathname.match(/^\/(about-us|factory-tour|products|quality-delivery|contact|qa|analytics)(?:\.html)?\/?$/);
        if (page) canonicalUrl.pathname = "/" + page[1];
      }
      if (canonicalUrl.href !== url.href) {
        return new Response(null, {
          status: 301,
          headers: { Location: canonicalUrl.href, "Cache-Control": "public, max-age=3600" }
        });
      }
    }
    if (url.pathname === "/api/quote") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
      return handleQuote(request, env);
    }
    if (url.pathname === "/api/visit") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
      return handleVisit(request, env);
    }
    if (url.pathname === "/api/analytics") {
      if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
      return handleAnalytics(request, env, url);
    }
    if (url.pathname === "/api/probe") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      return handleProbe(request, env);
    }
    if (url.pathname === "/api/health") {
      let trackKv = { bound: false };
      if (env.OUTREACH_KV) {
        trackKv.bound = true;
        try {
          const raw = await env.OUTREACH_KV.get("outreach:drafts");
          const list = raw ? JSON.parse(raw) : [];
          const idx = JSON.parse(await env.OUTREACH_KV.get("outreach:track") || "{}");
          trackKv.draftsVisible = Array.isArray(list) ? list.length : 0;
          trackKv.tokensBound = Object.keys(idx || {}).length;
          trackKv.draftsWithTrackId = (Array.isArray(list) ? list : []).filter((d) => d && d.trackId).length;
        } catch (e) {
          trackKv.error = String(e && e.message || e);
        }
      }
      return json({
        ok: true,
        channel: configuredChannel(env),
        channels: availableChannels(env),
        to: env.QUOTE_TO || "nichole@laotes.com",
        from: env.QUOTE_FROM || "website@laotes.com",
        probeConfigured: Boolean(env.PROBE_TOKEN && env.PROBE_TO),
        probeTo: env.PROBE_TO || null,
        trackKv
      });
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
