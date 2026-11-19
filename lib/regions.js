"use strict";

/*
 * O'zbekiston ma'muriy birliklari va Toshkent tumanlari — TAXMINIY markaziy
 * koordinatalar. Xaritalash nuqtasi sifatida ishlatiladi, aniq manzil emas.
 * Koordinatalar atamaviy markazlar bo'lib, xizmat ko'rsatuvchi ustning uy
 * manzilini bilish uchun yetarli emas (maxfiylik talabi shu).
 */

const COUNTRY = {
  code: "UZ",
  names: { uz: "O'zbekiston", ru: "Узбекистан", en: "Uzbekistan" },
  center: [41.2, 64.2],
  zoom: 6,
  bounds: [
    [37.0, 55.9],
    [45.7, 73.3],
  ],
};

/* 12 viloyat + 1 respublika + 1 shahar = 14 ma'muriy birlik */
const REGIONS = [
  {
    code: "QR",
    names: {
      uz: "Qoraqalpog'iston Respublikasi",
      ru: "Республика Каракалпакстан",
      en: "Karakalpakstan",
    },
    short: { uz: "Qoraqalpog'iston", ru: "Каракалпакстан", en: "Karakalpakstan" },
    center: [43.3, 58.8],
    zoom: 6,
    aliases: ["qoraqalpogiston", "qoraqalpogistoni", "karakalpakstan", "qoraqalpoq", "каракалпакстан", "республика каракалпакстан", "nukus", "нукус"],
  },
  {
    code: "AN",
    names: { uz: "Andijon viloyati", ru: "Андижанская область", en: "Andijan Region" },
    short: { uz: "Andijon", ru: "Андижан", en: "Andijan" },
    center: [40.85, 72.2],
    zoom: 9,
    aliases: ["andijon", "andijon viloyati", "андижан", "андижанская область", "андиожан"],
  },
  {
    code: "BX",
    names: { uz: "Buxoro viloyati", ru: "Бухарская область", en: "Bukhara Region" },
    short: { uz: "Buxoro", ru: "Бухара", en: "Bukhara" },
    center: [40.0, 64.2],
    zoom: 7,
    aliases: ["buxoro", "buxoro viloyati", "buhoro", "бухара", "бухарская область"],
  },
  {
    code: "FG",
    names: { uz: "Farg'ona viloyati", ru: "Ферганская область", en: "Fergana Region" },
    short: { uz: "Farg'ona", ru: "Фергана", en: "Fergana" },
    center: [40.35, 71.15],
    zoom: 9,
    aliases: ["fargona", "fargona viloyati", "fergana", "фергана", "ферганская область", "farghona"],
  },
  {
    code: "JZ",
    names: { uz: "Jizzax viloyati", ru: "Джизакская область", en: "Jizzakh Region" },
    short: { uz: "Jizzax", ru: "Джизак", en: "Jizzakh" },
    center: [40.1, 67.7],
    zoom: 8,
    aliases: ["jizzax", "jizax", "jizzax viloyati", "джизак", "джизакская область"],
  },
  {
    code: "QS",
    names: { uz: "Qashqadaryo viloyati", ru: "Кашкадарьинская область", en: "Kashkadarya Region" },
    short: { uz: "Qashqadaryo", ru: "Кашкадарья", en: "Kashkadarya" },
    center: [38.8, 66.1],
    zoom: 8,
    aliases: ["qashqadaryo", "kashkadarya", "қашкадарё", "кашкадарья", "кашкадарьинская область", "karshi", "qarshi", "карши"],
  },
  {
    code: "NG",
    names: { uz: "Navoiy viloyati", ru: "Навоийская область", en: "Navoiy Region" },
    short: { uz: "Navoiy", ru: "Навои", en: "Navoiy" },
    center: [42.0, 64.4],
    zoom: 7,
    aliases: ["navoiy", "navoi", "навои", "навоийская область"],
  },
  {
    code: "NM",
    names: { uz: "Namangan viloyati", ru: "Наманганская область", en: "Namangan Region" },
    short: { uz: "Namangan", ru: "Наманган", en: "Namangan" },
    center: [41.15, 71.5],
    zoom: 9,
    aliases: ["namangan", "наманган", "namangan viloyati", "наманганская область"],
  },
  {
    code: "SG",
    names: { uz: "Samarqand viloyati", ru: "Самаркандская область", en: "Samarkand Region" },
    short: { uz: "Samarqand", ru: "Самарканд", en: "Samarkand" },
    center: [39.8, 66.9],
    zoom: 8,
    aliases: ["samarqand", "samarkand", "самарканд", "самаркандская область"],
  },
  {
    code: "SR",
    names: { uz: "Sirdaryo viloyati", ru: "Сырдарьинская область", en: "Sirdaryo Region" },
    short: { uz: "Sirdaryo", ru: "Сырдарья", en: "Sirdaryo" },
    center: [40.6, 68.6],
    zoom: 9,
    aliases: ["sirdaryo", "syrdarya", "сырдарья", "syrdar", "guliston", "гулистан"],
  },
  {
    code: "SV",
    names: { uz: "Surxondaryo viloyati", ru: "Сурхандарьинская область", en: "Surkhandarya Region" },
    short: { uz: "Surxondaryo", ru: "Сурхандарья", en: "Surkhandarya" },
    center: [37.65, 67.25],
    zoom: 8,
    aliases: ["surxondaryo", "surkhandarya", "сурхандарья", "termiz", "termez", "термез"],
  },
  {
    code: "TA",
    names: { uz: "Toshkent shahri", ru: "город Ташкент", en: "Tashkent City" },
    short: { uz: "Toshkent shahri", ru: "Ташкент", en: "Tashkent" },
    center: [41.2995, 69.2401],
    zoom: 11,
    aliases: ["toshkent shahri", "toshkent", "tashkent", "город ташкент", "ташкент", "toshkent city"],
  },
  {
    code: "TO",
    names: { uz: "Toshkent viloyati", ru: "Ташкентская область", en: "Tashkent Region" },
    short: { uz: "Toshkent viloyati", ru: "Ташкентская обл.", en: "Tashkent Region" },
    center: [41.4, 69.9],
    zoom: 9,
    aliases: ["toshkent viloyati", "tashkent region", "toshkent wiloyati", "nurafshon", "nurobod", "ohangaron", "bostanlik", "ташкентская область", "тошкент вилояти", "ташкент вилояти"],
  },
  {
    code: "XO",
    names: { uz: "Xorazm viloyati", ru: "Хорезмская область", en: "Khorezm Region" },
    short: { uz: "Xorazm", ru: "Хорезм", en: "Khorezm" },
    center: [41.6, 60.5],
    zoom: 8,
    aliases: ["xorazm", "khorezm", "horazm", "хорезм", "urganch", "urgench", "ургенч", "urgenchi", "хорезмская область"],
  },
];

/* Toshkent shahar tumanlari — backend `district` maydoni shu nomlar bilan keladi */
const TASHKENT_DISTRICTS = [
  { code: "TA-AL", region: "TA", names: { uz: "Almazor", ru: "Алмазар", en: "Almazar" }, center: [41.317, 69.257], aliases: ["almazor"] },
  { code: "TA-BK", region: "TA", names: { uz: "Bektemir", ru: "Бектемир", en: "Bektemir" }, center: [41.235, 69.372], aliases: ["bektemir", "бектемир"] },
  { code: "TA-CH", region: "TA", names: { uz: "Chilonzor", ru: "Чилонзор", en: "Chilanzar" }, center: [41.264, 69.208], aliases: ["chilonzor", "чилонзор", "чилоназар"] },
  { code: "TA-MI", region: "TA", names: { uz: "Mirobod", ru: "Мирабад", en: "Mirobod" }, center: [41.293, 69.264], aliases: ["mirobod", "myrobod"] },
  { code: "TA-MU", region: "TA", names: { uz: "Mirzo Ulug'bek", ru: "Мирзо Улуғбек", en: "Mirzo Ulugbek" }, center: [41.333, 69.323], aliases: ["mirzo ulugbek", "mirzo ulug bek", "ulugbek", "мирзо улубек", "мирзо улугбек"] },
  { code: "TA-OL", region: "TA", names: { uz: "Olmazor", ru: "Олмазар", en: "Olmazor" }, center: [41.322, 69.302], aliases: ["olmazor", "олмазор"] },
  { code: "TA-SA", region: "TA", names: { uz: "Sergeli", ru: "Сергели", en: "Sergeli" }, center: [41.222, 69.218], aliases: ["sergeli", "sirgali", "сергели"] },
  { code: "TA-SH", region: "TA", names: { uz: "Shahriston", ru: "Шахристан", en: "Shahristan" }, center: [41.293, 69.277], aliases: ["shahriston", "shahristan", "шахристан", "шахристон"] },
  { code: "TA-UC", region: "TA", names: { uz: "Uchtepa", ru: "Учтепа", en: "Uchtepa" }, center: [41.281, 69.241], aliases: ["uchtepa", "учтепа"] },
  { code: "TA-YA", region: "TA", names: { uz: "Yakkasaroy", ru: "Яккасарой", en: "Yakkasaray" }, center: [41.285, 69.253], aliases: ["yakkasaroy", "yakkasaray", "яккасарой", "яккасарай"] },
  { code: "TA-YB", region: "TA", names: { uz: "Yashnobod", ru: "Яшнабод", en: "Yashnabad" }, center: [41.296, 69.323], aliases: ["yashnobod", "yashnabad", "яшнабод"] },
  { code: "TA-YU", region: "TA", names: { uz: "Yunusobod", ru: "Юнусобод", en: "Yunusabad" }, center: [41.362, 69.293], aliases: ["yunusobod", "yunusabad", "юнусобод", "юусабад"] },
];

const ADMIN_WORDS = /\b(tumani|tuman|tumanning|viloyati|viloyat|viloyatining|shahri|shahar|respublikasi|respublikasi|rayoni|retoni|oblast|region|regioni)\b/g;

function normalize(value) {
  return String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[\u02BB\u02BC\u02BD\u2018\u2019'`´’‘]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonical(value) {
  return normalize(value)
    .replace(ADMIN_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIndex(entries) {
  const index = new Map();

  entries.forEach((entry) => {
    const words = new Set([
      ...entry.aliases,
      entry.names.uz,
      entry.names.ru,
      entry.names.en,
      entry.short ? entry.short.uz : entry.names.uz,
    ]);

    words.forEach((word) => {
      const key = canonical(word);
      if (key && !index.has(key)) index.set(key, entry);
    });
  });

  return index;
}

const REGION_INDEX = buildIndex(REGIONS);
const DISTRICT_INDEX = buildIndex(
  TASHKENT_DISTRICTS.map((item) => ({ ...item, aliases: item.aliases, names: item.names }))
);

/** Toshkent tumani nomini topadi (backend `district` erkin matn bo'lishi mumkin). */
function matchDistrict(text) {
  const direct = DISTRICT_INDEX.get(canonical(text));
  if (direct) return direct;

  const normalized = normalize(text);
  return (
    TASHKENT_DISTRICTS.find(
      (item) =>
        normalized.includes(canonical(item.names.uz)) ||
        item.aliases.some((alias) => normalized.includes(canonical(alias)))
    ) || null
  );
}

/** Viloyat/respublika/shahar nomini topadi. */
function matchRegion(text) {
  const direct = REGION_INDEX.get(canonical(text));
  if (direct) return direct;

  const normalized = normalize(text);
  return (
    REGIONS.find(
      (item) =>
        normalized.includes(canonical(item.short ? item.short.uz : item.names.uz)) ||
        normalized.includes(canonical(item.names.uz)) ||
        item.aliases.some((alias) => canonical(alias).length > 3 && normalized.includes(canonical(alias)))
    ) || null
  );
}

/**
 * Backenddagi `district` satrini xarita nuqtasiga aylantiradi.
 * Aniq koordinatalar saqlanmaydi — faqat tuman/viloyat taxminiy markazi,
 * ~100 m ga yaxlitlangan holda beriladi.
 */
function resolvePlace(district) {
  const found = matchDistrict(district);

  if (found) {
    return {
      lat: round(found.center[0]),
      lng: round(found.center[1]),
      regionCode: found.region,
      districtCode: found.code,
      districtName: found.names.uz,
      precision: "district",
    };
  }

  const region = matchRegion(district);

  if (region) {
    return {
      lat: round(region.center[0]),
      lng: round(region.center[1]),
      regionCode: region.code,
      districtCode: null,
      districtName: district ? String(district).trim() : null,
      precision: "region",
    };
  }

  return null;
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function findRegion(code) {
  return REGIONS.find((item) => item.code === code) || null;
}

function isInCountry(lat, lng) {
  const [[south, west], [north, east]] = COUNTRY.bounds;
  return Number(lat) >= south && Number(lat) <= north && Number(lng) >= west && Number(lng) <= east;
}

module.exports = {
  COUNTRY,
  REGIONS,
  TASHKENT_DISTRICTS,
  matchDistrict,
  matchRegion,
  resolvePlace,
  findRegion,
  isInCountry,
  normalize,
};
