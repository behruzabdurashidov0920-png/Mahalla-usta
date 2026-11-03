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

  /* ---------- Offline demo account ---------- */
  const DEMO_EMAIL = "admin@mahallausta.uz";
  const DEMO_PHONE = "998901234567";
  const DEMO_PASSWORD = "admin123";

  function demoSignIn(login, password) {
    const value = login.trim().toLowerCase();
    const digits = value.replace(/\D/g, "");
    const valid = (value === DEMO_EMAIL || digits === DEMO_PHONE) && password === DEMO_PASSWORD;

    if (!valid) return false;

    const session = JSON.stringify({
      name: "Bekzod Admin",
      email: DEMO_EMAIL,
      role: "Administrator",
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

    return true;
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
        window.location.href = "admin.html";
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

    if (demoSignIn(login, password)) {
      window.location.href = "admin.html";
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
