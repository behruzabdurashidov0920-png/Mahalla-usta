"use strict";

const LANGS = ["uz", "ru", "en"];

/* Uzbek service names are canonical in the data store */
const SERVICE_NAMES = {
  uz: {
    "Santexnika": "santexnika",
    "Elektr ishlari": "elektr ishlari",
    "Duradgorlik": "duradgorlik",
    "Bo'yash va suvoq": "bo'yash va suvoq",
    "Plitka va kafel": "plitka va kafel",
    "Konditsioner": "konditsioner",
  },
  ru: {
    "Santexnika": "сантехника",
    "Elektr ishlari": "электромонтаж",
    "Duradgorlik": "столярные работы",
    "Bo'yash va suvoq": "покраска и штукатурка",
    "Plitka va kafel": "плитка и кафель",
    "Konditsioner": "кондиционер",
  },
  en: {
    "Santexnika": "plumbing",
    "Elektr ishlari": "electrical work",
    "Duradgorlik": "carpentry",
    "Bo'yash va suvoq": "painting and plastering",
    "Plitka va kafel": "tiling",
    "Konditsioner": "air conditioning",
  },
};

const PATTERNS = {
  problem: {
    uz: /(muammo|shikoyat|bekor|kechik|diqqat)/,
    ru: /(проблем|жалоб|отмен|задерж|внимани)/,
    en: /(problem|issue|complaint|cancel|delay|attention)/,
  },
  orders: {
    uz: /(buyurtma|order|so'rov|statistika)/,
    ru: /(заказ|заявк|статист)/,
    en: /\b(order|orders|request|requests|statistic|statistics)\b/,
  },
  masters: {
    uz: /(usta|master|reyting)/,
    ru: /(мастер|рейтинг)/,
    en: /\b(master|masters|rating|ratings)\b/,
  },
  revenue: {
    uz: /(daromad|pul|tushum|foyda|revenue)/,
    ru: /(доход|деньг|выручк|прибыл|revenue)/,
    en: /\b(revenue|income|money|profit|earnings)\b/,
  },
  clients: {
    uz: /(mijoz|client|foydalanuvchi)/,
    ru: /(клиент|пользовател|client)/,
    en: /\b(client|clients|customer|customers|user|users)\b/,
  },
  ideas: {
    uz: /(reja|tavsiya|maslahat|nima qil|yordam ber)/,
    ru: /(план|совет|рекоменд|что дела|помог)/,
    en: /\b(plan|advice|recommend|recommendations?|tips?|what should|help me)\b/,
  },
  greeting: {
    uz: /(salom|assalom|hayrli|xayrli)/,
    ru: /(привет|здравств|добр|салам)/,
    en: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/,
  },
  thanks: {
    uz: /(rahmat|tashakkur)/,
    ru: /(спасибо|благодар)/,
    en: /\b(thanks|thank you|thx)\b/,
  },
};

const T = {
  uz: {
    problemHeader: "Diqqat talab qiladigan {n} ta holat:",
    problemCanceled: "• #{id} — bekor qilingan {service} buyurtmasi ({client}). Mijoz sababini aniqlashtirish kerak.",
    problemProgress: "• #{id} — {master} bilan jarayonda. Ustaga eslatma yuborish tavsiya etiladi.",
    problemNone: "Hozircha muammoli buyurtma qayd etilmagan — barcha buyurtmalar rejadagidek ketmoqda.",
    problemTail: "Xohlasangiz, mijozlar bilan qayta aloqa vazifasini yaratishni taklif qilaman.",
    ordersTitle: "Bugungi buyurtmalar:",
    ordersTotal: "• Jami: {n} ta",
    ordersNew: "• Yangi: {n}",
    ordersProgress: "• Jarayonda: {n}",
    ordersDone: "• Bajarildi: {n}",
    ordersCanceled: "• Bekor qilingan: {n}",
    ordersTop: "Eng ko'p so'ralgan xizmat — {service}. {n} ta yangi so'rov hali ustaga biriktirilmagan; ularni \"Buyurtmalar\" bo'limida ko'rishingiz mumkin.",
    mastersTitle: "Eng faol ustalar (buyurtma soni bo'yicha):",
    masterLine: "{i}. {name} — {jobs} buyurtma, {rating}★",
    mastersFooter: "Hozirda {active} usta faol, ulardan {free} tasi bugun bo'sh. Band ustalar: {busy}.",
    mastersNone: "yo'q",
    revenue: "Oylik daromad: {total} mln so'm (+{growth}%).\nO'rtacha buyurtma qiymati: {average} so'm.\nEng daromadli yo'nalish — {service}.",
    revenueForecast: "Prognoz: agar o'sish shu sur'atda davom etsa, oy oxirigacha {forecast} mln so'mga yetadi.",
    clients: "Platformada {total} mijoz ro'yxatdan o'tgan (+{growth}% o'sish).\nEng faol mijoz — {top}.\nQaytib kelish darajasi: {rate}%.\n\nBugun {new} ta yangi mijoz birinchi buyurtmasini berdi.",
    clientsTop: "{name} ({orders} buyurtma)",
    clientsNoTop: "hali yo'q",
    ideasTitle: "Bugungi 3 ta tavsiya:",
    ideas1: "1. {n} ta biriktirilmagan buyurtmani ustalarga taqsimlang — kutish vaqti qisqaradi.",
    ideas2: "2. Jarayondagi buyurtmalar bo'yicha ustalarga eslatma yuboring — kechikishlar kamayadi.",
    ideas3: "3. 18:00–21:00 oralig'ida santexnika ustalarini ko'proq onlayn qiling — talab eng yuqori.",
    greeting: "Assalomu alaykum! Bugun {orders} ta buyurtma qabul qilindi, {done} tasi allaqachon bajarilgan. Daromad o'tgan oyga nisbatan {growth}% yuqori.\n\nNima bilan yordam bera olaman?",
    thanks: "Arziydi! Yana savolingiz bo'lsa, yozing — yordam berishga tayyorman.",
    fallback: "Savolingizni tushundim. Men quyidagilar bo'yicha yordam bera olaman:\n• buyurtmalar holati va statistikasi\n• ustalar reytingi va bandligi\n• mijozlar faolligi\n• daromad va prognozlar\n• muammoli buyurtmalar tahlili\n\nMasalan: \"Bugungi buyurtmalar qanday?\" deb so'rang.",
    hello: "Assalomu alaykum! Nima bilan yordam bera olaman?",
  },
  ru: {
    problemHeader: "Требуют внимания {n} случая:",
    problemCanceled: "• #{id} — отменённый заказ «{service}» ({client}). Нужно уточнить причину у клиента.",
    problemProgress: "• #{id} — в работе у {master}. Рекомендуется напомнить мастеру.",
    problemNone: "Проблемных заказов пока нет — все заказы идут по плану.",
    problemTail: "При желании могу создать задачу на повторную связь с клиентами.",
    ordersTitle: "Заказы за сегодня:",
    ordersTotal: "• Всего: {n}",
    ordersNew: "• Новые: {n}",
    ordersProgress: "• В работе: {n}",
    ordersDone: "• Выполнено: {n}",
    ordersCanceled: "• Отменено: {n}",
    ordersTop: "Самая востребованная услуга — {service}. {n} новых заявок ещё не назначены мастеру; их можно увидеть в разделе «Заказы».",
    mastersTitle: "Самые активные мастера (по числу заказов):",
    masterLine: "{i}. {name} — {jobs} заказов, {rating}★",
    mastersFooter: "Сейчас активны {active} мастеров, {free} из них свободны сегодня. Занятые мастера: {busy}.",
    mastersNone: "нет",
    revenue: "Доход за месяц: {total} млн сум (+{growth}%).\nСредняя стоимость заказа: {average} сум.\nСамое доходное направление — {service}.",
    revenueForecast: "Прогноз: при сохранении темпа к концу месяца доход достигнет {forecast} млн сум.",
    clients: "На платформе зарегистрировано {total} клиентов (+{growth}% роста).\nСамый активный клиент — {top}.\nДоля повторных заказов: {rate}%.\n\nСегодня {new} новых клиентов оформили первый заказ.",
    clientsTop: "{name} ({orders} заказов)",
    clientsNoTop: "пока нет",
    ideasTitle: "3 рекомендации на сегодня:",
    ideas1: "1. Распределите {n} неназначенных заказов между мастерами — время ожидания сократится.",
    ideas2: "2. Напомните мастерам о заказах в работе — задержек станет меньше.",
    ideas3: "3. С 18:00 до 21:00 держите больше сантехников онлайн — спрос максимальный.",
    greeting: "Здравствуйте! Сегодня принято {orders} заказов, {done} уже выполнены. Доход на {growth}% выше, чем в прошлом месяце.\n\nЧем могу помочь?",
    thanks: "Пожалуйста! Если появятся вопросы — пишите, я готов помочь.",
    fallback: "Я понял вопрос. Могу помочь по темам:\n• статус и статистика заказов\n• рейтинг и занятость мастеров\n• активность клиентов\n• доход и прогнозы\n• анализ проблемных заказов\n\nНапример: «Как дела с заказами сегодня?»",
    hello: "Здравствуйте! Чем могу помочь?",
  },
  en: {
    problemHeader: "{n} cases need attention:",
    problemCanceled: "• #{id} — canceled {service} order ({client}). The client's reason should be clarified.",
    problemProgress: "• #{id} — in progress with {master}. A reminder to the master is recommended.",
    problemNone: "No problem orders recorded yet — everything is on track.",
    problemTail: "If you like, I can create a follow-up task for the clients.",
    ordersTitle: "Today's orders:",
    ordersTotal: "• Total: {n}",
    ordersNew: "• New: {n}",
    ordersProgress: "• In progress: {n}",
    ordersDone: "• Done: {n}",
    ordersCanceled: "• Canceled: {n}",
    ordersTop: "Most requested service — {service}. {n} new requests are not assigned to a master yet; see them in the Orders section.",
    mastersTitle: "Most active masters (by order count):",
    masterLine: "{i}. {name} — {jobs} orders, {rating}★",
    mastersFooter: "There are {active} active masters; {free} are free today. Busy masters: {busy}.",
    mastersNone: "none",
    revenue: "Monthly revenue: {total}M UZS (+{growth}%).\nAverage order value: {average} UZS.\nMost profitable service — {service}.",
    revenueForecast: "Forecast: at this pace revenue will reach {forecast}M UZS by the end of the month.",
    clients: "{total} clients are registered on the platform (+{growth}% growth).\nMost active client — {top}.\nRepeat rate: {rate}%.\n\nToday {new} new clients placed their first order.",
    clientsTop: "{name} ({orders} orders)",
    clientsNoTop: "none yet",
    ideasTitle: "3 tips for today:",
    ideas1: "1. Assign the {n} unassigned orders to masters — waiting time will drop.",
    ideas2: "2. Remind masters about orders in progress — fewer delays.",
    ideas3: "3. Keep more plumbers online between 18:00 and 21:00 — demand peaks then.",
    greeting: "Hello! {orders} orders were received today and {done} are already completed. Revenue is {growth}% higher than last month.\n\nHow can I help?",
    thanks: "You're welcome! If you have more questions, just write — I'm happy to help.",
    fallback: "I understood your question. I can help with:\n• order status and statistics\n• master ratings and availability\n• client activity\n• revenue and forecasts\n• problem order analysis\n\nFor example: \"How are today's orders?\"",
    hello: "Hello! How can I help?",
  },
};

const fmt = (n, lang) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ");
const mln = (n) => (n / 1e6).toFixed(1);

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] === undefined ? match : String(vars[key])
  );
}

function serviceName(value, lang) {
  const map = SERVICE_NAMES[lang] || SERVICE_NAMES.uz;
  return map[value] || String(value || "").toLowerCase();
}

function topService(orders, byAmount) {
  const totals = new Map();

  for (const order of orders) {
    const value = byAmount ? order.amount : 1;
    totals.set(order.service, (totals.get(order.service) || 0) + value);
  }

  let best = null;
  for (const [service, value] of totals) {
    if (!best || value > best.value) best = { service, value };
  }
  return best;
}

function reply(input, db, lang) {
  const locale = LANGS.includes(lang) ? lang : "uz";
  const dict = T[locale];
  const intent = {};
  for (const [name, set] of Object.entries(PATTERNS)) {
    intent[name] = new RegExp(`${set.uz.source}|${set.ru.source}|${set.en.source}`, "i");
  }
  const patterns = (name) => intent[name];
  const text = String(input || "").toLowerCase();
  const stats = db.stats;
  const orders = db.orders;

  if (patterns("problem").test(text)) {
    const canceled = orders.filter((order) => order.status === "canceled").slice(0, 2);
    const progress = orders.filter((order) => order.status === "progress").slice(0, 2);
    const lines = [];

    canceled.forEach((order) =>
      lines.push(
        fill(dict.problemCanceled, {
          id: order.id,
          service: serviceName(order.service, locale),
          client: order.client,
        })
      )
    );
    progress.forEach((order) =>
      lines.push(fill(dict.problemProgress, { id: order.id, master: order.master }))
    );

    if (!lines.length) return dict.problemNone;

    return `${fill(dict.problemHeader, { n: lines.length })}\n${lines.join(
      "\n"
    )}\n\n${dict.problemTail}`;
  }

  if (patterns("orders").test(text)) {
    const top = topService(orders, false);
    return [
      dict.ordersTitle,
      fill(dict.ordersTotal, { n: fmt(stats.ordersToday, locale) }),
      fill(dict.ordersNew, { n: fmt(stats.newToday, locale) }),
      fill(dict.ordersProgress, { n: fmt(stats.progressToday, locale) }),
      fill(dict.ordersDone, { n: fmt(stats.doneToday, locale) }),
      fill(dict.ordersCanceled, { n: fmt(stats.canceledToday, locale) }),
      "",
      fill(dict.ordersTop, {
        service: top ? serviceName(top.service, locale) : serviceName("Santexnika", locale),
        n: fmt(stats.newToday, locale),
      }),
    ].join("\n");
  }

  if (patterns("masters").test(text)) {
    const top = [...db.masters].sort((a, b) => b.jobs - a.jobs).slice(0, 3);
    const list = top
      .map((m, index) =>
        fill(dict.masterLine, {
          i: index + 1,
          name: m.name,
          jobs: fmt(m.jobs, locale),
          rating: m.rating.toFixed(1),
        })
      )
      .join("\n");
    const busy = db.masters.filter((m) => m.status === "busy").map((m) => m.name);

    return `${dict.mastersTitle}\n${list}\n\n${fill(dict.mastersFooter, {
      active: fmt(stats.mastersActive, locale),
      free: stats.mastersFree,
      busy: busy.length ? busy.join(", ") : dict.mastersNone,
    })}`;
  }

  if (patterns("revenue").test(text)) {
    const total = orders.reduce((sum, order) => sum + order.amount, 0);
    const average = orders.length ? Math.round(total / orders.length) : 0;
    const top = topService(orders, true);
    const forecast = stats.revenue * (1 + stats.revenueGrowth / 100);

    return `${fill(dict.revenue, {
      total: mln(stats.revenue),
      growth: stats.revenueGrowth,
      average: fmt(average, locale),
      service: top ? serviceName(top.service, locale) : serviceName("Santexnika", locale),
    })}\n\n${fill(dict.revenueForecast, { forecast: mln(forecast) })}`;
  }

  if (patterns("clients").test(text)) {
    const topClient = [...db.clients].sort((a, b) => b.orders - a.orders)[0];

    return fill(dict.clients, {
      total: fmt(stats.clientsTotal, locale),
      growth: stats.clientsGrowth,
      top: topClient
        ? fill(dict.clientsTop, { name: topClient.name, orders: topClient.orders })
        : dict.clientsNoTop,
      rate: stats.repeatRate,
      new: stats.newClientsToday,
    });
  }

  if (patterns("ideas").test(text)) {
    return [
      dict.ideasTitle,
      fill(dict.ideas1, { n: fmt(stats.newToday, locale) }),
      dict.ideas2,
      dict.ideas3,
    ].join("\n");
  }

  if (patterns("greeting").test(text)) {
    return fill(dict.greeting, {
      orders: fmt(stats.ordersToday, locale),
      done: fmt(stats.doneToday, locale),
      growth: stats.revenueGrowth,
    });
  }

  if (patterns("thanks").test(text)) return dict.thanks;

  return dict.fallback;
}

module.exports = { reply, LANGS };
