// MahallaUsta — landing AI agent (chat widget)

(function () {
  "use strict";

  const root = document.getElementById("ai-agent");
  if (!root) return;

  const panel = document.getElementById("ai-panel");
  const launcher = document.getElementById("ai-launcher");
  const log = document.getElementById("ai-log");
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-input");
  const clearBtn = document.getElementById("ai-clear");
  const closeBtn = document.getElementById("ai-close");
  const suggestions = document.getElementById("ai-suggestions");
  const sendBtn = form.querySelector(".ai-send");

  const t = (key, vars) => (window.MuI18n ? window.MuI18n.t(key, vars) : key);
  const lang = () => (window.MuI18n ? window.MuI18n.getLang() : "uz");

  let busy = false;
  let history = [];

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function openRequestForm(service) {
    setOpen(false);
    if (window.MuModal && typeof window.MuModal.open === "function") {
      window.MuModal.open(service ? { preset: service } : {});
    }
  }

  function addMessage(role, text, action) {
    const message = document.createElement("div");
    message.className = `ai-msg ai-msg--${role === "user" ? "user" : "bot"}`;
    message.textContent = text;

    if (action && action.type === "open_request") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ai-action";
      button.textContent = t("agent.openForm");
      button.addEventListener("click", () => openRequestForm(action.service));
      message.appendChild(button);
    }

    log.appendChild(message);
    scrollDown();
    return message;
  }

  function addTyping() {
    const message = document.createElement("div");
    message.className = "ai-msg ai-msg--bot ai-typing";
    message.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(message);
    scrollDown();
    return message;
  }

  function addIntro() {
    addMessage("bot", t("agent.intro"));
  }

  function setOpen(next) {
    panel.hidden = !next;
    launcher.setAttribute("aria-expanded", String(next));

    if (next) {
      if (!log.children.length) addIntro();
      window.setTimeout(() => input.focus(), 80);
    }
  }

  function resetChat() {
    log.innerHTML = "";
    history = [];
    suggestions.classList.remove("is-hidden");
    addIntro();
  }

  async function send(text) {
    const value = String(text || "").trim();
    if (!value || busy) return;

    if (!log.children.length) addIntro();

    addMessage("user", value);
    const prior = history.slice(-8);
    history.push({ role: "user", content: value });
    if (history.length > 20) history = history.slice(-20);

    suggestions.classList.add("is-hidden");
    input.value = "";
    input.style.height = "auto";

    busy = true;
    if (sendBtn) sendBtn.disabled = true;
    const typing = addTyping();

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, lang: lang(), history: prior }),
      });

      if (!response.ok) throw new Error(`http_${response.status}`);

      const data = await response.json();
      const reply = data && data.reply ? String(data.reply) : t("agent.error");

      typing.remove();
      addMessage("bot", reply, data && data.action);
      history.push({ role: "assistant", content: reply });
    } catch (error) {
      typing.remove();
      addMessage("bot", t("agent.error"));
    } finally {
      busy = false;
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener("click", () => setOpen(panel.hidden));
  closeBtn.addEventListener("click", () => setOpen(false));
  clearBtn.addEventListener("click", resetChat);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    send(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });

  suggestions.querySelectorAll("[data-agent-suggest]").forEach((button) => {
    button.addEventListener("click", () => {
      send(button.textContent);
      input.focus();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  document.addEventListener("mu:langchange", () => {
    if (log.children.length === 1) {
      const only = log.firstElementChild;
      if (only && only.classList.contains("ai-msg--bot") && !only.querySelector(".ai-action")) {
        only.textContent = t("agent.intro");
      }
    }
  });
})();
