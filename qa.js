document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("#menu-toggle");
  const navigation = document.querySelector("#main-nav");
  const header = document.querySelector("#site-header");
  const refreshIcons = () => window.lucide?.createIcons();
  const setMenu = (open) => {
    navigation?.classList.toggle("is-open", open);
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.setAttribute("title", open ? "Close menu" : "Open menu");
    toggle.innerHTML = open ? '<i data-lucide="x" aria-hidden="true"></i>' : '<i data-lucide="menu" aria-hidden="true"></i>';
    refreshIcons();
  };
  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (toggle?.getAttribute("aria-expanded") === "true" && !event.composedPath().includes(header)) setMenu(false);
  });
  const desktop = window.matchMedia("(min-width: 861px)");
  desktop.addEventListener("change", () => { if (desktop.matches) setMenu(false); });
  refreshIcons();
});
