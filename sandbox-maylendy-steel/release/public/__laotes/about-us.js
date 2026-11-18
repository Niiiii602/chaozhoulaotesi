document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("#menu-toggle");
  const navigation = document.querySelector("#main-nav");
  const setMenu = (open) => {
    navigation?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle?.querySelector("path")?.setAttribute("d", open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16");
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
    if (toggle?.getAttribute("aria-expanded") === "true" && !event.target.closest("#site-header")) setMenu(false);
  });
  const desktop = window.matchMedia("(min-width: 861px)");
  desktop.addEventListener("change", () => { if (desktop.matches) setMenu(false); });
  const sections = Array.from(document.querySelectorAll("[data-about-section]"));
  const links = Array.from(document.querySelectorAll(".about-section-nav a"));
  const header = document.querySelector("#site-header");
  const sectionNav = document.querySelector(".about-section-nav");
  let scheduled = false;
  const updateSection = () => {
    scheduled = false;
    let active = sections[0]?.id;
    const threshold = (header?.offsetHeight || 86) + (sectionNav?.offsetHeight || 58) + 32;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= threshold) active = section.id;
    });
    links.forEach((link) => {
      if (link.hash === "#" + active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  window.addEventListener("scroll", () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateSection); }
  }, { passive: true });
  window.addEventListener("resize", updateSection, { passive: true });
  window.addEventListener("pageshow", updateSection);
  updateSection();
});
