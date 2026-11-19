"use strict";

/*
 * Usta Xaritasi — backend ma'lumotlarini xarita nuqtalariga aylantiradi.
 *
 * Maxfiylik: bazada ustlarning aniq koordinatalari saqlanmaydi va bu API
 * ularni qaytarmaydi. Har bir nuota faqat tuman yoki viloyat taxminiy
 * markazida joylashadi (~100 m ga yaxlitlangan). Telefon raqami va boshqa
 * shaxsiy maydonlar bermaydi.
 *
 * Demo ma'lumotlar: SEED_MASTERS (lib/store.js) ichidan olingan ustalar
 * `demo: true` belgisi bilan chiqadi va NODE_ENV=production da
 * SHOW_SEED_DEMO=1 bo'lmasa xaritada umuman ko'rsatilmaydi.
 */

const regions = require("./regions");
const geocode = require("./geocode");

function isProduction() {
  return String(process.env.NODE_ENV || "").toLowerCase() === "production";
}

function seedDemoAllowed() {
  return !isProduction() || process.env.SHOW_SEED_DEMO === "1";
}

function publicRegion(region) {
  return {
    code: region.code,
    name: region.short ? region.short : region.names,
    center: region.center,
    zoom: region.zoom,
  };
}

/*
 * Raster plita provayderi.
 *
 * Standart holda OpenStreetMap "Standard" plitalari ishlatiladi. Ular OSMF
 * ko'ngillilariga qaraganiman va ishlatish siyosati majburiy:
 *   https://operations.osmfoundation.org/policies/tiles/
 * Siyosat talab qiladi: haqiqiy brauzer User-Agent + yuboriladigan Referer
 * (shuning uchun server.js "strict-origin-when-cross-origin"), ko'rinish
 * atributiyasi, plitalarni 1 soatdan ko'p saqlamaslik va "bulk download"
 * qilmaslik.
 *
 * Katta yuklama uchun siyosatga ko'ra o'zingiz plita hostiring yoki
 * kalitli tijorat provayderiga o'ting. Buning uchun kod o'zgarmaydi —
 * .env ichida (kalitlar brauzer kodi ichiga YOZILMAYDI):
 *   MAP_TILE_URL, MAP_TILE_ATTRIBUTION, MAP_TILE_SUBDOMAINS, MAP_TILE_MAX_ZOOM
 * Kalit URL'ning o'zida bo'lsa, u mijozga shu holatda chiqadi — provayder
 * so'rovnomasida "public / domain-restricted" kalitni tanlang.
 */
const DEFAULT_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: "abc",
  maxZoom: 19,
};

function tileConfig() {
  const customUrl = String(process.env.MAP_TILE_URL || "").trim();
  const configuredMaxZoom = Number(process.env.MAP_TILE_MAX_ZOOM);

  return {
    url: customUrl || DEFAULT_TILES.url,
    attribution:
      String(process.env.MAP_TILE_ATTRIBUTION || "").trim() ||
      DEFAULT_TILES.attribution,
    subdomains:
      String(process.env.MAP_TILE_SUBDOMAINS || "").trim() ||
      DEFAULT_TILES.subdomains,
    maxZoom: Number.isFinite(configuredMaxZoom) && configuredMaxZoom > 0
      ? configuredMaxZoom
      : DEFAULT_TILES.maxZoom,
    provider: customUrl ? "custom" : "osm-standard",
  };
}

function buildMarkers(db, isSeedMaster) {
  const markers = [];
  let unlocated = 0;
  let hiddenDemo = 0;

  (db.masters || []).forEach((master, index) => {
    const demo = typeof isSeedMaster === "function" ? Boolean(isSeedMaster(master)) : false;

    if (demo && !seedDemoAllowed()) {
      hiddenDemo += 1;
      return;
    }

    const place = regions.resolvePlace(master.district);
    if (!place) {
      unlocated += 1;
      return;
    }

    markers.push({
      id: `m${index + 1}`,
      name: String(master.name || "").slice(0, 60),
      spec: String(master.spec || "").slice(0, 60),
      rating: Number(master.rating) || 0,
      jobs: Number(master.jobs) || 0,
      status: master.status === "busy" ? "busy" : "active",
      district: place.districtName,
      districtCode: place.districtCode,
      regionCode: place.regionCode,
      precision: place.precision,
      lat: place.lat,
      lng: place.lng,
      demo,
    });
  });

  return { markers, unlocated, hiddenDemo };
}

function buildPayload(db, { isSeedMaster } = {}) {
  const { markers, unlocated, hiddenDemo } = buildMarkers(db, isSeedMaster);

  return {
    country: {
      code: regions.COUNTRY.code,
      name: regions.COUNTRY.names,
      center: regions.COUNTRY.center,
      zoom: regions.COUNTRY.zoom,
      bounds: regions.COUNTRY.bounds,
    },
    regions: regions.REGIONS.map(publicRegion),
    markers,
    tiles: tileConfig(),
    geocode: {
      available: geocode.isConfigured(),
      provider: geocode.providerName,
    },
    stats: {
      total: (db.masters || []).length,
      shown: markers.length,
      unlocated,
      hiddenDemo,
    },
    demo: markers.length > 0 && markers.every((marker) => marker.demo),
    hasDemoMarkers: markers.some((marker) => marker.demo),
    environment: isProduction() ? "production" : "development",
    precisionNote: "district_center",
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { buildPayload, seedDemoAllowed, isProduction, tileConfig, DEFAULT_TILES };
