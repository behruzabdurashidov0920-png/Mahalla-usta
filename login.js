// MahallaUsta — login (server auth)

(function () {
  "use strict";

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const errorBox = document.getElementById("login-error");
  const errorText = errorBox.querySelector("span");
  const submitBtn = document.getElementById("login-submit");
  const demoBtn = document.getElementById("demo-login");
  const pwToggle = document.getElementById("pw-toggle");
  const remember = document.getElementById("remember");

  let errorKey = "login.error";

  /* ---------- Entry point by role ---------- */
  const homeFor = (role) => (role === "Administrator" ? "admin.html" : "profile.html");

  /* ---------- Offline demo accounts ---------- */
  const DEMO_ACCOUNTS = [
    { login: "admin@mahallausta.uz", phone: "998901234567", password: "admin123", name: "Bekzod Admin", role: "Administrator" },
    { login: "usta@mahallausta.uz", phone: "998905550102", password: "usta123", name: "Aziz Karimov", role: "Usta" },
  ];

  function matchDemo(login, password) {
    const value = login.trim().toLowerCase();
    const digits = value.replace(/\D/g, "");

    return (
      DEMO_ACCOUNTS.find(
        (account) =>
          account.password === password &&
          (account.login === value || account.phone === digits)
      ) || null
    );
  }

  function demoAccount(login, password) {
    const account = matchDemo(login, password);
    if (!account) return false;

    const session = JSON.stringify({
      name: account.name,
      email: account.login,
      role: account.role,
      loginAt: new Date().toISOString(),
    });

    try {
      const store = remember.checked ? window.localStorage : window.sessionStorage;
      store.setItem("mu_admin", session);
    } catch (error) {
      try {
        window.sessionStorage.setItem("mu_admin", session);
      } catch (innerError) {
        /* storage mavjud emas */
      }
    }

    return account;
  }

  /* ---------- Password visibility ---------- */
  const eyeOpen = pwToggle.querySelector(".eye-open");
  const eyeClosed = pwToggle.querySelector(".eye-closed");

  pwToggle.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    pwToggle.setAttribute("aria-label", t(show ? "aria.hidePassword" : "aria.showPassword"));
    pwToggle.setAttribute("aria-pressed", String(show));
    eyeOpen.toggleAttribute("hidden", show);
    eyeClosed.toggleAttribute("hidden", !show);
  });

  document.addEventListener("mu:langchange", () => {
    errorText.textContent = t(errorKey);
    pwToggle.setAttribute(
      "aria-label",
      t(passwordInput.type === "text" ? "aria.hidePassword" : "aria.showPassword")
    );
    if (submitBtn.disabled) {
      submitBtn.querySelector("span").textContent = t("login.busy");
    } else {
      submitBtn.querySelector("span").textContent = t("login.submit");
    }
  });

  /* ---------- Helpers ---------- */
  function showError(key) {
    errorKey = key || "login.error";
    errorText.textContent = t(errorKey);
    errorBox.hidden = false;
    errorBox.style.animation = "none";
    void errorBox.offsetWidth;
    errorBox.style.animation = "";
  }

  function hideError() {
    errorKey = "login.error";
    errorBox.hidden = true;
    errorText.textContent = t(errorKey);
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    demoBtn.disabled = busy;
    submitBtn.querySelector("span").textContent = t(busy ? "login.busy" : "login.submit");
  }

  async function submitLogin(login, password) {
    if (!login.trim() || !password) {
      showError("login.missing");
      emailInput.focus();
      return;
    }

    hideError();
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: login.trim(),
          password,
          remember: remember.checked,
        }),
      });

      if (response.status === 429) {
        showError("login.rate");
        setBusy(false);
        return;
      }

      if (response.ok) {
        const data = await response.json().catch(() => null);
        window.location.href = homeFor(data && data.user ? data.user.role : "Administrator");
        return;
      }

      if (response.status === 401) {
        showError();
        setBusy(false);
        emailInput.focus();
        return;
      }
    } catch (error) {
      /* server yo'q — demo rejimda davom etamiz */
    }

    const account = demoAccount(login, password);
    if (account) {
      window.location.href = homeFor(account.role);
      return;
    }

    showError();
    setBusy(false);
    emailInput.focus();
  }

  /* ---------- Form ---------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitLogin(emailInput.value, passwordInput.value);
  });

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", hideError);
  });

  demoBtn.addEventListener("click", () => {
    emailInput.value = "admin@mahallausta.uz";
    passwordInput.value = "admin123";
    hideError();
    submitLogin(emailInput.value, passwordInput.value);
  });
})();
