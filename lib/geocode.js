"use strict";

/*
 * Geocoding provayderi: OpenStreetMap Nominatim.
 *
 * Nima uchun server tomonida:
 *  - kalit (API key) talab qilinmaydi, shuning uchun brauzerga hech narsa chiqmaydi;
 *  - Nominatim foydalanish qoidasi har bir so'rovni aniqlovchi User-Agent bilan
 *    yuborishni va sekundiga 1 so'rovdan ko'p emasligini talab qiladi —
 *    buni brauzerdan emas, faqat serverdan nazorat qilib bo'ladi;
 *  - javoblar qisqa vaqtli xotirada saqlanadi (5 daqiqa), doimiy saqlanmaydi.
 *
 * Boshqa provayder (Mapbox/Google) kerak bo'lsa: GEOCODE_BASE_URL o'rniga
 * o'sha provayder kalitini .env ichida saqlang va shu faylni kengaytiring.
 */

const regions = require("./regions");

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT_MS = Number(process.env.GEOCODE_TIMEOUT_MS) || 6000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;
const UPSTREAM_MIN_INTERVAL_MS = Number(process.env.GEOCODE_MIN_INTERVAL_MS) || 1100;
const RATE_WINDOW_MS = 60000;
const RATE_MAX_PER_IP = Number(process.env.GEOCODE_RATE_LIMIT) || 20;

const LANG_MAP = { uz: "uz", ru: "ru", en: "en" };

function baseUrl() {
  return String(process.env.GEOCODE_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function isConfigured() {
  return typeof fetch === "function" && Boolean(baseUrl());
}

function userAgent() {
  const contact = String(process.env.GEOCODE_CONTACT || "").trim();
  // HTTP header faqat ASCII ruxsat etadi; nomli User-Agent + bog'lanish talab qilinadi
  const safe = contact.replace(/[^\x20-\x7E]/g, "").slice(0, 120);
  return safe
    ? `MahallaUsta/1.0 (+${safe})`
    : "MahallaUsta/1.0 (https://mahallausta.uz)";
}

class GeocodeError extends Error {
  constructor(code, status) {
    super(code);
    this.name = "GeocodeError";
    this.code = code;
    this.status = status || 503;
  }
}

/* ---------- Memory cache (faqat ishga tushirilgan holatda, diskka yozilmaydi) ---------- */
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

/* ---------- Per-IP limit ---------- */
const buckets = new Map();

function takeToken(ip) {
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || entry.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_MAX_PER_IP) return false;
  entry.count += 1;
  return true;
}

// xotira o'sib ketmasligi uchun eskirgan hisoblar bir marta/daqiqa tozalanadi
const bucketTimer = setInterval(() => {
  const now = Date.now();
  buckets.forEach((entry, ip) => {
    if (entry.resetAt < now) buckets.delete(ip);
  });
}, RATE_WINDOW_MS);
if (bucketTimer.unref) bucketTimer.unref();

/* ---------- Upstream navbat: sekundiga 1 so'rovdan oshirmaydi ---------- */
let queueTail = Promise.resolve();
let lastStartedAt = 0;

function schedule(work) {
  const run = queueTail.then(async () => {
    const wait = lastStartedAt + UPSTREAM_MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastStartedAt = Date.now();
    return work();
  });

  // xatolik navbatni buzmasligi kerak
  queueTail = run.catch(() => undefined);
  return run;
}

async function request(params, lang) {
  if (!isConfigured()) throw new GeocodeError("geocode_unavailable");

  const url = new URL(`${baseUrl()}/${params.path}`);
  Object.entries(params.query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set("accept-language", LANG_MAP[lang] || "uz");

  const response = await schedule(async () =>
    fetch(url, {
      headers: {
        "User-Agent": userAgent(),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  ).catch(() => {
    throw new GeocodeError("geocode_unavailable");
  });

  if (!response.ok) {
    // 429/5xx — provayder javob bermadi; foydalanuvchiga tushunarli holat beriladi
    throw new GeocodeError(response.status === 429 ? "geocode_rate_limited" : "geocode_unavailable", 503);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new GeocodeError("geocode_unavailable");
  }
}

function round5(value) {
  return Math.round(Number(value) * 100000) / 100000;
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function locationFromNominatim(item) {
  const address = item.address || {};
  const districtName =
    address.city_district || address.suburb || address.quarter || address.neighbourhood || address.village || address.town || address.city || "";
  const district = regions.matchDistrict(districtName);
  const region =
    regions.matchRegion(address.state || "") ||
    (district ? regions.findRegion(district.region) : null);

  const labelParts = [cleanLabel(districtName), cleanLabel(address.state || "")].filter(Boolean);

  return {
    label: cleanLabel(item.display_name),
    shortLabel: labelParts.join(", "),
    lat: round5(item.lat),
    lng: round5(item.lon),
    kind: String(item.type || item.category || "").slice(0, 40),
    districtCode: district ? district.code : null,
    districtName: district ? district.names.uz : districtName || null,
    regionCode: region ? region.code : null,
    regionName: region ? region.names.uz : address.state || null,
    inCountry: regions.isInCountry(item.lat, item.lon),
    precision: item.class === "boundary" || item.type === "administrative" ? "region" : "address",
  };
}

/** Manzil/shahar bo'yicha qidirish (O'zbekiston hududiga ustuvorlik beriladi). */
async function search({ query, lang = "uz", limit = 6, ip = "local" }) {
  const text = String(query || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 80);

  if (text.length < 2) return { results: [], reason: "too_short" };
  if (!takeToken(ip)) throw new GeocodeError("geocode_rate_limited", 429);

  const key = `search|${lang}|${text.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await request({
    path: "search",
    query: {
      q: text,
      format: "jsonv2",
      limit: Math.max(1, Math.min(10, Number(limit) || 6)),
      addressdetails: 1,
      countrycodes: "uz",
    },
  }, lang);

  const results = Array.isArray(data)
    ? data.map(locationFromNominatim).filter((item) => item.label && Number.isFinite(item.lat))
    : [];

  const payload = { results, reason: results.length ? null : "no_results" };
  cacheSet(key, payload);
  return payload;
}

/** Marker joylashuvini manzilga aylantiradi (maqsad belgilanganda ishlatiladi). */
async function reverse({ lat, lng, lang = "uz", ip = "local" }) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { place: null, reason: "invalid_coordinates" };
  }
  if (!takeToken(ip)) throw new GeocodeError("geocode_rate_limited", 429);

  const key = `reverse|${lang}|${round5(latitude)}|${round5(longitude)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await request({
    path: "reverse",
    query: {
      lat: latitude,
      lon: longitude,
      format: "jsonv2",
      zoom: 16,
      addressdetails: 1,
    },
  }, lang);

  if (!data || !data.display_name) return { place: null, reason: "no_results" };

  const payload = { place: locationFromNominatim(data), reason: null };
  cacheSet(key, payload);
  return payload;
}

module.exports = {
  isConfigured,
  search,
  reverse,
  GeocodeError,
  providerName: "OpenStreetMap Nominatim",
};
