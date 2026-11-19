// MahallaUsta — Usta Xaritasi (map.html)

(function () {
  "use strict";

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);
  const lang = () => (window.MuI18n ? window.MuI18n.getLang() : "uz");
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const els = {
    panel: $("map-panel"),
    panelToggle: $("panel-toggle"),
    nav: $("nav"),
    hamburger: $("hamburger"),
    form: $("search-form"),
    query: $("map-query"),
    spinner: $("search-spinner"),
    results: $("search-results"),
    note: $("search-note"),
    chips: $("region-chips"),
    dest: $("dest-card"),
    destAddress: $("dest-address"),
    destClear: $("dest-clear"),
    destRequest: $("dest-request"),
    status: $("status-line"),
    locate: $("locate-btn"),
    pick: $("pick-btn"),
    reset: $("reset-btn"),
    fabs: $("map-fabs"),
    demo: $("demo-chip"),
    state: $("map-state"),
    stateTitle: $("state-title"),
    stateText: $("state-text"),
    stateRetry: $("state-retry"),
    toast: $("toast"),
    modal: $("modal"),
    modalFormView: $("modal-form-view"),
    modalSuccessView: $("modal-success-view"),
    form2: $("request-form"),
    name: $("client-name"),
    phone: $("client-phone"),
    service: $("client-service"),
    district: $("client-district"),
  };

  /* ---------- Small helpers ---------- */
  let toastTimer;

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3200);
  }

  function formatNumber(value) {
    if (window.MuI18n) return window.MuI18n.formatNumber(value);
    return String(Math.round(value || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  // Matnlar DOM orqali joylanadi (server ma'lumoti HTML sifatida ichkariga kirmaydi)
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function localizedName(names) {
    if (!names) return "";
    return names[lang()] || names.uz || names.en || "";
  }

  function moveBounds(view, animate) {
    if (reduceMotion || animate === false) {
      if (view.bounds) map.fitBounds(view.bounds, { animate: false });
      else map.setView(view.center, view.zoom, { animate: false });
      return;
    }
    if (view.bounds) map.flyToBounds(view.bounds, { duration: 0.8 });
    else map.flyTo(view.center, view.zoom, { duration: 0.8 });
  }

  /* ---------- Tashxis: biror narsa bloklansa sababi ko'rinadi ---------- */
  const diagnostics = {
    leaflet: window.L && typeof window.L.map === "function" ? window.L.version : null,
    markerCluster: !!(window.L && typeof window.L.markerClusterGroup === "function"),
    dvh: !!(window.CSS && CSS.supports && CSS.supports("height", "100dvh")),
    secureContext: Boolean(window.isSecureContext),
    geolocation: Boolean(navigator.geolocation),
    tileErrors: 0,
    tilesLoaded: 0,
    tileProvider: null,
    tileHost: null,
    tileKeyInUrl: false,
    mapSize: null,
    failure: null,
  };

  window.__muMapDiagnostics = () => diagnostics;

  if (!window.L || typeof window.L.map !== "function") {
    showBlockingState("library");
    els.stateRetry.addEventListener("click", () => window.location.reload());
    console.error(
      "MahallaUsta: Leaflet ishga tushmadi. assets/vendor/leaflet/leaflet.js yuklanmagan yoki bloklangan — kengaytma/filtr ro'yxatini va brauzer konsolidagi Network xatolarini tekshiring.",
      diagnostics
    );
    return;
  }

  /* ---------- Map ---------- */
  const map = L.map("usta-map", {
    center: [41.2, 64.2],
    zoom: 6,
    minZoom: 5,
    maxZoom: 19,
    zoomControl: false,
    maxBounds: [[34.5, 54.0], [47.5, 75.5]],
    maxBoundsViscosity: 0.7,
    worldCopyJump: false,
    scrollWheelZoom: true,
    zoomAnimation: !reduceMotion,
  });

  /* ---------- Tiles ----------
   * Plita manbasi server'dan keladi (lib/map.js -> tileConfig), shuning uchun
   * qatlam /api/map/data javobidan keyin bir marta ulanadi. Kod ichida kalit
   * yoki mualliflik huquqi matni hardcode qilinmaydi.
   */
  const FALLBACK_TILES = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
  };

  let tilesHealthy = true;
  let tileErrors = 0;
  let tileLayer = null;

  function attachTiles(config) {
    if (tileLayer) return tileLayer;

    const cfg = config && config.url ? config : FALLBACK_TILES;

    tileLayer = L.tileLayer(cfg.url, {
      maxZoom: Number(cfg.maxZoom) || FALLBACK_TILES.maxZoom,
      subdomains: cfg.subdomains || FALLBACK_TILES.subdomains,
      attribution: cfg.attribution || FALLBACK_TILES.attribution,
      // Siyosatga moslash: animatsion zoom orasidagi ortiqcha plita so'rovlari
      // kesiladi — plitalar zoom tugagach yuklanadi.
      updateWhenZooming: false,
      detectRetina: false,
    })
      .on("tileload", () => {
        diagnostics.tilesLoaded += 1;
      })
      .on("tileerror", (event) => {
        tileErrors += 1;
        diagnostics.tileErrors += 1;
        if (tileErrors === 6 && tilesHealthy) {
          tilesHealthy = false;
          diagnostics.failure = "tiles_blocked";
          setNote(t("map.tilesError"), "error");
          console.warn(
            "MahallaUsta: plitalar yuklanmayapti. Provayder: " +
              (cfg.provider || (cfg === FALLBACK_TILES ? "osm-standard" : "custom")) +
              ". OSM siyosati Referer talab qiladi — server.js Referrer-Policy'sini va brauzer kengaymasini tekshiring.",
            event && event.url
          );
        }
      })
      .addTo(map);

    diagnostics.tileProvider = cfg.provider || (cfg === FALLBACK_TILES ? "osm-standard" : "custom");
    // Host foydali, lekin kalit query'da bo'lsa — uni konsolga chiqarmaymiz.
    diagnostics.tileHost = String(cfg.url)
      .replace("{s}", (cfg.subdomains || "abc").charAt(0))
      .replace(/^https?:\/\//, "")
      .split("/")[0];
    diagnostics.tileKeyInUrl = /\?[^\s]*key/i.test(cfg.url);
    return tileLayer;
  }

  const clusters = (
    diagnostics.markerCluster
      ? L.markerClusterGroup({
          maxClusterRadius: 62,
          showCoverageOnHover: false,
          disableClusteringAtZoom: 15,
          spiderfyOnMaxZoom: true,
          iconCreateFunction(cluster) {
            return L.divIcon({
              className: "usta-marker",
              html: '<div class="usta-cluster"><span>' + cluster.getChildCount() + "</span></div>",
              iconSize: L.point(44, 44),
              iconAnchor: L.point(22, 22),
            });
          },
        })
      : L.featureGroup()
  ).addTo(map);

  if (!diagnostics.markerCluster) {
    console.warn("MahallaUsta: markercluster topilmadi — ustalar to'planmasiz ko'rsatiladi.");
  }

  /* Zoom tugmalari — Leaflet'nikini o'rniga, dizayn va breakpointlar nazorat ostida */
  function addZoomButton(direction, labelKey, handler) {
    const button = el("button", "map-fab map-fab--square");
    button.type = "button";
    button.setAttribute("aria-label", t(labelKey));
    button.dataset.i18nAria = labelKey;
    button.innerHTML =
      direction === "in"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>';
    button.addEventListener("click", handler);
    els.fabs.appendChild(button);
  }

  addZoomButton("in", "map.zoomIn", () => map.zoomIn());
  addZoomButton("out", "map.zoomOut", () => map.zoomOut());

  /* ---------- Icons ---------- */
  const TOOL_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4.5 4.5 0 0 0-6.1 5.6L3 17.5V21h3.5l5.6-5.6a4.5 4.5 0 0 0 5.6-6.1l-2.9 2.9-2.8-2.8 2.7-3.1Z"/></svg>';

  function masterIcon(marker) {
    const classes = ["usta-pin"];
    if (marker.status === "busy") classes.push("usta-pin--busy");
    if (marker.demo) classes.push("usta-pin--demo");

    return L.divIcon({
      className: "usta-marker",
      html: '<div class="' + classes.join(" ") + '"><span>' + TOOL_SVG + "</span></div>",
      iconSize: L.point(34, 42),
      iconAnchor: L.point(17, 41),
      popupAnchor: L.point(0, -38),
    });
  }

  const destIcon = L.divIcon({
    className: "dest-marker",
    html: '<div class="dest-pin"></div>',
    iconSize: L.point(30, 30),
    iconAnchor: L.point(15, 15),
    popupAnchor: L.point(0, -16),
  });

  const meIcon = L.divIcon({
    className: "me-marker",
    html: '<div class="me-pin"></div>',
    iconSize: L.point(18, 18),
    iconAnchor: L.point(9, 9),
  });

  /* ---------- Popup content ---------- */
  function masterPopup(marker) {
    const box = el("div", "popup");
    box.appendChild(el("p", "popup-name", marker.name));
    box.appendChild(el("p", "popup-role", marker.spec));

    const meta = el("p", "popup-meta");
    meta.appendChild(el("span", "star", "★"));
    meta.appendChild(el("strong", null, marker.rating ? marker.rating.toFixed(1) : "—"));
    meta.appendChild(el("span", null, "· " + formatNumber(marker.jobs) + " " + t("map.jobs")));
    box.appendChild(meta);

    const tags = el("div", "popup-tags");
    tags.appendChild(el("span", "popup-tag", marker.district || t("map.unknownArea")));
    if (marker.status === "busy") tags.appendChild(el("span", "popup-tag popup-tag--busy", t("map.busy")));
    if (marker.demo) tags.appendChild(el("span", "popup-tag popup-tag--demo", t("map.demoTag")));
    box.appendChild(tags);

    box.appendChild(
      el("p", "popup-note", t(marker.precision === "district" ? "map.coarseDistrict" : "map.coarseRegion"))
    );

    return box;
  }

  /* ---------- State machine ---------- */
  const state = {
    payload: null,
    markers: [],
    regionFilter: "ALL",
    results: [],
    activeResult: -1,
    requestSeq: 0,
    destination: null,
    destMarker: null,
    meLayer: null,
    picking: false,
    lastLocate: null,
  };

  function showBlockingState(kind) {
    if (kind === "none") {
      els.state.hidden = true;
      return;
    }

    els.state.hidden = false;
    els.state.dataset.kind = kind;
    // "library" vizual jihatdan xato holati bilan bir xil ko'rinadi
    els.state.dataset.tone = kind === "library" ? "error" : kind;

    const keys =
      kind === "loading"
        ? ["map.loading", "map.loadingSub"]
        : kind === "library"
          ? ["map.libError", "map.libErrorText"]
          : ["map.errorTitle", "map.errorText"];

    // data-i18n ham yangilanadi: MuI18n.apply() DOM tayyor bo'lganda statik
    // "Xarita yuklanmoqda…" matnini dinamik xabarning ustiga yozib qo'yadi.
    els.stateTitle.dataset.i18n = keys[0];
    els.stateTitle.textContent = t(keys[0]);
    els.stateText.dataset.i18n = keys[1];
    els.stateText.textContent = t(keys[1]);
    els.stateRetry.hidden = kind === "loading";

    els.state.setAttribute("aria-live", kind === "loading" ? "polite" : "assertive");
  }

  function setNote(message, tone) {
    els.note.textContent = message;
    if (tone) els.note.dataset.tone = tone;
    else delete els.note.dataset.tone;
  }

  function visibleMarkers() {
    if (state.regionFilter === "ALL") return state.markers;
    return state.markers.filter((marker) => marker.regionCode === state.regionFilter);
  }

  function renderMarkers() {
    const list = visibleMarkers();

    clusters.clearLayers();
    list.forEach((marker) => {
      const layer = L.marker([marker.lat, marker.lng], {
        icon: masterIcon(marker),
        title: "",
        alt: marker.name,
        keyboard: true,
      });
      layer.bindPopup(masterPopup(marker), { maxWidth: 260 });
      clusters.addLayer(layer);
    });

    renderStatus(list.length);
    els.demo.hidden = !(state.payload && state.payload.hasDemoMarkers);
  }

  function renderStatus(count) {
    const regionName =
      state.regionFilter === "ALL"
        ? t("map.allRegions")
        : localizedName((state.payload.regions.find((r) => r.code === state.regionFilter) || {}).name);

    if (!state.markers.length) {
      els.status.textContent = t("map.emptyStatus");
      return;
    }

    if (!count) {
      els.status.textContent = t("map.emptyRegion", { region: regionName });
      return;
    }

    els.status.textContent =
      formatNumber(count) + " " + t("map.foundMasters") + (regionName ? " · " + regionName : "");
  }

  /* ---------- Region chips ---------- */
  function renderChips() {
    els.chips.textContent = "";

    const items = [{ code: "ALL", name: { uz: t("map.allRegions"), ru: t("map.allRegions"), en: t("map.allRegions") } }].concat(
      state.payload ? state.payload.regions : []
    );

    items.forEach((item) => {
      const chip = el("button", "map-chip", localizedName(item.name) || item.code);
      chip.type = "button";
      chip.setAttribute("aria-pressed", String(state.regionFilter === item.code));
      chip.addEventListener("click", () => selectRegion(item.code));
      els.chips.appendChild(chip);
    });
  }

  function selectRegion(code) {
    state.regionFilter = code;

    if (code === "ALL") {
      const country = state.payload.country;
      moveBounds({ bounds: country.bounds });
    } else {
      const region = state.payload.regions.find((item) => item.code === code);
      if (region) moveBounds({ center: region.center, zoom: region.zoom });
    }

    renderChips();
    renderMarkers();
  }

  /* ---------- Data ---------- */
  async function loadData() {
    showBlockingState("loading");

    try {
      const response = await fetch("/api/map/data", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("bad_status");

      const payload = await response.json();
      state.payload = payload;
      state.markers = payload.markers || [];

      attachTiles(payload.tiles);
      renderChips();
      renderMarkers();
      showBlockingState("none");

      if (!payload.geocode || !payload.geocode.available) {
        els.query.disabled = true;
        setNote(t("map.searchDisabled"), "error");
      } else {
        setNote(t("map.searchHint"));
      }
    } catch (error) {
      attachTiles(null);
      showBlockingState("error");
      setNote(t("map.offline"), "error");
    }
  }

  els.stateRetry.addEventListener("click", loadData);

  /* ---------- Search ---------- */
  function closeResults() {
    els.results.hidden = true;
    els.results.textContent = "";
    els.query.setAttribute("aria-expanded", "false");
    state.results = [];
    state.activeResult = -1;
  }

  function renderResults() {
    els.results.textContent = "";

    state.results.forEach((item, index) => {
      const li = el("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");

      const button = el("button");
      button.type = "button";
      button.appendChild(el("strong", null, item.shortLabel || item.label));
      button.appendChild(el("small", null, item.label));
      button.addEventListener("click", () => {
        chooseResult(item);
      });

      li.appendChild(button);
      els.results.appendChild(li);
    });

    els.results.hidden = state.results.length === 0;
    els.query.setAttribute("aria-expanded", String(state.results.length > 0));
  }

  async function runSearch(rawQuery) {
    const query = String(rawQuery || "").trim();

    if (query.length < 3) {
      closeResults();
      setNote(t("map.searchHint"));
      return;
    }

    if (!state.payload || !state.payload.geocode || !state.payload.geocode.available) {
      setNote(t("map.searchDisabled"), "error");
      return;
    }

    const seq = ++state.requestSeq;
    els.form.classList.add("busy");

    try {
      const response = await fetch(
        "/api/map/search?q=" + encodeURIComponent(query) + "&lang=" + encodeURIComponent(lang())
      );

      if (seq !== state.requestSeq) return;

      if (!response.ok) throw new Error("bad_status");
      const data = await response.json();

      state.results = data.results || [];
      state.activeResult = -1;
      renderResults();

      if (!state.results.length) setNote(t("map.noResults", { q: query }));
      else setNote(t("map.resultsHint"));
    } catch (error) {
      if (seq !== state.requestSeq) return;
      closeResults();
      setNote(t("map.searchError"), "error");
    } finally {
      if (seq === state.requestSeq) els.form.classList.remove("busy");
    }
  }

  let searchTimer;

  els.query.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const value = els.query.value;
    searchTimer = setTimeout(() => runSearch(value), 420);
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(searchTimer);
    runSearch(els.query.value);
  });

  els.query.addEventListener("keydown", (event) => {
    if (!state.results.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      state.activeResult =
        (state.activeResult + step + state.results.length) % state.results.length;

      Array.from(els.results.children).forEach((li, index) => {
        li.classList.toggle("active", index === state.activeResult);
        li.setAttribute("aria-selected", String(index === state.activeResult));
        li.querySelector("button").setAttribute("tabindex", index === state.activeResult ? "0" : "-1");
      });

      els.results.children[state.activeResult].querySelector("button").focus();
    }

    if (event.key === "Escape") closeResults();
  });

  els.results.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      state.activeResult = (state.activeResult + step + state.results.length) % state.results.length;
      els.results.children[state.activeResult].querySelector("button").focus();
    }
    if (event.key === "Escape") {
      closeResults();
      els.query.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#map-panel")) closeResults();
  });

  function chooseResult(item) {
    closeResults();
    els.query.value = item.shortLabel || item.label;
    setDestination(item.lat, item.lng, item);
    moveBounds({ center: [item.lat, item.lng], zoom: Math.max(map.getZoom(), 14) });
  }

  /* ---------- Destination ---------- */
  function markDragging(on) {
    const node = state.destMarker && state.destMarker.getElement();
    const pin = node && node.querySelector(".dest-pin");
    if (pin) pin.classList.toggle("dragging", on);
  }

  function setDestination(lat, lng, place) {
    state.destination = { lat, lng, place: place || null };

    if (!state.destMarker) {
      state.destMarker = L.marker([lat, lng], {
        icon: destIcon,
        draggable: true,
        alt: t("map.legendDest"),
        autoPan: true,
        keyboard: true,
        title: "",
      }).addTo(map);

      state.destMarker.on("dragstart", () => {
        markDragging(true);
        els.destAddress.textContent = t("map.destMoving");
      });

      state.destMarker.on("dragend", () => {
        markDragging(false);
        const point = state.destMarker.getLatLng();
        setDestination(point.lat, point.lng, null);
      });
    } else {
      state.destMarker.setLatLng([lat, lng]);
    }

    els.dest.hidden = false;
    els.destAddress.textContent =
      (place && (place.shortLabel || place.label)) || t("map.destResolving");

    reverseDestination(lat, lng);
  }

  async function reverseDestination(lat, lng) {
    if (!state.payload || !state.payload.geocode || !state.payload.geocode.available) {
      els.destAddress.textContent = t("map.destNoGeocode", {
        lat: lat.toFixed(3),
        lng: lng.toFixed(3),
      });
      els.destRequest.disabled = false;
      return;
    }

    try {
      const response = await fetch(
        "/api/map/reverse?lat=" + lat + "&lng=" + lng + "&lang=" + encodeURIComponent(lang())
      );
      if (!response.ok) throw new Error("bad_status");

      const data = await response.json();
      const place = data.place;

      if (!place) {
        els.destAddress.textContent = t("map.destUnknown");
        return;
      }

      if (!place.inCountry) {
        els.destAddress.textContent = t("map.outsideCountry", { address: place.shortLabel || place.label });
        return;
      }

      state.destination.place = place;
      els.destAddress.textContent = place.shortLabel || place.label;
    } catch (error) {
      els.destAddress.textContent = t("map.destError");
    }
  }

  els.destClear.addEventListener("click", clearDestination);

  function clearDestination() {
    if (state.destMarker) {
      map.removeLayer(state.destMarker);
      state.destMarker = null;
    }
    state.destination = null;
    els.dest.hidden = true;
    els.query.value = "";
    setNote(t("map.searchHint"));
    els.query.focus();
  }

  /* ---------- Pick mode ---------- */
  function setPicking(on) {
    state.picking = on;
    els.pick.setAttribute("aria-pressed", String(on));
    $("usta-map").classList.toggle("picking", on);
    setNote(on ? t("map.pickOn") : t("map.searchHint"));
  }

  els.pick.addEventListener("click", () => setPicking(!state.picking));

  map.on("click", (event) => {
    if (!state.picking) return;
    setDestination(event.latlng.lat, event.latlng.lng, null);
    setPicking(false);
    showToast(t("map.destSet"));
  });

  /* ---------- Locate ---------- */
  els.locate.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      setNote(t("map.locateUnsupported"), "error");
      showToast(t("map.locateUnsupported"));
      els.locate.disabled = true;
      return;
    }

    els.locate.setAttribute("aria-busy", "true");
    setNote(t("map.locating"));

    navigator.geolocation.getCurrentPosition(onLocated, onLocateFailed, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });

  function onLocated(position) {
    els.locate.removeAttribute("aria-busy");

    const { latitude, longitude, accuracy } = position.coords;
    state.lastLocate = position;

    if (state.meLayer) map.removeLayer(state.meLayer);
    state.meLayer = L.layerGroup([
      L.circle([latitude, longitude], {
        radius: Math.min(accuracy || 120, 400),
        color: "#1E63D0",
        weight: 1,
        fillColor: "#1E63D0",
        fillOpacity: 0.12,
        interactive: false,
      }),
      L.marker([latitude, longitude], { icon: meIcon, alt: t("map.locate") }),
    ]).addTo(map);

    moveBounds({ center: [latitude, longitude], zoom: Math.max(map.getZoom(), 13) });
    setNote(t("map.located", { accuracy: formatNumber(Math.round(accuracy)) }));
    showToast(t("map.locatedShort"));
  }

  function onLocateFailed(error) {
    els.locate.removeAttribute("aria-busy");

    if (error.code === error.PERMISSION_DENIED) {
      setNote(t("map.locateDenied"), "error");
      showToast(t("map.locateDeniedToast"));
      return;
    }

    if (error.code === error.TIMEOUT) {
      setNote(t("map.locateTimeout"), "error");
      return;
    }

    setNote(t("map.locateUnavailable"), "error");
  }

  /* ---------- Reset ---------- */
  els.reset.addEventListener("click", () => {
    selectRegion("ALL");
    if (state.lastLocate) {
      const { latitude, longitude } = state.lastLocate.coords;
      moveBounds({ center: [latitude, longitude], zoom: 13 });
    }
  });

  /* ---------- Panel collapse ---------- */
  els.panelToggle.addEventListener("click", () => {
    const collapsed = els.panel.classList.toggle("collapsed");
    els.panelToggle.setAttribute("aria-expanded", String(!collapsed));
    setTimeout(() => map.invalidateSize(), 180);
  });

  /* ---------- Mobile navigation ---------- */
  function closeNav() {
    els.nav.classList.remove("open");
    els.hamburger.setAttribute("aria-expanded", "false");
    els.hamburger.setAttribute("aria-label", t("aria.menuOpen"));
  }

  els.hamburger.addEventListener("click", () => {
    const isOpen = els.nav.classList.toggle("open");
    els.hamburger.setAttribute("aria-expanded", String(isOpen));
    els.hamburger.setAttribute("aria-label", t(isOpen ? "aria.menuClose" : "aria.menuOpen"));
  });

  Array.from(els.nav.querySelectorAll("a")).forEach((link) => link.addEventListener("click", closeNav));

  /* ---------- Request modal ---------- */
  let lastFocused = null;

  function districtForModal() {
    const place = state.destination && state.destination.place;
    if (place) return place.districtName || place.regionName || "";
    if (state.regionFilter !== "ALL") {
      const region = state.payload && state.payload.regions.find((r) => r.code === state.regionFilter);
      if (region) return localizedName(region.name);
    }
    return "";
  }

  function openModal() {
    lastFocused = document.activeElement;
    els.modalFormView.hidden = false;
    els.modalSuccessView.hidden = true;
    els.form2.reset();
    els.district.value = districtForModal();

    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => els.name.focus());
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll("[data-open-modal]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
      closeNav();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((node) => {
    node.addEventListener("click", closeModal);
  });

  els.destRequest.addEventListener("click", openModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!els.modal.hidden) closeModal();
      if (state.picking) setPicking(false);
    }
  });

  /* Phone mask — landing sahifasidagi bilan bir xil format */
  function formatPhone(raw) {
    let digits = String(raw || "").replace(/\D/g, "");
    if (digits.startsWith("998")) digits = digits.slice(3);
    digits = digits.slice(0, 9);

    let out = "+998";
    if (digits.length) out += " " + digits.slice(0, 2);
    if (digits.length > 2) out += " " + digits.slice(2, 5);
    if (digits.length > 5) out += " " + digits.slice(5, 7);
    if (digits.length > 7) out += " " + digits.slice(7, 9);
    return out;
  }

  els.phone.addEventListener("focus", () => {
    if (!els.phone.value.trim()) els.phone.value = "+998 ";
  });

  els.phone.addEventListener("input", () => {
    els.phone.value = formatPhone(els.phone.value);
  });

  els.phone.addEventListener("blur", () => {
    if (els.phone.value.replace(/\D/g, "") === "998") els.phone.value = "";
  });

  const submitBtn = els.form2.querySelector('button[type="submit"]');

  els.form2.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (els.phone.value.replace(/\D/g, "").length !== 12) {
      showToast(t("toast.phone"));
      els.phone.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("common.sending");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "request",
          name: els.name.value,
          phone: els.phone.value,
          service: els.service.value,
          district: els.district.value,
        }),
      });

      if (!response.ok) throw new Error("bad_status");

      els.modalFormView.hidden = true;
      els.modalSuccessView.hidden = false;
      els.modalSuccessView.querySelector(".btn").focus();
      els.form2.reset();
    } catch (error) {
      showToast(t("toast.failed"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t("modal.submit");
    }
  });

  /* ---------- Language ---------- */
  document.addEventListener("mu:langchange", () => {
    renderChips();
    if (state.payload) renderMarkers();
    if (!els.state.hidden) showBlockingState(els.state.dataset.kind || els.state.dataset.tone || "loading");
    if (state.destination && state.destination.place) {
      els.destAddress.textContent =
        state.destination.place.shortLabel || state.destination.place.label;
    }
    document.querySelectorAll(".map-fab--square").forEach((button) => {
      button.setAttribute("aria-label", t(button.dataset.i18nAria));
    });
  });

  /* ---------- Resize ---------- */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      map.invalidateSize({ animate: false });
      // Boot paytida konteyner 0x0 bo'lib qolgan bo'lsa, aynan shu yerda tiklanadi.
      ensureMapSize(2);
    }, 160);
  });

  // Xarita konteyneri hali o'lcham olmagan bo'lsa (shrift/joylashuv kechikkan
  // qayta hisoblagichda) Leaflet 0x0 maydonda bo'sh kulrang panel chizadi.
  function ensureMapSize(retries) {
    const box = $("usta-map");
    if (!box) return;

    if (box.clientHeight < 80 || box.clientWidth < 80) {
      map.invalidateSize({ animate: false });
      if (retries > 0) setTimeout(() => ensureMapSize(retries - 1), 150);
      else console.warn("MahallaUsta: xarita konteyneri hali kichik.", box.getBoundingClientRect());
      return;
    }

    const size = map.getSize();
    diagnostics.mapSize = [size.x, size.y];
  }

  /* ---------- Auth guard: redirect to login if no session ---------- */
  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      if (response.status === 401) {
        window.location.replace("login.html");
        return false;
      }
      if (!response.ok) {
        window.location.replace("login.html");
        return false;
      }
      return true;
    } catch (error) {
      window.location.replace("login.html");
      return false;
    }
  }

  /* ---------- Go ---------- */
  checkAuth().then((ok) => {
    if (!ok) return;
    if (window.innerWidth < 900) {
      els.panel.classList.add("collapsed");
      els.panelToggle.setAttribute("aria-expanded", "false");
    }

    loadData();
    ensureMapSize(6);

    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
      document.fonts.ready.then(() => ensureMapSize(2));
    }
  });
})();
