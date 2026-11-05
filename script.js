// MahallaUsta — landing page interactions

(function () {
  "use strict";

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("nav");

  function closeNav() {
    nav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", t("aria.menuOpen"));
  }

  hamburger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", t(isOpen ? "aria.menuClose" : "aria.menuOpen"));
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Animated counters ---------- */
  function formatNumber(n) {
    if (window.MuI18n) return window.MuI18n.formatNumber(n);
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function animateCounter(el) {
    const target = Number(el.dataset.count || 0);
    const duration = 1500;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = formatNumber(Number(el.dataset.count || 0))));
  }

  document.addEventListener("mu:langchange", () => {
    counters.forEach((el) => (el.textContent = formatNumber(Number(el.dataset.count || 0))));
    renderPrices();
  });

  /* ---------- Toast ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  /* ---------- Billing period + plan prices ---------- */
  const billingButtons = Array.from(document.querySelectorAll(".bt"));
  const priceNodes = Array.from(document.querySelectorAll("[data-monthly]"));
  let currentBilling = "monthly";

  function renderPrices() {
    priceNodes.forEach((node) => {
      node.textContent = formatNumber(Number(node.dataset[currentBilling]));
    });
  }

  billingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentBilling = btn.dataset.billing;
      billingButtons.forEach((other) => {
        const active = other === btn;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      renderPrices();
    });
  });

  renderPrices();

  /* ---------- Modal ---------- */
  const modal = document.getElementById("modal");
  const modalFormView = document.getElementById("modal-form-view");
  const modalSuccessView = document.getElementById("modal-success-view");
  const modalTitle = document.getElementById("modal-title");
  const modalSub = document.querySelector("#modal-form-view .modal-sub");
  const requestForm = document.getElementById("request-form");
  const serviceSelect = document.getElementById("client-service");
  const districtInput = document.getElementById("client-district");
  const phoneInput = document.getElementById("client-phone");
  const serviceRow = serviceSelect.closest(".form-row");

  let lastFocused = null;
  let activeMaster = "";
  let activePlan = "";
  let activeKind = "request";

  function refreshModalCopy() {
    if (activeKind === "subscription") {
      const planName = t(`plan.${activePlan}.name`);
      const amountNode = document.querySelector(`[data-plan-id="${activePlan}"] .amount`);
      const price = formatNumber(Number(amountNode?.dataset[currentBilling] ?? 0));
      modalTitle.textContent = t("modal.planTitle", { plan: planName });
      modalSub.textContent = t("modal.planSub", { plan: planName, price });
      return;
    }

    if (activeKind === "master") {
      modalTitle.textContent = t("modal.masterTitle");
      modalSub.textContent = t("modal.masterSub");
      return;
    }

    modalTitle.textContent = t("modal.callTitle");
    modalSub.textContent = activeMaster
      ? t("modal.withMaster", { name: activeMaster })
      : t("modal.callSub");
  }

  function setFormMode({ preset, master, district, plan }) {
    requestForm.reset();
    modalFormView.hidden = false;
    modalSuccessView.hidden = true;

    activeMaster = master || "";
    activePlan = plan || "";
    activeKind = plan ? "subscription" : preset === "usta" ? "master" : "request";

    const subscribing = activeKind === "subscription";
    serviceRow.hidden = subscribing;
    serviceSelect.required = !subscribing;

    refreshModalCopy();

    if (preset && preset !== "usta") {
      const option = Array.from(serviceSelect.options).find((o) => o.value === preset);
      if (option) serviceSelect.value = preset;
    }

    if (district) districtInput.value = district;
  }

  function openModal(trigger) {
    lastFocused = document.activeElement;
    const { preset, master, plan } = trigger.dataset;
    const district = document.getElementById("quick-district").value.trim();

    setFormMode({ preset, master, plan, district: preset || plan ? "" : district });

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    const firstField = modalFormView.hidden ? null : document.getElementById("client-name");
    requestAnimationFrame(() => firstField && firstField.focus());
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(btn);
      closeNav();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  document.addEventListener("mu:langchange", refreshModalCopy);

  /* ---------- Phone mask ---------- */
  function formatPhone(raw) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("998")) digits = digits.slice(3);
    digits = digits.slice(0, 9);

    let out = "+998";
    if (digits.length) out += " " + digits.slice(0, 2);
    if (digits.length > 2) out += " " + digits.slice(2, 5);
    if (digits.length > 5) out += " " + digits.slice(5, 7);
    if (digits.length > 7) out += " " + digits.slice(7, 9);
    return out;
  }

  phoneInput.addEventListener("focus", () => {
    if (!phoneInput.value.trim()) phoneInput.value = "+998 ";
  });

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
  });

  phoneInput.addEventListener("blur", () => {
    if (phoneInput.value.replace(/\D/g, "") === "998") phoneInput.value = "";
  });

  /* ---------- Request form ---------- */
  const submitBtn = requestForm.querySelector('button[type="submit"]');

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    if (phoneDigits.length !== 12) {
      showToast(t("toast.phone"));
      phoneInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("common.sending");

    let delivered = false;

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: activeKind,
          name: document.getElementById("client-name").value,
          phone: phoneInput.value,
          service: serviceSelect.value,
          district: districtInput.value,
          master: activeMaster,
          plan: activePlan,
          billing: currentBilling,
        }),
      });

      delivered = response.ok || response.status === 404;
    } catch (error) {
      /* server yo'q — demo rejimda so'rov muvaffaqiyatli hisoblanadi */
      delivered = true;
    }

    try {
      if (!delivered) {
        showToast(t("toast.failed"));
        return;
      }

      modalFormView.hidden = true;
      modalSuccessView.hidden = false;
      modalSuccessView.querySelector(".btn").focus();
      requestForm.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t("modal.submit");
    }
  });

  /* ---------- Quick request bar ---------- */
  const quickForm = document.getElementById("quick-form");

  quickForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const service = document.getElementById("quick-service").value;
    const district = document.getElementById("quick-district").value.trim();

    setFormMode({ preset: service, district });
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => document.getElementById("client-name").focus());
  });
})();
