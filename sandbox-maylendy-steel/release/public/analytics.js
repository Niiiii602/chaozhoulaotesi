(function () {
  "use strict";

  if (!/^https?:$/.test(window.location?.protocol || "")) return;

  let visitorId = "";
  try {
      visitorId = window.sessionStorage.getItem("laotesi_session_id") || "";
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(visitorId)) {
      visitorId = (window.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2))
        .replace(/[^A-Za-z0-9_-]/g, "")
        .slice(0, 64);
      window.sessionStorage.setItem("laotesi_session_id", visitorId);
    }
  } catch {
    visitorId = (String(Date.now()) + "-" + Math.random().toString(36).slice(2))
      .replace(/[^A-Za-z0-9_-]/g, "")
      .slice(0, 64);
  }
  if (!visitorId) return;
  window.LAOTESI_VISITOR_ID = visitorId;
  document.querySelectorAll('input[name="_visitor"]').forEach((input) => { input.value = visitorId; });

  const query = new URLSearchParams(window.location.search || "");
  const base = {
    visitorId,
    path: window.location.pathname || "/",
    title: document.title || "",
    referrer: document.referrer || "",
    source: query.get("utm_source") || "",
    campaign: query.get("utm_campaign") || "",
  };

  const send = (event, extra = {}) => {
    const body = JSON.stringify({ ...base, event, ...extra });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/visit", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Analytics must never affect the visitor's page experience.
    }
  };

  window.LAOTESI_TRACK = send;
  send("page_view");
})();
