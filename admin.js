// MahallaUsta — admin panel (server data)

(async function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);

  const formatPrice = (n) =>
    window.MuI18n
      ? window.MuI18n.formatNumber(n)
      : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const initials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const toast = $("#admin-toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    if (response.status === 401) {
      window.location.replace("login.html");
      throw new Error("unauthorized");
    }

    if (!response.ok) throw new Error(`http_${response.status}`);
    return response.json();
  }

  /* ---------- Data value localization ---------- */
  const ENUM_KEYS = {
    service: {
      Santexnika: "enum.service.plumbing",
      "Elektr ishlari": "enum.service.electrical",
      Duradgorlik: "enum.service.carpentry",
      "Bo'yash va suvoq": "enum.service.painting",
      "Plitka va kafel": "enum.service.tiling",
      Konditsioner: "enum.service.aircon",
    },
    spec: {
      Santexnik: "enum.spec.plumber",
      "Bo'yoqchi": "enum.spec.painter",
      Elektrik: "enum.spec.electrician",
      Duradgor: "enum.spec.carpenter",
      "Konditsioner ustasi": "enum.spec.aircon",
    },
    district: {
      Chilonzor: "enum.district.chilonzor",
      Yunusobod: "enum.district.yunusobod",
      "Mirzo Ulug'bek": "enum.district.mirzoUlugbek",
      Sergeli: "enum.district.sergeli",
      Yakkasaroy: "enum.district.yakkasaroy",
    },
  };

  function localizeEnum(type, value) {
    const key = ENUM_KEYS[type][value];
    return key ? t(key) : value;
  }

  /* ---------- Offline demo data ---------- */
  const DEMO_ORDERS = [
    { id: "MU-1048", client: "Nilufar Rahimova", service: "Santexnika", master: "Aziz Karimov", amount: 180000, status: "done", time: "10:24" },
    { id: "MU-1047", client: "Jasur Tursunov", service: "Elektr ishlari", master: "Sardor Toshmatov", amount: 240000, status: "progress", time: "09:58" },
    { id: "MU-1046", client: "Malika Karimova", service: "Bo'yash va suvoq", master: "Dilnoza Yusupova", amount: 950000, status: "new", time: "09:31" },
    { id: "MU-1045", client: "Olim Rasulov", service: "Duradgorlik", master: "Rustam Qodirov", amount: 420000, status: "progress", time: "09:05" },
    { id: "MU-1044", client: "Shahnoza Mirzayeva", service: "Konditsioner", master: "Bekzod Umarov", amount: 300000, status: "done", time: "08:47" },
    { id: "MU-1043", client: "Anvar Saidov", service: "Plitka va kafel", master: "Farrux Ismoilov", amount: 1200000, status: "new", time: "08:15" },
    { id: "MU-1042", client: "Gulnora Karimova", service: "Santexnika", master: "Aziz Karimov", amount: 150000, status: "canceled", time: "07:52" },
    { id: "MU-1041", client: "Bobur Mahmudov", service: "Elektr ishlari", master: "Sardor Toshmatov", amount: 95000, status: "done", time: "07:20" },
    { id: "MU-1040", client: "Zulfiya Rahimova", service: "Bo'yash va suvoq", master: "Dilnoza Yusupova", amount: 680000, status: "done", time: "Kecha" },
    { id: "MU-1039", client: "Timur Aliyev", service: "Konditsioner", master: "Bekzod Umarov", amount: 260000, status: "progress", time: "Kecha" },
  ];

  const DEMO_MASTERS = [
    { name: "Aziz Karimov", spec: "Santexnik", district: "Chilonzor", rating: 4.9, jobs: 128, status: "active", plan: "pro" },
    { name: "Dilnoza Yusupova", spec: "Bo'yoqchi", district: "Yunusobod", rating: 5.0, jobs: 96, status: "active", plan: "pro" },
    { name: "Sardor Toshmatov", spec: "Elektrik", district: "Mirzo Ulug'bek", rating: 4.8, jobs: 211, status: "busy", plan: "biznes" },
    { name: "Rustam Qodirov", spec: "Duradgor", district: "Sergeli", rating: 4.7, jobs: 74, status: "active", plan: "standart" },
    { name: "Bekzod Umarov", spec: "Konditsioner ustasi", district: "Yakkasaroy", rating: 4.9, jobs: 163, status: "active", plan: "pro" },
  ];

  const DEMO_SUBSCRIPTIONS = [
    { id: "SUB-241", name: "Aziz Karimov", phone: "+998 90 123 45 67", plan: "pro", billing: "yearly", price: 79000, district: "Chilonzor", status: "active", time: "09:41", date: "04.11.2026" },
    { id: "SUB-240", name: "Bekzod Umarov", phone: "+998 90 987 65 43", plan: "pro", billing: "monthly", price: 99000, district: "Yakkasaroy", status: "active", time: "08:26", date: "03.11.2026" },
    { id: "SUB-239", name: "Sardor Toshmatov", phone: "+998 91 234 56 78", plan: "biznes", billing: "monthly", price: 249000, district: "Mirzo Ulug'bek", status: "active", time: "19:05", date: "02.11.2026" },
    { id: "SUB-238", name: "Dilnoza Yusupova", phone: "+998 97 700 88 21", plan: "pro", billing: "monthly", price: 99000, district: "Yunusobod", status: "trial", time: "12:33", date: "01.11.2026" },
    { id: "SUB-237", name: "Rustam Qodirov", phone: "+998 88 909 11 22", plan: "standart", billing: "monthly", price: 0, district: "Sergeli", status: "canceled", time: "11:12", date: "29.10.2026" },
  ];

  const DEMO_PLANS = {
    standart: { monthly: 0, yearly: 0, commission: 12 },
    pro: { monthly: 99000, yearly: 79000, commission: 8 },
    biznes: { monthly: 249000, yearly: 199000, commission: 5 },
  };

  const DEMO_CLIENTS = [
    { name: "Nilufar Rahimova", phone: "+998 90 123 45 67", orders: 12, last: "27.10.2026", status: "active" },
    { name: "Jasur Tursunov", phone: "+998 93 555 12 34", orders: 8, last: "26.10.2026", status: "active" },
    { name: "Malika Karimova", phone: "+998 97 700 88 21", orders: 5, last: "25.10.2026", status: "active" },
    { name: "Olim Rasulov", phone: "+998 91 234 56 78", orders: 3, last: "24.10.2026", status: "inactive" },
    { name: "Shahnoza Mirzayeva", phone: "+998 88 909 11 22", orders: 9, last: "23.10.2026", status: "active" },
    { name: "Anvar Saidov", phone: "+998 90 987 65 43", orders: 2, last: "21.10.2026", status: "active" },
  ];

  const DEMO_STATS = {
    ordersTotal: 1248,
    ordersToday: 128,
    newToday: 12,
    progressToday: 8,
    doneToday: 104,
    canceledToday: 4,
    ordersGrowth: 12.4,
    mastersActive: 342,
    mastersFree: 18,
    mastersGrowth: 4.8,
    clientsTotal: 5670,
    clientsGrowth: 8.1,
    newClientsToday: 3,
    revenue: 128400000,
    revenueGrowth: 15.2,
    repeatRate: 64,
    proSubscribers: 96,
    proGrowth: 18.4,
    bizSubscribers: 14,
    planMrr: 12990000,
    planConversion: 3.4,
  };

  function readLocalSession() {
    try {
      const raw = window.localStorage.getItem("mu_admin") || window.sessionStorage.getItem("mu_admin");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  /* ---------- Session & data ---------- */
  let user;
  let orders = [];
  let masters = [];
  let clients = [];
  let subscriptions = [];
  let stats = {};
  let offlineMode = false;

  try {
    const me = await api("/api/auth/me");
    user = me.user;

    const data = await api("/api/data");
    ({ orders, masters, clients, stats } = data);
    subscriptions = data.subscriptions || [];
  } catch (error) {
    if (error.message === "unauthorized") return;

    const session = readLocalSession();
    if (!session) {
      window.location.replace("login.html");
      return;
    }

    offlineMode = true;
    user = {
      name: session.name || "Bekzod Admin",
      email: session.email || "admin@mahallausta.uz",
      phone: "998901234567",
      role: session.role || "Administrator",
    };
    orders = DEMO_ORDERS;
    masters = DEMO_MASTERS;
    clients = DEMO_CLIENTS;
    subscriptions = DEMO_SUBSCRIPTIONS;
    stats = DEMO_STATS;
    showToast(t("admin.toast.demo"));
  }

  /* ---------- User info ---------- */
  const firstName = (user.name || "Admin").split(" ")[0];
  const avatarText = initials(user.name || "Admin");

  $(".side-user .user-avatar").textContent = avatarText;
  $(".side-user .user-info strong").textContent = user.name;

  const topAvatar = $(".top-avatar");
  topAvatar.textContent = avatarText;
  topAvatar.title = user.name;

  const profileName = $(".profile-card strong");
  if (profileName) profileName.textContent = user.name;

  const profileEmail = $(".profile-meta div strong");
  if (profileEmail) profileEmail.textContent = user.email;

  /* ---------- Dashboard rendering ---------- */
  const kpi = (name) => document.querySelector(`[data-kpi="${name}"]`);
  const now = new Date();

  function renderStats() {
    if (kpi("orders")) kpi("orders").textContent = formatPrice(stats.ordersTotal);
    if (kpi("masters")) kpi("masters").textContent = formatPrice(stats.mastersActive);
    if (kpi("clients")) kpi("clients").textContent = formatPrice(stats.clientsTotal);
    if (kpi("revenue")) {
      kpi("revenue").innerHTML = `${(stats.revenue / 1e6).toFixed(1)} <small>${t("common.million")}</small>`;
    }

    const newCount = $("#new-orders-count");
    if (newCount) newCount.textContent = formatPrice(stats.newToday);

    const welcomeText = $("#welcome-text");
    if (welcomeText) {
      welcomeText.textContent = t("admin.welcomeText", {
        orders: formatPrice(stats.ordersToday),
        new: formatPrice(stats.newToday),
      });
    }

    const chartTotal = $("#chart-total");
    if (chartTotal) chartTotal.textContent = t("admin.chart.total", { n: formatPrice(812) });

    const donutTotal = $("#donut-total");
    if (donutTotal) donutTotal.textContent = formatPrice(stats.ordersTotal);

    const mastersChip = $("#masters-chip");
    if (mastersChip) mastersChip.textContent = t("admin.masters.chip", { n: formatPrice(stats.mastersActive) });

    const clientsChip = $("#clients-chip");
    if (clientsChip) clientsChip.textContent = t("admin.clients.chip", { n: formatPrice(stats.clientsTotal) });

    const planKpi = (name) => document.querySelector(`[data-plan-kpi="${name}"]`);
    if (planKpi("pro")) planKpi("pro").textContent = formatPrice(stats.proSubscribers);
    if (planKpi("biznes")) planKpi("biznes").textContent = formatPrice(stats.bizSubscribers);
    if (planKpi("mrr")) {
      planKpi("mrr").innerHTML = `${(stats.planMrr / 1e6).toFixed(1)} <small>${t("common.million")}</small>`;
    }
    if (planKpi("conv")) planKpi("conv").textContent = `${stats.planConversion}%`;

    const proGrowth = $("#plan-pro-growth");
    if (proGrowth) proGrowth.textContent = `+${stats.proGrowth}%`;

    const plansCount = $("#plans-count");
    if (plansCount) plansCount.textContent = formatPrice(subscriptions.length);

    const dateLabel = $("#today-label");
    if (dateLabel) {
      dateLabel.textContent = t("admin.date", {
        day: now.getDate(),
        month: t(`month.${now.getMonth() + 1}`),
      });
    }

    const hour = now.getHours();
    const greetKey = hour < 6 ? "greetNight" : hour < 12 ? "greetMorning" : hour < 18 ? "greetDay" : "greetEvening";
    const greetingEl = $(".welcome-copy h2");
    if (greetingEl) greetingEl.textContent = t(`admin.${greetKey}`, { name: firstName });
  }

  /* ---------- Tables ---------- */
  function orderRow(order) {
    const time = order.time === "Kecha" ? t("common.yesterday") : order.time;

    return `
      <tr>
        <td class="cell-id">#${order.id}</td>
        <td>
          <span class="cell-user">
            <span class="mini-avatar">${initials(order.client)}</span>
            <span class="cell-strong">${order.client}</span>
          </span>
        </td>
        <td>${localizeEnum("service", order.service)}</td>
        <td>${order.master}</td>
        <td class="cell-amount">${formatPrice(order.amount)} <span class="cell-muted">${t("common.currency")}</span></td>
        <td><span class="status st-${order.status}">${t(`status.${order.status}`)}</span></td>
        <td>${time}</td>
      </tr>`;
  }

  function renderOrders(list, tbody) {
    tbody.innerHTML = list.map(orderRow).join("");
  }

  function subscriptionRow(sub) {
    const statusClass =
      sub.status === "active" ? "st-done" : sub.status === "trial" ? "st-progress" : "st-canceled";
    const plan = sub.plan || "standart";

    return `
      <tr>
        <td class="cell-id">#${sub.id}</td>
        <td>
          <span class="cell-user">
            <span class="mini-avatar">${initials(sub.name)}</span>
            <span class="cell-strong">${sub.name}</span>
          </span>
        </td>
        <td><span class="plan-badge plan-badge--${plan}">${t(`plan.${plan}.name`)}</span></td>
        <td>${t(sub.billing === "yearly" ? "pricing.yearly" : "pricing.monthly")}</td>
        <td class="cell-amount">${formatPrice(sub.price)} <span class="cell-muted">${t("common.currency")}</span></td>
        <td>${sub.date}</td>
        <td><span class="status ${statusClass}">${t(`status.${sub.status}`)}</span></td>
      </tr>`;
  }

  function renderPlans() {
    const body = $("#plans-body");
    if (!body) return;

    const list =
      currentPlanFilter === "all"
        ? subscriptions
        : subscriptions.filter((sub) => sub.plan === currentPlanFilter);

    body.innerHTML = list.length
      ? list.map(subscriptionRow).join("")
      : `<tr><td class="cell-empty" colspan="7">${t("admin.plans.empty")}</td></tr>`;
  }

  function renderTables() {
    renderOrders(orders.slice(0, 5), $("#recent-orders"));

    const ordersBody = $("#orders-body");
    renderOrders(currentFilter === "all" ? orders : orders.filter((o) => o.status === currentFilter), ordersBody);

    $("#masters-body").innerHTML = masters
      .map(
        (m) => `
      <tr>
        <td>
          <span class="cell-user">
            <span class="mini-avatar">${initials(m.name)}</span>
            <span class="cell-strong">${m.name}</span>
          </span>
        </td>
        <td>${localizeEnum("spec", m.spec)}</td>
        <td>${localizeEnum("district", m.district)}</td>
        <td class="cell-rating">★ ${m.rating.toFixed(1)}</td>
        <td>${formatPrice(m.jobs)}</td>
        <td><span class="plan-badge plan-badge--${m.plan || "standart"}">${t(`plan.${m.plan || "standart"}.name`)}</span></td>
        <td><span class="status ${m.status === "active" ? "st-done" : "st-progress"}">${t(`status.${m.status}`)}</span></td>
      </tr>`
      )
      .join("");

    $("#clients-body").innerHTML = clients
      .map(
        (c) => `
      <tr>
        <td>
          <span class="cell-user">
            <span class="mini-avatar">${initials(c.name)}</span>
            <span class="cell-strong">${c.name}</span>
          </span>
        </td>
        <td>${c.phone}</td>
        <td>${formatPrice(c.orders)}</td>
        <td>${c.last}</td>
        <td><span class="status ${c.status === "active" ? "st-done" : "st-canceled"}">${t(`status.${c.status}`)}</span></td>
      </tr>`
      )
      .join("");
  }

  function renderAll() {
    renderStats();
    renderTables();
    renderPlans();
  }

  /* ---------- Order filters ---------- */
  let currentFilter = "all";
  let currentPlanFilter = "all";
  const filterChips = $$("#order-filters .chip");
  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.dataset.filter;
      const ordersBody = $("#orders-body");
      renderOrders(
        currentFilter === "all" ? orders : orders.filter((o) => o.status === currentFilter),
        ordersBody
      );
    });
  });

  /* ---------- Plan filters ---------- */
  const planFilterChips = $$("#plan-filters .chip");
  planFilterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      planFilterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentPlanFilter = chip.dataset.planFilter;
      renderPlans();
    });
  });

  /* ---------- View switching ---------- */
  const viewMeta = {
    dashboard: { title: "admin.view.dashboardTitle", sub: "admin.view.dashboardSub" },
    orders: { title: "admin.view.ordersTitle", sub: "admin.view.ordersSub" },
    masters: { title: "admin.view.mastersTitle", sub: "admin.view.mastersSub" },
    clients: { title: "admin.view.clientsTitle", sub: "admin.view.clientsSub" },
    plans: { title: "admin.view.plansTitle", sub: "admin.view.plansSub" },
    ai: { title: "admin.view.aiTitle", sub: "admin.view.aiSub" },
    settings: { title: "admin.view.settingsTitle", sub: "admin.view.settingsSub" },
  };

  const sidebar = $("#sidebar");
  const overlay = $("#sidebar-overlay");
  const menuBtn = $("#menu-btn");
  let currentView = "dashboard";

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function switchView(view) {
    const meta = viewMeta[view] || viewMeta.dashboard;
    currentView = viewMeta[view] ? view : "dashboard";

    $$(".view").forEach((section) => section.classList.toggle("active", section.id === `view-${view}`));
    $$(".side-link[data-view]").forEach((link) => link.classList.toggle("active", link.dataset.view === view));

    $("#page-title").textContent = t(meta.title);
    $("#page-sub").textContent = t(meta.sub);

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", `#${currentView}`);
    }

    closeSidebar();

    if (view === "ai") scrollChatToBottom();
  }

  $$("[data-view]").forEach((link) => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });

  $$("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.goto));
  });

  menuBtn.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    overlay.classList.toggle("show", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  renderAll();

  const initialView = window.location.hash.replace("#", "");
  switchView(viewMeta[initialView] ? initialView : "dashboard");

  /* ---------- Logout ---------- */
  async function logout() {
    if (!offlineMode) {
      try {
        await api("/api/auth/logout", { method: "POST" });
      } catch (error) {
        /* server bo'lmasa ham login sahifasiga qaytamiz */
      }
    }

    try {
      window.localStorage.removeItem("mu_admin");
      window.sessionStorage.removeItem("mu_admin");
    } catch (error) {
      /* ignore */
    }

    window.location.href = "login.html";
  }

  $("#logout").addEventListener("click", logout);
  const logoutSecondary = $("#logout-secondary");
  if (logoutSecondary) logoutSecondary.addEventListener("click", logout);

  /* ---------- Settings ---------- */
  const saveBtn = $("#settings-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => showToast(t("admin.toast.saved")));
  }

  /* ---------- Theme ---------- */
  const themeBtn = $("#theme-toggle");

  const currentTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const themeLabel = (mode) => t(mode === "light" ? "admin.theme.light" : "admin.theme.dark");

  function syncThemeLabel() {
    if (!themeBtn) return;
    const mode = currentTheme();
    const label = `${t("admin.theme.toggle")}: ${themeLabel(mode)}`;
    themeBtn.setAttribute("aria-label", label);
    themeBtn.title = label;
    themeBtn.setAttribute("aria-pressed", String(mode === "light"));
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = currentTheme() === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;

      try {
        window.localStorage.setItem("mu_theme", next);
      } catch (error) {
        /* storage unavailable */
      }

      syncThemeLabel();
      showToast(t("admin.theme.changed", { mode: themeLabel(next) }));
    });
  }

  syncThemeLabel();

  /* ============================================================
     AI chat
     ============================================================ */
  const chatLog = $("#chat-log");
  const chatForm = $("#chat-form");
  const chatText = $("#chat-text");
  const chatClear = $("#chat-clear");

  const sparkSvg = `<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3Z"/><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"/></svg>`;

  function chatIntro() {
    return t("admin.ai.intro", { name: firstName });
  }

  function scrollChatToBottom() {
    const log = document.getElementById("chat-log");
    if (log) log.scrollTop = log.scrollHeight;
  }

  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `msg ${role}`;

    if (role === "ai") {
      msg.innerHTML = `<span class="msg-avatar">${sparkSvg}</span><div class="bubble"></div>`;
      msg.querySelector(".bubble").textContent = text;
    } else {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = text;
      msg.appendChild(bubble);
    }

    chatLog.appendChild(msg);
    scrollChatToBottom();
    return msg;
  }

  function addTyping() {
    const msg = document.createElement("div");
    msg.className = "msg ai typing";
    msg.innerHTML = `<span class="msg-avatar">${sparkSvg}</span><div class="bubble"><span></span><span></span><span></span></div>`;
    chatLog.appendChild(msg);
    scrollChatToBottom();
    return msg;
  }

  function resetChat() {
    chatLog.innerHTML = "";
    addMessage("ai", chatIntro());
  }

  function topService(list, byAmount) {
    const totals = new Map();

    for (const order of list) {
      const value = byAmount ? order.amount : 1;
      totals.set(order.service, (totals.get(order.service) || 0) + value);
    }

    let best = null;
    for (const [service, value] of totals) {
      if (!best || value > best.value) best = { service, value };
    }
    return best;
  }

  function demoReply(input) {
    const text = input.toLowerCase();
    const s = stats;
    const r = (key, vars) => t(`admin.aiReply.${key}`, vars);

    if (/(muammo|shikoyat|bekor|kechik|diqqat|problem|issue|cancel|delay|жалоб|проблем|отмен|задерж)/.test(text)) {
      const canceled = orders.filter((o) => o.status === "canceled").slice(0, 2);
      const progress = orders.filter((o) => o.status === "progress").slice(0, 2);
      const lines = [];

      canceled.forEach((o) =>
        lines.push(
          r("problemCanceled", {
            id: o.id,
            service: localizeEnum("service", o.service),
            client: o.client,
          })
        )
      );
      progress.forEach((o) =>
        lines.push(r("problemProgress", { id: o.id, master: o.master }))
      );

      if (!lines.length) return r("problemNone");
      return `${r("problemHeader", { n: lines.length })}\n${lines.join("\n")}\n\n${r("problemTail")}`;
    }

    if (/(tarif|obun|biznes|\bpro|тариф|подписк|прайс|бизнес|subscription|pricing|tier|business)/.test(text)) {
      const names = {
        standart: t("plan.standart.name"),
        pro: t("plan.pro.name"),
        biznes: t("plan.biznes.name"),
      };
      const subs = {
        standart: Math.max(s.mastersActive - s.proSubscribers - s.bizSubscribers, 0),
        pro: s.proSubscribers,
        biznes: s.bizSubscribers,
      };
      const price = (value) => (value ? `${formatPrice(value)} ${t("admin.aiReply.plansCurrency")}` : t("admin.aiReply.plansFree"));
      const requests = subscriptions.filter((x) => x.status !== "canceled").slice(0, 3);

      const lines = Object.keys(DEMO_PLANS).map((key) => {
        const plan = DEMO_PLANS[key];
        return r(plan.monthly ? "plansLine" : "plansFreeLine", {
          name: names[key],
          monthly: price(plan.monthly),
          yearly: plan.yearly ? price(plan.yearly) : "\u2014",
          commission: plan.commission,
          subs: formatPrice(subs[key]),
        });
      });

      const billingWord = (value) =>
        value === "yearly" ? t("admin.aiReply.billingYearly") : t("admin.aiReply.billingMonthly");

      return [
        r("plansTitle"),
        lines.join("\n"),
        "",
        r("plansMrr", { mrr: formatPrice(s.planMrr), conv: s.planConversion }),
        requests.length
          ? r("plansLatest", {
              list: requests
                .map((x) => `${x.name} \u2014 ${names[x.plan] || x.plan}, ${billingWord(x.billing)}`)
                .join(", "),
            })
          : r("plansNoLatest"),
        "",
        r("plansTail"),
      ].join("\n");
    }

    if (/(buyurtma|order|so'rov|statistika|заказ|статистик)/.test(text)) {
      const top = topService(orders, false);
      return [
        r("ordersTitle"),
        r("ordersTotal", { n: formatPrice(s.ordersToday) }),
        r("ordersNew", { n: formatPrice(s.newToday) }),
        r("ordersProgress", { n: formatPrice(s.progressToday) }),
        r("ordersDone", { n: formatPrice(s.doneToday) }),
        r("ordersCanceled", { n: formatPrice(s.canceledToday) }),
        "",
        r("ordersTop", {
          service: top ? localizeEnum("service", top.service) : t("enum.service.plumbing"),
          n: formatPrice(s.newToday),
        }),
      ].join("\n");
    }

    if (/(usta|master|reyting|мастер|рейтинг)/.test(text)) {
      const top = [...masters].sort((a, b) => b.jobs - a.jobs).slice(0, 3);
      const list = top
        .map((m, index) =>
          r("masterLine", {
            i: index + 1,
            name: m.name,
            jobs: formatPrice(m.jobs),
            rating: m.rating.toFixed(1),
          })
        )
        .join("\n");
      const busy = masters.filter((m) => m.status === "busy").map((m) => m.name);

      return `${r("mastersTitle")}\n${list}\n\n${r("mastersFooter", {
        active: formatPrice(s.mastersActive),
        free: formatPrice(s.mastersFree),
        busy: busy.length ? busy.join(", ") : r("mastersNone"),
      })}`;
    }

    if (/(daromad|pul|tushum|foyda|revenue|доход|прибыл|выручк)/.test(text)) {
      const total = orders.reduce((sum, order) => sum + order.amount, 0);
      const average = orders.length ? Math.round(total / orders.length) : 0;
      const top = topService(orders, true);
      const forecast = (s.revenue * (1 + s.revenueGrowth / 100)) / 1e6;

      return `${r("revenue", {
        total: (s.revenue / 1e6).toFixed(1),
        growth: s.revenueGrowth,
        average: formatPrice(average),
        service: top ? localizeEnum("service", top.service) : t("enum.service.plumbing"),
      })}\n\n${r("revenueForecast", { forecast: forecast.toFixed(1) })}`;
    }

    if (/(mijoz|client|foydalanuvchi|клиент|пользовател)/.test(text)) {
      const topClient = [...clients].sort((a, b) => b.orders - a.orders)[0];

      return r("clients", {
        total: formatPrice(s.clientsTotal),
        growth: s.clientsGrowth,
        top: topClient
          ? r("clientsTop", { name: topClient.name, orders: formatPrice(topClient.orders) })
          : r("clientsNoTop"),
        rate: s.repeatRate,
        new: formatPrice(s.newClientsToday),
      });
    }

    if (/(reja|tavsiya|maslahat|nima qil|yordam ber|recommend|advice|what should|совет|рекоменд|что делать)/.test(text)) {
      return [
        r("ideasTitle"),
        r("ideas1", { n: formatPrice(s.newToday) }),
        r("ideas2"),
        r("ideas3"),
      ].join("\n");
    }

    if (/(salom|assalom|hayrli|xayrli|hello|hi|здравств|привет)/.test(text)) {
      return r("hello");
    }

    if (/(rahmat|tashakkur|thank|спасибо)/.test(text)) return r("thanks");

    return r("fallback");
  }

  async function respond(message) {
    const typing = addTyping();

    if (offlineMode) {
      await sleep(600);
      typing.remove();
      addMessage("ai", demoReply(message));
      return;
    }

    try {
      const [result] = await Promise.all([
        api("/api/chat", {
          method: "POST",
          body: JSON.stringify({ message, lang: window.MuI18n ? window.MuI18n.getLang() : "uz" }),
        }),
        sleep(600),
      ]);

      typing.remove();
      addMessage("ai", result.reply || t("admin.ai.empty"));
    } catch (error) {
      typing.remove();
      if (error.message === "unauthorized") return;
      offlineMode = true;
      addMessage("ai", demoReply(message));
    }
  }

  function sendMessage(text) {
    const value = text.trim();
    if (!value) return;

    addMessage("user", value);
    respond(value);
  }

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(chatText.value);
    chatText.value = "";
    chatText.style.height = "auto";
  });

  chatText.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  chatText.addEventListener("input", () => {
    chatText.style.height = "auto";
    chatText.style.height = Math.min(chatText.scrollHeight, 120) + "px";
  });

  $$(".suggestion").forEach((btn) => {
    btn.addEventListener("click", () => {
      sendMessage(btn.textContent);
      chatText.focus();
    });
  });

  chatClear.addEventListener("click", () => {
    resetChat();
    showToast(t("admin.toast.cleared"));
  });

  /* ---------- Language switch ---------- */
  document.addEventListener("mu:langchange", () => {
    renderAll();
    switchView(currentView);
    syncThemeLabel();

    const messages = chatLog.querySelectorAll(".msg");
    if (messages.length === 1 && messages[0].classList.contains("ai")) {
      const bubble = messages[0].querySelector(".bubble");
      if (bubble) bubble.textContent = chatIntro();
    }
  });

  resetChat();
})();
