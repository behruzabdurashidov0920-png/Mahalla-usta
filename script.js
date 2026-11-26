// MahallaUsta — landing page interactions

(function () {
  "use strict";

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);

  /* ---------- Light / dark theme ---------- */
  const THEME_KEY = "mu_theme";

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function syncThemeButtons() {
    const theme = currentTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute("aria-label", t(theme === "dark" ? "aria.themeLight" : "aria.themeDark"));
    });
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        /* storage mavjud emas */
      }
      syncThemeButtons();
    });
  });

  syncThemeButtons();
  document.addEventListener("mu:langchange", syncThemeButtons);

  /* Foydalanuvchi tanlov qilmagan bo'lsa, tizim sozlamasiga ergashamiz */
  if (window.matchMedia) {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event) => {
      let saved = null;
      try {
        saved = window.localStorage.getItem(THEME_KEY);
      } catch (error) {
        /* storage mavjud emas */
      }
      if (saved) return;
      document.documentElement.dataset.theme = event.matches ? "dark" : "light";
      syncThemeButtons();
    };
    if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  /* ---------- Opt-in master location map ---------- */
  const mapElement = document.getElementById("masters-map");
  if (mapElement) {
    const mapStatus = document.getElementById("masters-map-status");

    if (!window.L) {
      mapStatus.textContent = t("map.error");
      document.addEventListener("mu:langchange", () => {
        mapStatus.textContent = t("map.error");
      });
    } else {
      const locationMap = window.L.map(mapElement).setView([41.2995, 69.2401], 11);
      /* OSM plitalari Toshkent bo'ylab barcha zoomlarda mavjud.
         Esri World_Street_Map yuqori zoomda "Map data not yet available" qaytarardi. */
      const baseTiles = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 3,
        maxZoom: 19,
        maxNativeZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      }).addTo(locationMap);

      /* Plitka yuklanmasa, foydalanuvchiga jim qolmasdan xabar beramiz. */
      let tileErrors = 0;
      baseTiles.on("tileerror", () => {
        tileErrors += 1;
        if (tileErrors === 1) console.warn("Map tiles could not be loaded from OpenStreetMap.");
      });
      baseTiles.on("tileload", () => {
        tileErrors = 0;
      });

      const markers = window.L.layerGroup().addTo(locationMap);
      const markerIndex = new Map();
      let hasZoomedToMasters = false;

      function buildPopup(item) {
        const popup = document.createElement("div");
        popup.className = "map-popup";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const meta = document.createElement("span");
        meta.className = "map-popup-meta";
        meta.textContent = [item.spec, item.district].filter(Boolean).join(" · ");

        const updated = document.createElement("span");
        const date = new Date(item.updatedAt);
        const locale = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" }[
          window.MuI18n ? window.MuI18n.getLang() : "uz"
        ] || "uz-UZ";
        updated.textContent = t("map.updated", {
          time: Number.isNaN(date.getTime())
            ? "—"
            : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date),
        });

        const badge = document.createElement("em");
        badge.className = `map-popup-badge ${item.demo ? "map-popup-badge--demo" : "map-popup-badge--live"}`;
        badge.textContent = t(item.demo ? "map.demo" : "map.live");

        popup.append(name, meta, updated, badge);
        return popup;
      }

      async function refreshMasterLocations() {
        try {
          const response = await fetch("/api/masters/locations", { cache: "no-store" });
          if (!response.ok) throw new Error(`location_api_${response.status}`);
          const data = await response.json();
          const locations = Array.isArray(data.locations) ? data.locations : [];

          const validLocations = locations.filter((item) =>
            item &&
            typeof item.name === "string" &&
            typeof item.district === "string" &&
            Number.isFinite(item.latitude) &&
            Number.isFinite(item.longitude)
          );
          const markerPoints = [];
          const seen = new Set();

          validLocations.forEach((item) => {
            const key = item.id || `${item.name}|${item.district}`;
            if (seen.has(key)) return;
            seen.add(key);

            const point = [item.latitude, item.longitude];
            markerPoints.push(point);

            const popup = buildPopup(item);
            const existing = markerIndex.get(key);

            if (existing) {
              existing.marker.setLatLng(point);
              existing.marker.setPopupContent(popup);
            } else {
              const icon = window.L.divIcon({
                className: `map-pin-icon${item.demo ? " map-pin-icon--demo" : ""}`,
                html: "<span></span>",
                iconSize: [18, 18],
                iconAnchor: [9, 9],
              });
              const marker = window.L.marker(point, { icon }).bindPopup(popup).addTo(markers);
              markerIndex.set(key, { marker });
            }
          });

          markerIndex.forEach((entry, key) => {
            if (!seen.has(key)) {
              markers.removeLayer(entry.marker);
              markerIndex.delete(key);
            }
          });

          if (validLocations.length === 0) {
            mapStatus.textContent = t("map.empty");
          } else {
            mapStatus.textContent = t("map.online", { n: validLocations.length });
            if (!hasZoomedToMasters) {
              locationMap.fitBounds(markerPoints, { padding: [32, 32], maxZoom: 14 });
              hasZoomedToMasters = true;
            }
          }
        } catch (error) {
          if (window.location.protocol === "file:") {
            mapStatus.textContent = t("map.serverRequired");
          } else {
            console.error("Master locations could not be loaded:", error);
            mapStatus.textContent = t("map.error");
          }
        }
      }

      refreshMasterLocations();
      window.setInterval(refreshMasterLocations, 20000);
      document.addEventListener("mu:langchange", refreshMasterLocations);
    }
  }

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

  function afterModalOpen() {
    initRequestMap();
    if (requestMap) {
      setTimeout(() => requestMap.invalidateSize(), 60);
      setTimeout(() => requestMap.invalidateSize(), 250);
    }
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
    afterModalOpen();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  /* AI agent kabi tashqi komponentlar uchun so'rov formasini ochish nuqtasi */
  window.MuModal = {
    open(options) {
      lastFocused = document.activeElement;
      setFormMode(options || {});
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      const firstField = modalFormView.hidden ? null : document.getElementById("client-name");
      requestAnimationFrame(() => firstField && firstField.focus());
      afterModalOpen();
    },
  };

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
  const addressInput = document.getElementById("client-address");
  const latInput = document.getElementById("client-lat");
  const lngInput = document.getElementById("client-lng");
  const noteInput = document.getElementById("client-note");
  const coordStatus = document.getElementById("client-coord-status");

  function setCoordStatus(text, isError) {
    if (!coordStatus) return;
    coordStatus.textContent = text || "";
    coordStatus.classList.toggle("is-error", Boolean(isError));
  }

  function clearCoords() {
    if (latInput) latInput.value = "";
    if (lngInput) lngInput.value = "";
  }

  /* ---------- Request map (hybrid: pin + qo'lda manzil) ---------- */
  let requestMap = null;
  let requestMapMarker = null;
  let requestMapInited = false;

  function setRequestPin(lat, lng, options = {}) {
    if (!requestMap || !window.L) return;
    const ll = [Number(lat), Number(lng)];
    if (!Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) return;
    if (latInput) latInput.value = String(ll[0]);
    if (lngInput) lngInput.value = String(ll[1]);

    if (requestMapMarker) {
      requestMapMarker.setLatLng(ll);
    } else {
      requestMapMarker = window.L.marker(ll, { draggable: true }).addTo(requestMap);
      requestMapMarker.on("dragend", () => {
        const p = requestMapMarker.getLatLng();
        if (latInput) latInput.value = String(p.lat);
        if (lngInput) lngInput.value = String(p.lng);
        reverseGeocode(p.lat, p.lng);
      });
    }

    if (options.pan) requestMap.setView(ll, options.zoom || Math.max(requestMap.getZoom(), 15));
    if (options.label) setCoordStatus(options.label, false);
    else setCoordStatus(t("map.pinSet", { lat: ll[0].toFixed(5), lng: ll[1].toFixed(5) }), false);
  }

  async function reverseGeocode(lat, lng) {
    if (!addressInput) return;
    setCoordStatus(t("map.geocoding"), false);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=${encodeURIComponent(window.MuI18n ? window.MuI18n.getLang() : "uz")}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("geocode_failed");
      const data = await res.json();
      const label = data && data.display_name ? String(data.display_name).slice(0, 180) : "";
      if (label) {
        addressInput.value = label;
        // tumanni ham taxminiy to'ldirishga harakat qilamiz
        const addr = data.address || {};
        const districtGuess = addr.city_district || addr.district || addr.suburb || addr.neighbourhood || "";
        if (districtGuess && districtInput && !districtInput.value.trim()) {
          districtInput.value = districtGuess;
        }
      }
      setCoordStatus(t("map.pinSet", { lat: Number(lat).toFixed(5), lng: Number(lng).toFixed(5) }), false);
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
      setCoordStatus(t("map.pinSetManual", { lat: Number(lat).toFixed(5), lng: Number(lng).toFixed(5) }), false);
    }
  }

  function initRequestMap() {
    const mapEl = document.getElementById("request-map");
    if (requestMapInited || !mapEl) return;
    if (!window.L) {
      setCoordStatus(t("map.loadFailed"), true);
      return;
    }
    requestMapInited = true;

    requestMap = window.L.map(mapEl, { zoomControl: true }).setView([41.2995, 69.2401], 12);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(requestMap);

    requestMap.on("click", (e) => {
      setRequestPin(e.latlng.lat, e.latlng.lng, { pan: false });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    const clearBtn = document.getElementById("request-map-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        clearCoords();
        if (requestMapMarker) {
          requestMapMarker.remove();
          requestMapMarker = null;
        }
        setCoordStatus(t("map.pinCleared"), false);
      });
    }

    const locateBtn = document.getElementById("request-map-locate");
    if (locateBtn) {
      locateBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          showToast(t("toast.geoUnsupported"));
          return;
        }
        setCoordStatus(t("map.locating"), false);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setRequestPin(pos.coords.latitude, pos.coords.longitude, { pan: true, zoom: 16 });
            reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            setCoordStatus(t("map.locateFailed"), true);
            showToast(t("toast.geoFailed"));
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }
  }

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    if (phoneDigits.length !== 12) {
      showToast(t("toast.phone"));
      phoneInput.focus();
      return;
    }

    const addressValue = addressInput ? addressInput.value.trim() : "";
    const districtValue = districtInput.value.trim();
    if (districtValue.length < 2 && addressValue.length < 5) {
      showToast(t("toast.address"));
      (addressInput || districtInput).focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("common.sending");

    try {
      const payload = {
        kind: activeKind,
        name: document.getElementById("client-name").value.trim(),
        phone: phoneInput.value,
        service: serviceSelect.value,
        district: districtValue,
        address: addressValue,
        latitude: latInput && latInput.value ? Number(latInput.value) : null,
        longitude: lngInput && lngInput.value ? Number(lngInput.value) : null,
        note: noteInput ? noteInput.value.trim() : "",
        master: activeMaster,
        plan: activePlan,
        billing: currentBilling,
      };

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await response.json(); } catch (_) { /* ignore */ }

      if (!response.ok) {
        if (data.error === "invalid_location") {
          showToast(t("toast.location"));
        } else if (data.error === "invalid_input") {
          showToast(t("toast.invalid"));
        } else {
          showToast(t("toast.failed"));
        }
        return;
      }

      modalFormView.hidden = true;
      modalSuccessView.hidden = false;
      const okBtn = modalSuccessView.querySelector(".btn");
      if (okBtn) okBtn.focus();
      requestForm.reset();
      clearCoords();
      setCoordStatus("");
      if (requestMapMarker) {
        requestMapMarker.remove();
        requestMapMarker = null;
      }
    } catch (error) {
      console.error("Request submit failed:", error);
      showToast(t("toast.network"));
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
    afterModalOpen();
  });

  /* ---------- Public stats (real DB-backed) ---------- */
  async function loadPublicStats() {
    const nodes = document.querySelectorAll("[data-stat]");
    if (!nodes.length) return;
    try {
      const res = await fetch("/api/public/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("stats_" + res.status);
      const stats = await res.json();
      nodes.forEach((node) => {
        const key = node.getAttribute("data-stat");
        const val = stats[key];
        node.textContent = typeof val === "number" ? String(val) : "—";
      });
    } catch (e) {
      console.warn("Public stats could not be loaded:", e);
      nodes.forEach((node) => { if (node.textContent.trim() === "—") node.textContent = "0"; });
    }
  }

  loadPublicStats();
})();
