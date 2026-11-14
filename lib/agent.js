"use strict";

/**
 * MahallaUsta AI agent (MVP)
 *
 * - AI_API_KEY mavjud bo'lsa, OpenAI-mos provayderga (function calling bilan) murojaat qiladi.
 * - Kalit bo'lmasa yoki provayder javob bermasa, lokal bilim bazasi asosida javob beradi.
 * - Mehmonlar uchun ochiq: maxfiy ma'lumot (mijoz telefoni, buyurtma tafsilotlari) qaytarmaydi.
 */

const fs = require("node:fs");
const path = require("node:path");
const { PLANS, ESTIMATES } = require("./store");

const LANGS = ["uz", "ru", "en"];
const MAX_MESSAGE = 600;
const MAX_HISTORY = 8;
const MAX_TOOL_ROUNDS = 3;

/* ---------- .env (qo'shimcha paketlarsiz) ---------- */
function loadEnvFile() {
  try {
    const file = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(file)) return;

    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;

      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    }
  } catch (error) {
    /* .env ixtiyoriy */
  }
}

loadEnvFile();

const CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "",
  baseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
  model: process.env.AI_MODEL || "gpt-4o-mini",
  timeout: Number(process.env.AI_TIMEOUT_MS) || 15000,
};

/* ---------- Bilim bazasi ---------- */
const SERVICES = [
  { key: "Santexnika", uz: "Santexnika", ru: "Сантехника", en: "Plumbing" },
  { key: "Elektr ishlari", uz: "Elektr ishlari", ru: "Электромонтаж", en: "Electrical work" },
  { key: "Duradgorlik", uz: "Duradgorlik", ru: "Столярные работы", en: "Carpentry" },
  { key: "Bo'yash va suvoq", uz: "Bo'yash va suvoq", ru: "Покраска и штукатурка", en: "Painting & plastering" },
  { key: "Plitka va kafel", uz: "Plitka va kafel", ru: "Плитка и кафель", en: "Tiling" },
  { key: "Konditsioner", uz: "Konditsioner", ru: "Кондиционер", en: "Air conditioning" },
];

const SERVICE_ALIASES = {
  Santexnika: /(santex|quvur|kran|kanaliz|plumb|pipe|tap|сантех|труб|кран|канализ)/i,
  "Elektr ishlari": /(elektr|tok|rozetka|chiroq|electric|wiring|socket|электр|розетк|свет)/i,
  Duradgorlik: /(duradgor|yog'och|eshik|mebel|carpent|wood|furniture|столяр|дерев|мебел)/i,
  "Bo'yash va suvoq": /(bo'yash|buyash|suvoq|paint|plaster|покрас|штукатур)/i,
  "Plitka va kafel": /(plitka|kafel|tile|tiling|плитк|кафел)/i,
  Konditsioner: /(konditsioner|kondits|air ?cond|кондиционер)/i,
};

const MASTER_SPECS = {
  Santexnika: /(santex|plumb|сантех)/i,
  "Elektr ishlari": /(elektr|electric|электр)/i,
  Duradgorlik: /(duradgor|carpent|столяр)/i,
  "Bo'yash va suvoq": /(bo'yoq|boyoq|paint|покрас)/i,
  "Plitka va kafel": /(plitka|kafel|tile|плитк)/i,
  Konditsioner: /(konditsioner|air ?cond|кондиционер)/i,
};

const T = {
  uz: {
    greeting:
      "Assalomu alaykum! Men MahallaUsta AI yordamchisiman. Usta topish, narxlar, tariflar yoki buyurtma berishda yordam beraman. Nima bilan yordam bera olaman?",
    thanks: "Arziydi! Yana savolingiz bo'lsa, yozing — yordam berishga tayyorman.",
    howAreYou:
      "Yaxshi, rahmat! Siz qalaysiz? Kayfiyatingiz yaxshi bo'lsa, men xursandman. Usta yoki xizmatlar bo'yicha savolingiz bo'lsa, yordam beraman.",
    whoAreYou:
      "Men MahallaUsta'ning AI yordamchisiman. Usta topish, narxlar, tariflar va buyurtma berishda yordam beraman.",
    whatCanDo:
      "Men quyidagilarda yordam beraman:\n• xizmatlar va narxlar\n• usta tanlash va reyting\n• tariflar va obuna\n• buyurtma berish\n• xavfsizlik va to'lov\n• aloqa ma'lumotlari\n\nNima bilan boshlaymiz?",
    name: "Mening ismim MahallaUsta AI. Sizga usta topishda yordam beraman.",
    goodbye: "Xayr! Yana savolingiz bo'lsa, yozing — doim yordam berishga tayyorman.",
    weather:
      "Afsuski, ob-havo ma'lumotlarini bilmayman. Lekin usta kerak bo'lsa — masalan, konditsioner yoki isitish bo'yicha — yordam bera olaman.",
    time: "Hozir Toshkent vaqti bilan {time}. Yana nima bilan yordam bera olaman?",
    timeUnknown: "Hozirgi vaqtni aniqlay olmadim, lekin usta yoki xizmatlar bo'yicha yordam bera olaman.",
    joke:
      "Kichik hazil: usta kraningizni tuzatdi. Egasi: \"Endi suv qayerdan kelayotganini bilasizmi?\" Usta: \"Yo'q, lekin endi to'g'ri yo'nalishda ketyapti.\"",
    affirm: "Ajoyib! So'rov formasini ochyapman — ismingiz, telefon raqamingiz va xizmat turini kiriting. Operator 15 daqiqada bog'lanadi.",
    how: "MahallaUsta'da ishlash juda oson:\n1. Xizmat turini tanlang (santexnika, elektr va h.k.).\n2. So'rov qoldiring — 15 daqiqada operator siz bilan bog'lanadi.\n3. Usta keladi, narx oldindan kelishiladi.\n4. Ish tugagach, to'lovni amalga oshirasiz.\n\nHozir so'rov qoldirishni boshlaymizmi?",
    plansTitle: "Tariflar:",
    plansLine: "• {name} — {price}, komissiya {commission}%",
    plansFree: "bepul",
    plansNote: "Batafsil ma'lumot \"Tariflar\" bo'limida. Tarifni tanlashda yordam kerakmi?",
    servicesTitle: "Biz quyidagi xizmatlarni taklif qilamiz:",
    servicesLine: "• {name} — {price} so'mdan",
    servicesNote: "Narxlar boshlang'ich — aniq summa usta bilan kelishiladi. Qaysi xizmat kerak?",
    mastersTitle: "Platformada {active} ta faol usta bor. Eng yuqori reytingli ustalar:",
    masterLine: "{i}. {name} — {spec}, {district}, {rating}★ ({jobs} buyurtma)",
    mastersNote: "Qaysi tumanda va qanday xizmat kerakligini ayting — mos ustani topaman.",
    mastersNone: "Hozircha ustalar ro'yxati mavjud emas.",
    safety:
      "Xavfsizlik va to'lov:\n• Barcha ustalar tekshirilgan va reyting tizimiga ega.\n• To'lov ish bajarilgandan keyin amalga oshiriladi.\n• Muammo bo'lsa, qo'llab-quvvatlash xizmati yordam beradi.\n\nSavolingiz bo'lsa, yozing.",
    contact:
      "Biz bilan bog'lanish:\n• Telefon: +998 78 200 00 00\n• Email: salom@mahallausta.uz\n• Ish vaqti: har kuni 08:00–22:00",
    coverage:
      "Toshkentning barcha tumanlarida xizmat ko'rsatamiz: Chilonzor, Yunusobod, Mirzo Ulug'bek, Yakkasaroy, Sergeli, Olmazor va boshqalar.\n\nQaysi tumanda usta kerak?",
    order:
      "Albatta, yordam beraman! So'rov formasini ochyapman — ismingiz, telefon raqamingiz va xizmat turini kiriting. Operator 15 daqiqada bog'lanadi.",
    fallback:
      "Savolingizga aniq javob topa olmadim, kechirasiz. Men usta topish, narxlar, tariflar, buyurtma berish bo'yicha yordam beraman — oddiy savollarga ham javob bera olaman.\n\nMasalan: \"Qalaysan?\", \"Santexnik qancha turadi?\" yoki \"Usta chaqir\".",
  },
  ru: {
    greeting:
      "Здравствуйте! Я AI-помощник MahallaUsta. Помогу найти мастера, узнать цены, тарифы или оформить заказ. Чем могу помочь?",
    thanks: "Пожалуйста! Если появятся вопросы — пишите, я готов помочь.",
    howAreYou:
      "У меня всё хорошо, спасибо! А как вы? Если нужен мастер или есть вопросы по услугам — я помогу.",
    whoAreYou:
      "Я AI-помощник MahallaUsta. Помогаю найти мастера, узнать цены, тарифы и оформить заказ.",
    whatCanDo:
      "Я могу помочь с:\n• услугами и ценами\n• подбором мастера и рейтингом\n• тарифами и подпиской\n• оформлением заказа\n• безопасностью и оплатой\n• контактами\n\nС чего начнём?",
    name: "Меня зовут MahallaUsta AI. Я помогу вам найти мастера.",
    goodbye: "До свидания! Если появятся вопросы — пишите, я всегда готов помочь.",
    weather:
      "К сожалению, я не знаю прогноз погоды. Но если нужен мастер — например, по кондиционеру или отоплению — я помогу.",
    time: "Сейчас {time} по времени Ташкента. Чем ещё могу помочь?",
    timeUnknown: "Не удалось определить текущее время, но я могу помочь с мастером или услугами.",
    joke:
      "Небольшая шутка: мастер починил кран. Хозяин спрашивает: \"Теперь вы знаете, откуда идёт вода?\" Мастер: \"Нет, но теперь она идёт в правильном направлении.\"",
    affirm: "Отлично! Открываю форму заявки — укажите имя, телефон и услугу. Оператор свяжется с вами в течение 15 минут.",
    how: "Работать с MahallaUsta просто:\n1. Выберите услугу (сантехника, электрика и т.д.).\n2. Оставьте заявку — оператор свяжется с вами в течение 15 минут.\n3. Мастер приедет, стоимость согласуется заранее.\n4. После выполнения работы вы производите оплату.\n\nНачнём оформление заявки?",
    plansTitle: "Тарифы:",
    plansLine: "• {name} — {price}, комиссия {commission}%",
    plansFree: "бесплатно",
    plansNote: "Подробности — в разделе «Тарифы». Нужна помощь с выбором тарифа?",
    servicesTitle: "Мы предлагаем следующие услуги:",
    servicesLine: "• {name} — от {price} сум",
    servicesNote: "Цены стартовые — точная сумма согласуется с мастером. Какая услуга нужна?",
    mastersTitle: "На платформе {active} активных мастеров. Мастера с самым высоким рейтингом:",
    masterLine: "{i}. {name} — {spec}, {district}, {rating}★ ({jobs} заказов)",
    mastersNote: "Укажите район и нужную услугу — подберу подходящего мастера.",
    mastersNone: "Список мастеров пока недоступен.",
    safety:
      "Безопасность и оплата:\n• Все мастера проверены и имеют рейтинг.\n• Оплата производится после выполнения работы.\n• При проблеме поможет служба поддержки.\n\nЕсли есть вопросы — пишите.",
    contact:
      "Связаться с нами:\n• Телефон: +998 78 200 00 00\n• Email: salom@mahallausta.uz\n• Время работы: ежедневно 08:00–22:00",
    coverage:
      "Мы работаем во всех районах Ташкента: Чиланзар, Юнусабад, Мирзо Улугбек, Яккасарай, Сергели, Алмазар и другие.\n\nВ каком районе нужен мастер?",
    order:
      "Конечно, помогу! Открываю форму заявки — укажите имя, телефон и услугу. Оператор свяжется с вами в течение 15 минут.",
    fallback:
      "Не смог найти точный ответ, извините. Я помогаю с поиском мастера, ценами, тарифами и заявками — и отвечаю на простые вопросы.\n\nНапример: «Как дела?», «Сколько стоит сантехник?» или «Вызвать мастера».",
  },
  en: {
    greeting:
      "Hello! I'm the MahallaUsta AI assistant. I can help you find a master, check prices and plans, or place a request. How can I help?",
    thanks: "You're welcome! If you have more questions, just write — I'm happy to help.",
    howAreYou:
      "I'm doing well, thanks! How are you? If you need a master or have questions about our services, I'm here to help.",
    whoAreYou:
      "I'm the MahallaUsta AI assistant. I help you find a master, check prices and plans, and place a request.",
    whatCanDo:
      "I can help with:\n• services and prices\n• choosing a master and ratings\n• plans and subscriptions\n• placing a request\n• safety and payment\n• contact details\n\nWhere shall we start?",
    name: "My name is MahallaUsta AI. I'll help you find a master.",
    goodbye: "Goodbye! If you have more questions, just write — I'm always happy to help.",
    weather:
      "Unfortunately, I don't know the weather forecast. But if you need a master — for air conditioning or heating, for example — I can help.",
    time: "It's {time} in Tashkent right now. How else can I help?",
    timeUnknown: "I couldn't determine the current time, but I can still help with a master or our services.",
    joke:
      "A small joke: a plumber fixed a tap. The owner asks, \"Do you know where the water comes from now?\" The plumber says, \"No, but it's going in the right direction now.\"",
    affirm: "Great! Opening the request form — enter your name, phone and service. An operator will contact you within 15 minutes.",
    how: "Using MahallaUsta is easy:\n1. Choose a service (plumbing, electrical, etc.).\n2. Leave a request — an operator will contact you within 15 minutes.\n3. The master arrives and the price is agreed in advance.\n4. You pay after the work is done.\n\nShall we start a request?",
    plansTitle: "Plans:",
    plansLine: "• {name} — {price}, {commission}% commission",
    plansFree: "free",
    plansNote: "See the Plans section for details. Need help choosing a plan?",
    servicesTitle: "We offer the following services:",
    servicesLine: "• {name} — from {price} UZS",
    servicesNote: "Prices are starting points — the exact amount is agreed with the master. Which service do you need?",
    mastersTitle: "There are {active} active masters on the platform. Top-rated masters:",
    masterLine: "{i}. {name} — {spec}, {district}, {rating}★ ({jobs} orders)",
    mastersNote: "Tell me your district and the service you need — I'll find a suitable master.",
    mastersNone: "The master list is not available right now.",
    safety:
      "Safety and payment:\n• All masters are verified and rated.\n• Payment is made after the work is completed.\n• Support will help if anything goes wrong.\n\nIf you have questions, just write.",
    contact:
      "Contact us:\n• Phone: +998 78 200 00 00\n• Email: salom@mahallausta.uz\n• Hours: daily 08:00–22:00",
    coverage:
      "We serve all districts of Tashkent: Chilanzar, Yunusabad, Mirzo Ulugbek, Yakkasaray, Sergeli, Almazar and others.\n\nWhich district do you need a master in?",
    order:
      "Of course, happy to help! Opening the request form — enter your name, phone and service. An operator will contact you within 15 minutes.",
    fallback:
      "I couldn't find an exact answer, sorry. I help with finding a master, prices, plans and requests — and I'm happy to answer simple questions too.\n\nFor example: \"How are you?\", \"How much does a plumber cost?\" or \"Call a master\".",
  },
};

const INTENTS = [
  /* Kichik suhbat (small talk) — platforma mavzusidan tashqari savollar */
  {
    name: "howAreYou",
    re: /(qalaysan|qalaysiz|qandaysan|qandaysiz|ishlaring (yaxshimi|qalay)|как дела|как ты|как вы|how are you|how'?s it going|how are you doing)/i,
  },
  {
    name: "whoAreYou",
    re: /(sen kimsan|siz kimsiz|sen kim|siz kim|кто ты|кто вы|who are you|what are you)/i,
  },
  {
    name: "name",
    re: /(isming|ismingiz|ismi nima|ismin nima|как тебя зовут|как вас зовут|your name|what'?s your name)/i,
  },
  {
    name: "whatCanDo",
    re: /(nima qila olasan|nima qila olasiz|nimalar qila|yordam bera olasan|imkoniyatlar|что ты умеешь|что можешь|чем можешь помочь|what can you do|what do you do|how can you help)/i,
  },
  { name: "joke", re: /(hazil|kulgi|joke|шутк|анекдот)/i },
  { name: "weather", re: /(ob-?havo|havo qanday|havo qanaqa|погода|weather)/i },
  {
    name: "time",
    re: /(soat nech|vaqt nech|vaqt qancha|hozirgi vaqt|который час|сколько времени|current time|what time)/i,
  },
  {
    name: "goodbye",
    re: /(\bxayr\b|\bhayr\b|ko'rishguncha|kurishguncha|до свидания|\bпока\b|goodbye|\bbye\b|see you)/i,
  },
  {
    name: "affirm",
    re: /^(ha+|xa+|ok(ay)?|mayli|bo'ldi|bo'ladi|kelishdik|да|хорошо|ладно|yes|yep|sure|ok)[\s!.,]*$/i,
  },

  { name: "how", re: /(qanday ishlaydi|qanday chaqir|qanday buyurtma|how does|how do i|how to (order|call)|как работает|как заказать|как вызвать)/i },
  { name: "plans", re: /(tarif|obuna|subscription|pricing|\bplans?\b|тариф|подписк|прайс)/i },
  { name: "safety", re: /(xavfsiz|to'lov|tolov|kafolat|payment|secure|safe|гарант|оплат|безопас|платеж)/i },
  { name: "contact", re: /(aloqa|telefon|raqam|contact|phone|email|связ|телефон|почт)/i },
  { name: "coverage", re: /(tuman|hudud|district|area|coverage|район|регион|где работа)/i },
  { name: "order", re: /(usta.*chaqir|chaqir.*usta|usta.*kerak|buyurtma ber|zakaz (ber|qil)|вызвать мастера|нужен мастер|заказать|оформить заказ|call a master|need a master|book a)/i },
  { name: "masters", re: /(usta|master|reyting|rating|мастер|рейтинг)/i },
  { name: "services", re: /(xizmat|narx|qancha|price|cost|service|сколько|цена|услуг)/i },
  { name: "greeting", re: /(salom|assalom|hayrli|xayrli|привет|здравств|добр|салам|\bhi\b|\bhello\b|\bhey\b|good (morning|afternoon|evening))/i },
  { name: "thanks", re: /(rahmat|tashakkur|спасибо|благодар|\bthanks?\b|thank you)/i },
];

const fmt = (value, lang) =>
  String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ");

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] === undefined ? match : String(vars[key])
  );
}

/* Toshkent vaqti (Asia/Tashkent) — serverning vaqt zonasidan qat'i nazar */
function tashkentTime(lang) {
  const locales = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };
  const options = {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  try {
    return new Intl.DateTimeFormat(locales[lang] || "en-GB", options).format(new Date());
  } catch (error) {
    try {
      return new Intl.DateTimeFormat("en-GB", options).format(new Date());
    } catch (innerError) {
      return "";
    }
  }
}

function serviceLabel(service, lang) {
  const found = SERVICES.find((item) => item.key === service);
  return found ? found[lang] || found.uz : String(service || "");
}

function detectService(text) {
  for (const service of SERVICES) {
    const alias = SERVICE_ALIASES[service.key];
    if (alias && alias.test(text)) return service.key;
  }
  return "";
}

function canonicalService(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const direct = SERVICES.find(
    (item) => [item.key, item.uz, item.ru, item.en].some((name) => name.toLowerCase() === raw.toLowerCase())
  );
  if (direct) return direct.key;

  return detectService(raw);
}

function masterSpecService(spec) {
  for (const service of SERVICES) {
    const matcher = MASTER_SPECS[service.key];
    if (matcher && matcher.test(spec)) return service.key;
  }
  return "";
}

function topMasters(db, service, district, limit = 3) {
  const masters = Array.isArray(db.masters) ? db.masters : [];

  return masters
    .filter((master) => {
      if (service && masterSpecService(master.spec) !== service) return false;
      if (district && !String(master.district || "").toLowerCase().includes(district.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.jobs || 0) - (a.jobs || 0))
    .slice(0, limit);
}

function plansData(lang) {
  const names = {
    uz: { standart: "Standart", pro: "Pro", biznes: "Biznes" },
    ru: { standart: "Стандарт", pro: "Про", biznes: "Бизнес" },
    en: { standart: "Standard", pro: "Pro", biznes: "Business" },
  }[lang];

  return ["standart", "pro", "biznes"].map((key) => ({
    key,
    name: names[key],
    monthly: PLANS[key].monthly,
    yearly: PLANS[key].yearly,
    commission: PLANS[key].commission,
  }));
}

/* ---------- Lokal (kalitsiz) javoblar ---------- */
function localReply(message, db, lang) {
  const locale = LANGS.includes(lang) ? lang : "uz";
  const dict = T[locale];
  const text = String(message || "").toLowerCase();
  const stats = db.stats || {};

  const intent = INTENTS.find((item) => item.re.test(text));

  if (!intent) return { reply: dict.fallback, action: null };

  switch (intent.name) {
    case "howAreYou":
      return { reply: dict.howAreYou, action: null };

    case "whoAreYou":
      return { reply: dict.whoAreYou, action: null };

    case "name":
      return { reply: dict.name, action: null };

    case "whatCanDo":
      return { reply: dict.whatCanDo, action: null };

    case "joke":
      return { reply: dict.joke, action: null };

    case "weather":
      return { reply: dict.weather, action: null };

    case "time": {
      const time = tashkentTime(locale);
      return { reply: time ? fill(dict.time, { time }) : dict.timeUnknown, action: null };
    }

    case "goodbye":
      return { reply: dict.goodbye, action: null };

    case "affirm": {
      const service = detectService(text);
      return { reply: dict.affirm, action: { type: "open_request", service } };
    }

    case "greeting":
      return { reply: dict.greeting, action: null };

    case "thanks":
      return { reply: dict.thanks, action: null };

    case "how":
      return { reply: dict.how, action: null };

    case "plans": {
      const unit = locale === "en" ? "UZS" : locale === "ru" ? "сум" : "so'm";
      const per = locale === "en" ? "/mo" : locale === "ru" ? "/мес" : "/oy";
      const lines = plansData(locale).map((plan) =>
        fill(dict.plansLine, {
          name: plan.name,
          price: plan.monthly ? `${fmt(plan.monthly, locale)} ${unit}${per}` : dict.plansFree,
          commission: plan.commission,
        })
      );
      return { reply: `${dict.plansTitle}\n${lines.join("\n")}\n\n${dict.plansNote}`, action: null };
    }

    case "safety":
      return { reply: dict.safety, action: null };

    case "contact":
      return { reply: dict.contact, action: null };

    case "coverage":
      return { reply: dict.coverage, action: null };

    case "order": {
      const service = detectService(text);
      return { reply: dict.order, action: { type: "open_request", service } };
    }

    case "masters": {
      const service = detectService(text);
      const list = topMasters(db, service, "");

      if (!list.length) return { reply: dict.mastersNone, action: null };

      const lines = list.map((master, index) =>
        fill(dict.masterLine, {
          i: index + 1,
          name: master.name,
          spec: master.spec,
          district: master.district,
          rating: Number(master.rating || 0).toFixed(1),
          jobs: fmt(master.jobs || 0, locale),
        })
      );

      return {
        reply: `${fill(dict.mastersTitle, { active: fmt(stats.mastersActive || 0, locale) })}\n${lines.join(
          "\n"
        )}\n\n${dict.mastersNote}`,
        action: null,
      };
    }

    case "services": {
      const lines = SERVICES.map((service) =>
        fill(dict.servicesLine, {
          name: serviceLabel(service.key, locale),
          price: fmt(ESTIMATES[service.key] || 0, locale),
        })
      );
      return { reply: `${dict.servicesTitle}\n${lines.join("\n")}\n\n${dict.servicesNote}`, action: null };
    }

    default:
      return { reply: dict.fallback, action: null };
  }
}

/* ---------- LLM (function calling) ---------- */
function systemPrompt(lang) {
  return [
    "You are MahallaUsta AI, a friendly assistant on the MahallaUsta home-services marketplace in Tashkent, Uzbekistan.",
    `Answer in the user's language. The current interface language is "${lang}", but always match the language of the user's latest message.`,
    "Be concise: at most ~120 words. Use short lines and simple bullet points. No markdown tables.",
    "You may answer light small talk (greetings, \"how are you\", who you are, jokes, thanks) briefly and warmly, then gently steer back to how you can help with home services.",
    "Use the provided tools for every fact about services, prices, masters, plans and statistics. Never invent numbers or names.",
    "Never reveal private data: client phone numbers, order details, internal revenue. For a specific order, direct the user to log in or contact support.",
    "If the user wants to order a master or leave a request, tell them you are opening the request form and append exactly [[open_request:Service]] at the very end, where Service is one of: Santexnika, Elektr ishlari, Duradgorlik, Bo'yash va suvoq, Plitka va kafel, Konditsioner — or leave it empty if unknown.",
    "Contact info: +998 78 200 00 00, salom@mahallausta.uz, daily 08:00–22:00.",
    "Do not ask for phone numbers or personal data in chat; direct users to the request form instead.",
  ].join("\n");
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_services",
      description: "List all services offered by MahallaUsta with starting prices in UZS.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "find_masters",
      description: "Find verified masters, optionally filtered by service and district.",
      parameters: {
        type: "object",
        properties: {
          service: {
            type: "string",
            enum: SERVICES.map((item) => item.key),
            description: "Canonical Uzbek service name.",
          },
          district: { type: "string", description: "Tashkent district, e.g. Chilonzor." },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_plans",
      description: "Get MahallaUsta subscription plans, prices and commission rates.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_stats",
      description: "Get public platform statistics: active masters, clients, total orders, repeat rate.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

function runTool(name, args, db, lang) {
  const stats = db.stats || {};

  switch (name) {
    case "list_services":
      return SERVICES.map((service) => ({
        service: service.key,
        name: serviceLabel(service.key, lang),
        priceFrom: ESTIMATES[service.key] || 0,
        currency: "UZS",
      }));

    case "find_masters": {
      const service = canonicalService(args && args.service);
      const district = String((args && args.district) || "").trim();
      const masters = topMasters(db, service, district, 5);

      return masters.map((master) => ({
        name: master.name,
        service: master.spec,
        district: master.district,
        rating: master.rating,
        jobs: master.jobs,
        availability: master.status,
      }));
    }

    case "get_plans":
      return plansData(lang);

    case "get_platform_stats":
      return {
        activeMasters: stats.mastersActive || 0,
        clients: stats.clientsTotal || 0,
        totalOrders: stats.ordersTotal || 0,
        repeatRate: stats.repeatRate || 0,
        freeMastersToday: stats.mastersFree || 0,
      };

    default:
      return { error: "unknown_tool" };
  }
}

async function callModel(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeout);

  try {
    const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.4,
        max_tokens: 400,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`ai_http_${response.status}: ${detail.slice(0, 160)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function llmReply(message, history, db, lang) {
  const messages = [{ role: "system", content: systemPrompt(lang) }];

  history.forEach((item) => messages.push({ role: item.role, content: item.content }));
  messages.push({ role: "user", content: message });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const data = await callModel(messages);
    const choice = data && data.choices && data.choices[0] && data.choices[0].message;
    if (!choice) throw new Error("ai_bad_response");

    if (Array.isArray(choice.tool_calls) && choice.tool_calls.length) {
      messages.push({
        role: "assistant",
        content: choice.content || "",
        tool_calls: choice.tool_calls,
      });

      choice.tool_calls.forEach((call) => {
        let args = {};
        try {
          args = JSON.parse((call.function && call.function.arguments) || "{}");
        } catch (error) {
          args = {};
        }
        const result = runTool(call.function && call.function.name, args, db, lang);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      });

      continue;
    }

    return String(choice.content || "").trim();
  }

  throw new Error("ai_tool_loop");
}

function parseAction(reply) {
  const match = reply.match(/\[\[\s*open_request\s*(?::\s*([^\]]*))?\]\]/i);
  if (!match) return { reply, action: null };

  return {
    reply: reply
      .replace(match[0], "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    action: { type: "open_request", service: canonicalService(match[1]) },
  };
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .slice(-MAX_HISTORY)
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_MESSAGE) }));
}

/**
 * Agent javobi.
 * @returns {Promise<{reply: string, action: {type: string, service: string}|null, lang: string, mode: string}>}
 */
async function respond({ message, lang, history, db }) {
  const locale = LANGS.includes(lang) ? lang : "uz";
  const text = String(message || "").slice(0, MAX_MESSAGE).trim();
  const safeHistory = normalizeHistory(history);

  let mode = "local";
  let reply = "";

  if (CONFIG.apiKey && text) {
    try {
      reply = await llmReply(text, safeHistory, db, locale);
      mode = "llm";
    } catch (error) {
      reply = "";
      mode = "fallback";
    }
  }

  if (!reply) {
    const local = localReply(text, db, locale);
    return {
      reply: local.reply,
      action: local.action,
      lang: locale,
      mode: mode === "fallback" ? "fallback" : "local",
    };
  }

  const parsed = parseAction(reply);
  return { reply: parsed.reply, action: parsed.action, lang: locale, mode };
}

module.exports = {
  respond,
  LANGS,
  MAX_MESSAGE,
  MAX_HISTORY,
  enabled: Boolean(CONFIG.apiKey),
  model: CONFIG.model,
};
