// MahallaUsta — user profile (server session, offline demo fallback)

(async function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);

  const formatPrice = (n) =>
    window.MuI18n ? window.MuI18n.formatNumber(n) : String(Math.round(n) || 0);

  const initials = (name) =>
    String(name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  const digits = (value) => String(value || "").replace(/\D/g, "");

  const formatPhone = (value) => {
    const d = digits(value);
    return d.length === 12 ? `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}` : value || "";
  };

  const formatDate = (iso) => {
    const date = new Date(iso || "");
    if (Number.isNaN(date.getTime())) return "—";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  };

  const formatDateTime = (iso) => {
    const date = new Date(iso || "");
    if (Number.isNaN(date.getTime())) return "—";
    const pad = (n) => String(n).padStart(2, "0");
    return `${formatDate(iso)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const toastEl = $("#pf-toast");
  let toastTimer;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (response.status === 401 && url !== "/api/auth/logout") {
      window.location.replace("login.html");
      throw new Error("unauthorized");
    }

    return { status: response.status, data };
  }

  /* ---------- Enum localization ---------- */
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

  const localizeEnum = (type, value) => {
    const key = ENUM_KEYS[type][value];
    return key ? t(key) : value;
  };

  /* ---------- Plan catalog ---------- */
  const PLANS = {
    standart: { monthly: 0, yearly: 0, commission: 12 },
    pro: { monthly: 99000, yearly: 79000, commission: 8 },
    biznes: { monthly: 249000, yearly: 199000, commission: 5 },
  };

  const PLAN_ORDER = ["standart", "pro", "biznes"];
  const PLAN_FEATURES = { standart: 4, pro: 5, biznes: 4 };
  const planName = (id) => t(`plan.${id}.name`);
  const billingWord = (billing) =>
    billing === "yearly" ? t("admin.aiReply.billingYearly") : t("admin.aiReply.billingMonthly");

  /* ---------- Offline demo ---------- */
  const DEMO_ORDERS = [
    { id: "MU-1048", client: "Nilufar Rahimova", service: "Santexnika", master: "Aziz Karimov", amount: 180000, status: "done", time: "10:24" },
    { id: "MU-1042", client: "Gulnora Karimova", service: "Santexnika", master: "Aziz Karimov", amount: 150000, status: "canceled", time: "07:52" },
    { id: "MU-1035", client: "Doniyor Sattorov", service: "Santexnika", master: "Aziz Karimov", amount: 210000, status: "done", time: "Kecha" },
    { id: "MU-1031", client: "Kamola Ergasheva", service: "Santexnika", master: "Aziz Karimov", amount: 165000, status: "progress", time: "Kecha" },
  ];

  const DEMO_PROFILE = {
    id: "c1",
    name: "Aziz Karimov",
    email: "usta@mahallausta.uz",
    phone: "998905550102",
    role: "Usta",
    district: "Chilonzor",
    notifySms: true,
    notifyPush: true,
    since: "2026-03-12T08:00:00.000Z",
    lastLoginAt: null,
  };

  function storedSession() {
    try {
      const raw = window.localStorage.getItem("mu_admin") || window.sessionStorage.getItem("mu_admin");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function demoState() {
    const session = storedSession();
    const user = {
      ...DEMO_PROFILE,
      name: session && session.name ? session.name : DEMO_PROFILE.name,
      email: session && session.email ? session.email : DEMO_PROFILE.email,
      role: session && session.role ? session.role : DEMO_PROFILE.role,
      lastLoginAt: session && session.loginAt ? session.loginAt : new Date().toISOString(),
    };

    const mine = user.role === "Administrator" ? DEMO_ORDERS.slice(0, 2) : DEMO_ORDERS;
    const counts = { total: mine.length, new: 0, progress: 0, done: 0, canceled: 0, spent: 0 };
    mine.forEach((order) => {
      if (counts[order.status] !== undefined) counts[order.status] += 1;
      if (order.status === "done") counts.spent += order.amount;
    });

    return {
      user,
      profile: {
        plan: {
          id: "pro",
          billing: "yearly",
          price: 79000,
          monthly: PLANS.pro.monthly,
          yearly: PLANS.pro.yearly,
          commission: PLANS.pro.commission,
          renewsAt: new Date(Date.now() + 180 * 86400000).toISOString(),
          subscriptionId: "SUB-241",
          status: "active",
        },
        plans: PLANS,
        orders: mine,
        counts,
        lifetime: counts.total,
        master: { spec: "Santexnik", district: "Chilonzor", rating: 4.9, jobs: 128, status: "active" },
        client: null,
        since: user.since,
      },
    };
  }

  /* ---------- State ---------- */
  const state = { user: null, profile: null, billing: "monthly", online: true };
  let formTouched = false;

  const roleLabel = (role) =>
    role === "Administrator"
      ? t("profile.roleAdmin")
      : role === "Usta"
        ? t("profile.roleUsta")
        : t("profile.roleMijoz");

  /* ---------- Hero + KPI ---------- */
  function renderHero() {
    const { user, profile } = state;
    const first = String(user.name).split(" ")[0] || user.name;

    $("#top-avatar").textContent = initials(user.name);
    $("#pf-avatar").textContent = initials(user.name);
    $("#pf-date").textContent = t("admin.date", {
      day: new Date().getDate(),
      month: t(`month.${new Date().getMonth() + 1}`),
    });
    $("#pf-hello").textContent = t("profile.hello", { name: first });
    $("#pf-role").textContent = roleLabel(user.role);
    $("#pf-district").textContent = localizeEnum("district", user.district);
    $("#pf-since").textContent = formatDate(user.since || profile.since);
    $("#pf-lastlogin").textContent = user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—";

    const plan = profile.plan;
    const badge = $("#pf-plan-badge");
    badge.className = `plan-badge plan-badge--${plan.id}`;
    badge.textContent = planName(plan.id);

    $("#pf-plan-price").textContent = plan.price
      ? `${formatPrice(plan.price)} ${t("common.currency")} / ${billingWord(plan.billing)}`
      : t("admin.aiReply.plansFree");

    $("#pf-plan-note").textContent = plan.id === "standart"
      ? t("profile.plan.standardNote")
      : `${t("profile.plan.commission")} ${plan.commission}%`;
  }

  function renderKpis() {
    const { profile } = state;
    $("#pf-kpi-orders").textContent = formatPrice(profile.counts.total);
    $("#pf-kpi-done").textContent = formatPrice(profile.counts.done);
    $("#pf-kpi-spent").textContent = `${formatPrice(profile.counts.spent)} ${t("common.currency")}`;

    $("#pf-kpi-rating").textContent = profile.master ? `★ ${profile.master.rating.toFixed(1)}` : "—";
  }

  /* ---------- Orders ---------- */
  function renderOrders() {
    const body = $("#pf-orders-body");
    const orders = state.profile.orders;

    if (!orders.length) {
      body.innerHTML = `<tr><td class="cell-empty" colspan="6">${t("profile.orders.empty")}</td></tr>`;
      return;
    }

    body.innerHTML = orders
      .map((order) => {
        const time = order.time === "Kecha" ? t("common.yesterday") : order.time;
        return `
          <tr>
            <td class="cell-id">#${order.id}</td>
            <td>${localizeEnum("service", order.service)}</td>
            <td>${order.master ? order.master : "—"}</td>
            <td class="cell-amount">${formatPrice(order.amount)} <span class="cell-muted">${t("common.currency")}</span></td>
            <td><span class="status st-${order.status}">${t(`status.${order.status}`)}</span></td>
            <td>${time}</td>
          </tr>`;
      })
      .join("");
  }

  /* ---------- Plan tab ---------- */
  function renderPlan() {
    const { profile } = state;
    const plan = profile.plan;

    $("#pf-sub-id").textContent = plan.subscriptionId || "—";

    const status = $("#pf-sub-status");
    status.className = `status ${
      plan.status === "active" ? "st-done" : plan.status === "trial" ? "st-progress" : "st-canceled"
    }`;
    status.textContent = plan.status === "none" ? t("profile.plan.statusNone") : t(`status.${plan.status}`);

    $("#pf-commission").textContent = `${plan.commission}%`;
    $("#pf-renews").textContent = plan.subscriptionId ? formatDate(plan.renewsAt) : "—";

    $$("#pf-billing .chip").forEach((chip) => {
      const active = chip.dataset.billing === state.billing;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });

    $("#pf-plans").innerHTML = PLAN_ORDER.map((id) => {
      const price = PLANS[id][state.billing];
      const isCurrent = id === plan.id;
      const features = Array.from({ length: PLAN_FEATURES[id] }, (_, i) => `<li>${t(`plan.${id}.f${i + 1}`)}</li>`).join("");

      const flag = isCurrent
        ? `<span class="pf-plan-flag">${t("profile.plan.currentBadge")}</span>`
        : id === "pro"
          ? `<span class="pf-plan-flag">${t("pricing.popular")}</span>`
          : "";

      const priceLine = price
        ? `${formatPrice(price)} ${t("common.currency")} <small>/ ${billingWord(state.billing)}</small>`
        : `${t("admin.aiReply.plansFree")} <small>/ ${billingWord(state.billing)}</small>`;

      const button = isCurrent
        ? `<button class="pf-plan-btn" type="button" disabled>${t("profile.plan.currentBadge")}</button>`
        : `<button class="pf-plan-btn ${id === "pro" ? "pf-plan-btn--primary" : ""}" type="button" data-plan="${id}">${t("profile.plan.switch")}</button>`;

      return `
        <article class="pf-plan ${isCurrent ? "is-current" : ""}">
          <div class="pf-plan-head"><h3>${planName(id)}</h3>${flag}</div>
          <p class="pf-plan-price">${priceLine}</p>
          <p class="pf-plan-desc">${t(`plan.${id}.desc`)}</p>
          <ul class="pf-plan-list">${features}</ul>
          ${button}
        </article>`;
    }).join("");
  }

  async function switchPlan(planId) {
    const { user } = state;
    const price = PLANS[planId][state.billing];
    const confirmed = window.confirm(
      `${t("profile.plan.confirmTitle")}\n${t("profile.plan.confirmText", {
        plan: planName(planId),
        price: price ? formatPrice(price) : t("admin.aiReply.plansFree"),
        billing: billingWord(state.billing),
      })}`
    );

    if (!confirmed) return;

    if (!state.online) {
      showToast(t("profile.toast.offline"));
      return;
    }

    try {
      await request("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          kind: "subscription",
          plan: planId,
          billing: state.billing,
          name: user.name,
          phone: user.phone,
          district: user.district,
        }),
      });

      const response = await request("/api/profile");
      state.profile = response.data.profile;
      state.billing = state.profile.plan.billing === "yearly" ? "yearly" : "monthly";
      renderAll();
      showToast(t("profile.plan.changed", { plan: planName(planId) }));
    } catch (error) {
      showToast(t("profile.settings.failed"));
    }
  }

  /* ---------- Settings ---------- */
  function fillForm() {
    const { user } = state;

    $("#pf-name").value = user.name || "";
    $("#pf-email").value = user.email || "";
    $("#pf-phone").value = formatPhone(user.phone);
    $("#pf-notify-sms").checked = Boolean(user.notifySms);
    $("#pf-notify-push").checked = Boolean(user.notifyPush);

    const select = $("#pf-district-select");
    select.innerHTML = Object.keys(ENUM_KEYS.district)
      .map((name) => `<option value="${name}">${localizeEnum("district", name)}</option>`)
      .join("");
    select.value = ENUM_KEYS.district[user.district] ? user.district : "Chilonzor";
  }

  function fieldError(box, input, key) {
    box.textContent = t(key);
    box.hidden = false;
    if (input) input.setAttribute("aria-invalid", "true");
  }

  function clearErrors() {
    $$(".pf-error").forEach((box) => {
      box.hidden = true;
      box.textContent = "";
    });
    $$(".pf-field input").forEach((input) => input.removeAttribute("aria-invalid"));
  }

  const ERROR_KEYS = {
    invalid_name: "profile.settings.invalid",
    invalid_email: "profile.settings.invalid",
    invalid_phone: "profile.settings.invalid",
    invalid_district: "profile.settings.invalid",
    email_taken: "profile.settings.emailTaken",
    phone_taken: "profile.settings.phoneTaken",
    wrong_password: "profile.settings.wrong",
    weak_password: "profile.settings.weak",
  };

  /* ---------- Theme ---------- */
  const themeBtn = $("#theme-toggle");
  const currentTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const themeLabel = (mode) => t(mode === "light" ? "admin.theme.light" : "admin.theme.dark");

  function syncThemeLabel() {
    const mode = currentTheme();
    const label = `${t("admin.theme.toggle")}: ${themeLabel(mode)}`;
    themeBtn.setAttribute("aria-label", label);
    themeBtn.title = label;
    themeBtn.setAttribute("aria-pressed", String(mode === "light"));
  }

  /* ---------- Render ---------- */
  function renderAll() {
    renderHero();
    renderKpis();
    renderOrders();
    renderPlan();
    if (!formTouched) fillForm();
  }

  /* ---------- Load ---------- */
  async function load() {
    try {
      const response = await request("/api/profile");
      state.user = response.data.user;
      state.profile = response.data.profile;
      state.online = true;
    } catch (error) {
      if (error.message === "unauthorized") throw error;
      const demo = demoState();
      state.user = demo.user;
      state.profile = demo.profile;
      state.online = false;
      showToast(t("profile.toast.demo"));
    }

    state.billing = state.profile.plan.billing === "yearly" ? "yearly" : "monthly";
    renderAll();
  }

  try {
    await load();
  } catch (error) {
    return; // redirected to login
  }

  /* ---------- Events ---------- */
  $$(".pf-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".pf-tab").forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      $$(".pf-view").forEach((view) => {
        view.classList.toggle("active", view.id === `tab-${tab.dataset.tab}`);
      });
    });
  });

  $("#pf-billing").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-billing]");
    if (!chip) return;
    state.billing = chip.dataset.billing === "yearly" ? "yearly" : "monthly";
    renderPlan();
  });

  $("#pf-plans").addEventListener("click", (event) => {
    const button = event.target.closest("[data-plan]");
    if (button) switchPlan(button.dataset.plan);
  });

  $("#pf-form").addEventListener("input", () => {
    formTouched = true;
    clearErrors();
  });

  $("#pf-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const name = $("#pf-name").value.trim();
    const email = $("#pf-email").value.trim().toLowerCase();
    const phone = digits($("#pf-phone").value);
    const district = $("#pf-district-select").value;
    const notifySms = $("#pf-notify-sms").checked;
    const notifyPush = $("#pf-notify-push").checked;
    const box = $("#pf-form-error");

    if (name.length < 3) return fieldError(box, $("#pf-name"), "profile.settings.invalid");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return fieldError(box, $("#pf-email"), "profile.settings.invalid");
    if (phone.length !== 12) return fieldError(box, $("#pf-phone"), "profile.settings.invalid");

    const saveBtn = $("#pf-save");
    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = t("profile.settings.saving");

    if (!state.online) {
      Object.assign(state.user, { name, email, phone, district, notifySms, notifyPush });
      formTouched = false;
      renderAll();
      saveBtn.disabled = false;
      saveBtn.textContent = label;
      return showToast(t("profile.toast.offline"));
    }

    try {
      const response = await request("/api/profile", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, district, notifySms, notifyPush }),
      });

      if (response.status !== 200) {
        const key = ERROR_KEYS[response.data.error] || "profile.settings.failed";
        const input = response.data.error === "phone_taken" ? $("#pf-phone")
          : response.data.error === "email_taken" ? $("#pf-email") : null;
        fieldError(box, input, key);
      } else {
        state.user = response.data.user;
        state.profile = response.data.profile;
        formTouched = false;
        renderAll();
        showToast(t("profile.settings.saved"));
      }
    } catch (error) {
      fieldError(box, null, "profile.settings.failed");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
    }
  });

  $("#pf-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const current = $("#pf-pw-current").value;
    const next = $("#pf-pw-next").value;
    const confirmValue = $("#pf-pw-confirm").value;
    const box = $("#pf-pw-error");

    if (next !== confirmValue) return fieldError(box, $("#pf-pw-confirm"), "profile.settings.mismatch");
    if (next.length < 6) return fieldError(box, $("#pf-pw-next"), "profile.settings.weak");
    if (!state.online) return fieldError(box, null, "profile.toast.offline");

    const saveBtn = $("#pf-pw-save");
    saveBtn.disabled = true;

    try {
      const response = await request("/api/profile/password", {
        method: "POST",
        body: JSON.stringify({ current, next }),
      });

      if (response.status !== 200) {
        fieldError(box, response.data.error === "weak_password" ? $("#pf-pw-next") : $("#pf-pw-current"),
          ERROR_KEYS[response.data.error] || "profile.settings.failed");
      } else {
        $("#pf-password-form").reset();
        showToast(t("profile.settings.changed"));
      }
    } catch (error) {
      fieldError(box, null, "profile.settings.failed");
    } finally {
      saveBtn.disabled = false;
    }
  });

  $("#logout").addEventListener("click", async () => {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch (error) {
      /* session cookie already gone */
    }

    try {
      window.localStorage.removeItem("mu_admin");
      window.sessionStorage.removeItem("mu_admin");
    } catch (error) {
      /* storage unavailable */
    }

    window.location.replace("login.html");
  });

  themeBtn.addEventListener("click", () => {
    const next = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;

    try {
      window.localStorage.setItem("mu_theme", next);
    } catch (error) {
      /* storage unavailable */
    }

    syncThemeLabel();
  });

  syncThemeLabel();

  document.addEventListener("mu:langchange", () => {
    renderAll();
    syncThemeLabel();
  });
})();
