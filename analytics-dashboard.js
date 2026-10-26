(function () {
  "use strict";

  const qs = (selector) => document.querySelector(selector);
  const state = { token: "", report: null };
  const tokenStorageKey = "laotesi_analytics_token";

  function refreshIcons() {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function number(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  }

  function dateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function setAccessMessage(message, tone) {
    const node = qs("#access-message");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.tone = tone || "";
  }

  function showAccess() {
    qs("#access-panel").hidden = false;
    qs("#analytics-dashboard").hidden = true;
    qs("#connection-state").innerHTML = '<i data-lucide="shield-check" aria-hidden="true"></i> Private report';
    refreshIcons();
  }

  function showDashboard() {
    qs("#access-panel").hidden = true;
    qs("#analytics-dashboard").hidden = false;
    qs("#connection-state").innerHTML = '<i data-lucide="activity" aria-hidden="true"></i> Report connected';
    refreshIcons();
  }

  function aggregateRank(daily, key, limit) {
    const counts = new Map();
    for (const day of daily || []) {
      for (const item of day[key] || []) counts.set(item.value, (counts.get(item.value) || 0) + Number(item.count || 0));
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([value, count]) => ({ value, count }));
  }

  function renderRankList(selector, items, emptyText) {
    const node = qs(selector);
    if (!node) return;
    if (!items.length) {
      node.innerHTML = '<div class="empty-state">' + escapeHtml(emptyText || "No activity in this window.") + "</div>";
      return;
    }
    const max = Math.max(...items.map((item) => item.count), 1);
    node.innerHTML = items.map((item) => '<div class="rank-item"><span class="rank-name" title="' + escapeHtml(item.value) + '">' + escapeHtml(item.value) + '</span><strong class="rank-count">' + number(item.count) + '</strong><span class="rank-track"><span style="width:' + Math.max(4, (item.count / max) * 100) + '%"></span></span></div>').join("");
  }

  function renderChart(daily) {
    const node = qs("#daily-chart");
    if (!node) return;
    if (!daily?.length) {
      node.innerHTML = '<div class="empty-state">No activity has been recorded yet.</div>';
      return;
    }
    const ordered = [...daily].reverse();
    node.style.gridTemplateColumns = "repeat(" + Math.max(1, ordered.length) + ", minmax(12px, 1fr))";
    const max = Math.max(...ordered.flatMap((day) => [day.pageViews || 0, day.uniqueVisitors || 0]), 1);
    node.innerHTML = ordered.map((day) => {
      const label = String(day.day || "").slice(5);
      const views = Number(day.pageViews || 0);
      const visitors = Number(day.uniqueVisitors || 0);
      return '<div class="chart-day" title="' + escapeHtml(day.day) + ': ' + number(views) + ' page views, ' + number(visitors) + ' visitors"><div class="chart-bars"><span class="chart-bar chart-bar--views" style="height:' + Math.max(2, (views / max) * 100) + '%"></span><span class="chart-bar chart-bar--visitors" style="height:' + Math.max(2, (visitors / max) * 100) + '%"></span></div><span class="chart-label">' + escapeHtml(label) + '</span></div>';
    }).join("");
  }

  function renderVisitors(visitors) {
    const body = qs("#visitor-table");
    if (!body) return;
    if (!visitors?.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty-state">No anonymous sessions have been recorded yet.</td></tr>';
      return;
    }
    body.innerHTML = visitors.slice(0, 40).map((visitor) => '<tr><td><strong class="visitor-id">' + escapeHtml(visitor.id) + '</strong><br><span class="visitor-detail">' + number(visitor.events) + ' events</span></td><td>' + escapeHtml(dateTime(visitor.lastSeen)) + '</td><td>' + escapeHtml(visitor.device || "-") + (visitor.country ? ' / ' + escapeHtml(visitor.country) : '') + '</td><td>' + escapeHtml(visitor.source || "Direct") + '</td><td>' + escapeHtml((visitor.pages || []).join(" · ") || "-") + '</td><td>' + escapeHtml((visitor.products || []).join(" · ") || "-") + '</td></tr>').join("");
  }

  function renderReport(report) {
    state.report = report;
    const daily = report.daily || [];
    const pageViews = daily.reduce((sum, day) => sum + Number(day.pageViews || 0), 0);
    const productViews = daily.reduce((sum, day) => sum + Number(day.productViews || 0), 0);
    const topPages = aggregateRank(daily, "topPages", 10);
    const topProducts = aggregateRank(daily, "topProducts", 10);
    const topSources = aggregateRank(daily, "sources", 8);
    const topCountries = aggregateRank(daily, "countries", 8);
    qs("#metric-page-views").textContent = number(pageViews);
    qs("#metric-visitors").textContent = number((report.visitors || []).length);
    qs("#metric-product-views").textContent = number(productViews);
    qs("#metric-top-page").textContent = topPages[0]?.value || "-";
    qs("#metric-top-page-count").textContent = topPages[0] ? number(topPages[0].count) + " views" : "No data yet";
    qs("#report-window").textContent = number(report.days) + " DAY" + (Number(report.days) === 1 ? "" : "S");
    qs("#report-updated").textContent = "Updated " + dateTime(report.generatedAt);
    renderChart(daily);
    renderRankList("#top-pages", topPages, "No page activity yet.");
    renderRankList("#top-products", topProducts, "No product details opened yet.");
    renderRankList("#top-sources", topSources, "No source data yet.");
    renderRankList("#top-countries", topCountries, "No country data yet.");
    renderVisitors(report.visitors || []);
  }

  async function loadReport() {
    if (!state.token) return;
    const refresh = qs("#refresh-report");
    if (refresh) refresh.disabled = true;
    setAccessMessage("", "");
    const days = qs("#days-select").value;
    try {
      const response = await fetch("/api/analytics?days=" + encodeURIComponent(days), { cache: "no-store", headers: { Accept: "application/json", Authorization: "Bearer " + state.token } });
      const raw = await response.text();
      let payload = null;
      try { payload = raw ? JSON.parse(raw) : null; } catch { payload = null; }
      if (!response.ok || !payload?.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem(tokenStorageKey);
          state.token = "";
          showAccess();
          setAccessMessage("That report token was not accepted.", "error");
        } else if (payload?.error === "analytics_admin_not_configured") {
          showAccess();
          setAccessMessage("The Worker has not been configured with ANALYTICS_ADMIN_TOKEN yet.", "error");
        } else {
          const detail = payload?.error || payload?.message || (response.status ? "HTTP " + response.status : "empty response");
          setAccessMessage("Report request failed: " + detail + ".", "error");
        }
        return;
      }
      renderReport(payload);
      showDashboard();
    } catch (error) {
      setAccessMessage("Could not reach the analytics endpoint: " + (error?.message || "network error") + ".", "error");
    } finally {
      if (refresh) refresh.disabled = false;
    }
  }

  function init() {
    refreshIcons();
    qs("#analytics-auth-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = qs("#analytics-token");
      state.token = input.value.trim();
      if (!state.token) return;
      sessionStorage.setItem(tokenStorageKey, state.token);
      loadReport();
    });
    qs("#days-select")?.addEventListener("change", loadReport);
    qs("#refresh-report")?.addEventListener("click", loadReport);
    qs("#logout-report")?.addEventListener("click", () => {
      sessionStorage.removeItem(tokenStorageKey);
      state.token = "";
      qs("#analytics-token").value = "";
      setAccessMessage("", "");
      showAccess();
    });
    state.token = sessionStorage.getItem(tokenStorageKey) || "";
    if (state.token) loadReport();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
