// MahallaUsta — mobil landing logikasi (mobile.html)
// Pastki navigatsiya, AI panel va modal bilan bog'lanish.

(function () {
  "use strict";

  const bar = document.getElementById("m-bottom");
  if (!bar) return;

  const panel = document.getElementById("ai-panel");
  const launcher = document.getElementById("ai-launcher");
  const modal = document.getElementById("modal");
  const aiButton = document.getElementById("m-bottom-ai");
  const headerNav = document.getElementById("nav");
  const hamburger = document.getElementById("hamburger");

  const links = Array.from(bar.querySelectorAll("a[data-m-bottom]"));
  const servicesSection = document.getElementById("services");

  /* ---------- Faol bo'lim ---------- */
  function setActive(key) {
    links.forEach((link) => {
      const active = link.dataset.mBottom === key;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  let ticking = false;

  function updateActive() {
    ticking = false;
    const threshold = 96;

    if (servicesSection && window.scrollY + threshold >= servicesSection.offsetTop) {
      setActive("services");
    } else {
      setActive("top");
    }
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    },
    { passive: true }
  );

  window.addEventListener("resize", updateActive);
  updateActive();

  /* ---------- Header menyusini yopish ---------- */
  function closeHeaderMenu() {
    if (!headerNav || !hamburger) return;
    headerNav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      setActive(link.dataset.mBottom);
      closeHeaderMenu();
    });
  });

  /* ---------- AI panel ---------- */
  if (aiButton) {
    aiButton.addEventListener("click", () => {
      if (!panel) return;
      closeHeaderMenu();

      if (panel.hidden) {
        if (launcher) launcher.click();
      } else {
        const closeButton = document.getElementById("ai-close");
        if (closeButton) closeButton.click();
      }
    });
  }

  /* ---------- Overlay ochilganda pastki panelni yashirish ---------- */
  let hidden = false;

  function sync() {
    const shouldHide =
      Boolean(panel && !panel.hidden) || Boolean(modal && !modal.hidden);

    if (shouldHide === hidden) return;
    hidden = shouldHide;

    bar.classList.toggle("is-hidden", shouldHide);

    // Tab/fokus tartibidan chiqarish
    if ("inert" in bar) bar.inert = shouldHide;
  }

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(sync);
    if (panel) observer.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    if (modal) observer.observe(modal, { attributes: true, attributeFilter: ["hidden"] });
  }

  sync();
})();
