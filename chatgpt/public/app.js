"use strict";

(function () {
  /* ---------- Storage keys ---------- */
  const CHATS_KEY = "gpt_chats_v1";
  const ACTIVE_KEY = "gpt_active_v1";
  const CFG_KEY = "gpt_cfg_v1";
  const KEY_KEY = "gpt_key_v1";
  const MAX_CHATS = 60;

  const SPARK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z"/></svg>';
  const CHAT_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4H8l-5 3 1.5-5.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>';
  const TRASH_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/></svg>';
  const COPY_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';

  const el = {
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    chatList: document.getElementById("chat-list"),
    empty: document.getElementById("empty"),
    messages: document.getElementById("messages"),
    scroll: document.getElementById("chat-scroll"),
    newChat: document.getElementById("new-chat"),
    brand: document.getElementById("brand-link"),
    menu: document.getElementById("menu-btn"),
    sideClose: document.getElementById("side-close"),
    composer: document.getElementById("composer"),
    input: document.getElementById("input"),
    send: document.getElementById("send"),
    stop: document.getElementById("stop"),
    modelPill: document.getElementById("model-pill"),
    modelDot: document.getElementById("model-dot"),
    modelName: document.getElementById("model-name"),
    modeLabel: document.getElementById("mode-label"),
    toast: document.getElementById("toast"),
    settings: document.getElementById("settings"),
    settingsForm: document.getElementById("settings-form"),
    settingsClose: document.getElementById("settings-close"),
    cfgKey: document.getElementById("cfg-key"),
    cfgBase: document.getElementById("cfg-base"),
    cfgModel: document.getElementById("cfg-model"),
    cfgClear: document.getElementById("cfg-clear"),
    cfgStatus: document.getElementById("cfg-status"),
    openSettings: document.getElementById("open-settings"),
    openSettings2: document.getElementById("open-settings-2"),
  };

  const state = {
    chats: [],
    activeId: "",
    online: false,
    server: null,
    streaming: false,
    abort: null,
    current: null,
  };

  /* ---------- Helpers ---------- */
  const uid = () =>
    "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (copyError) {
        ok = false;
      }
      document.body.removeChild(area);
      return ok;
    }
  }

  function stickToBottom(force) {
    const node = el.scroll;
    const near = node.scrollHeight - node.scrollTop - node.clientHeight < 140;
    if (force || near) node.scrollTop = node.scrollHeight;
  }

  /* ---------- Persistence ---------- */
  function loadChats() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((chat) => chat && typeof chat.id === "string")
        .map((chat) => ({
          id: chat.id,
          title: String(chat.title || "Yangi suhbat").slice(0, 120),
          createdAt: Number(chat.createdAt) || Date.now(),
          updatedAt: Number(chat.updatedAt) || Number(chat.createdAt) || Date.now(),
          messages: Array.isArray(chat.messages)
            ? chat.messages
                .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant"))
                .map((msg) => ({
                  role: msg.role,
                  content: String(msg.content || ""),
                  error: Boolean(msg.error),
                }))
                .filter((msg) => msg.content.trim().length > 0)
            : [],
        }));
    } catch (error) {
      return [];
    }
  }

  function saveChats() {
    try {
      const sorted = state.chats
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_CHATS);
      state.chats = sorted;
      localStorage.setItem(CHATS_KEY, JSON.stringify(sorted));
    } catch (error) {
      toast("Saqlashda xatolik: brauzer xotirasi to'lgan.");
    }
  }

  function loadConfig() {
    try {
      const raw = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
      return {
        baseUrl: typeof raw.baseUrl === "string" ? raw.baseUrl : "",
        model: typeof raw.model === "string" ? raw.model : "",
      };
    } catch (error) {
      return { baseUrl: "", model: "" };
    }
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    } catch (error) {
      toast("Sozlamalarni saqlab bo'lmadi.");
    }
  }

  function getKey() {
    try {
      return sessionStorage.getItem(KEY_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function setKey(value) {
    try {
      if (value) sessionStorage.setItem(KEY_KEY, value);
      else sessionStorage.removeItem(KEY_KEY);
    } catch (error) {
      /* sessiya xotirasi mavjud emas */
    }
  }

  /* ---------- Chat state ---------- */
  function getActiveChat() {
    return state.chats.find((chat) => chat.id === state.activeId) || null;
  }

  function createChat(title) {
    const now = Date.now();
    const chat = {
      id: uid(),
      title: (title || "Yangi suhbat").replace(/\s+/g, " ").trim().slice(0, 70),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    state.chats.unshift(chat);
    state.activeId = chat.id;
    try {
      localStorage.setItem(ACTIVE_KEY, chat.id);
    } catch (error) {
      /* e'tiborsiz */
    }
    return chat;
  }

  function setActive(id) {
    state.activeId = id;
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch (error) {
      /* e'tiborsiz */
    }
  }

  /* ---------- Sidebar ---------- */
  function groupLabel(ts) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = 86400000;
    if (ts >= startOfToday) return "Bugun";
    if (ts >= startOfToday - day) return "Kecha";
    if (ts >= startOfToday - 7 * day) return "Oxirgi 7 kun";
    return "Oldinroq";
  }

  function chatItem(chat) {
    const wrap = document.createElement("div");
    wrap.className = "chat-item" + (chat.id === state.activeId ? " active" : "");

    const open = document.createElement("button");
    open.type = "button";
    open.className = "chat-open";
    open.dataset.id = chat.id;
    open.title = chat.title;
    open.innerHTML = CHAT_SVG + '<span class="chat-title"></span>';
    open.querySelector(".chat-title").textContent = chat.title;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "chat-del";
    del.dataset.del = chat.id;
    del.setAttribute("aria-label", "Suhbatni o'chirish");
    del.title = "O'chirish";
    del.innerHTML = TRASH_SVG;

    wrap.append(open, del);
    return wrap;
  }

  function renderSidebar() {
    el.chatList.textContent = "";
    const chats = state.chats
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);

    if (!chats.length) {
      const empty = document.createElement("p");
      empty.className = "side-empty";
      empty.textContent = "Hali suhbat yo'q. Boshlash uchun xabar yozing.";
      el.chatList.appendChild(empty);
      return;
    }

    let lastGroup = "";
    chats.forEach((chat) => {
      const label = groupLabel(chat.updatedAt);
      if (label !== lastGroup) {
        const head = document.createElement("p");
        head.className = "chat-group-label";
        head.textContent = label;
        el.chatList.appendChild(head);
        lastGroup = label;
      }
      el.chatList.appendChild(chatItem(chat));
    });
  }

  /* ---------- Markdown ---------- */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        default:
          return "&#39;";
      }
    });
  }

  function inline(text) {
    const chunks = escapeHtml(text).split(/(`[^`\n]+`)/g);
    return chunks
      .map((chunk, index) => {
        if (index % 2 === 1) {
          return "<code>" + chunk.slice(1, -1) + "</code>";
        }
        return chunk
          .replace(
            /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
          )
          .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
          .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1<em>$2</em>");
      })
      .join("");
  }

  function codeBlock(code, lang) {
    return (
      '<div class="code-block"><div class="code-head"><span>' +
      escapeHtml(lang || "code") +
      '</span><button class="code-copy" type="button">Nusxalash</button></div><pre><code>' +
      code +
      "</code></pre></div>"
    );
  }

  function renderText(source) {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        i += 1;
        continue;
      }

      const heading = /^(#{1,3})\s+(.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        out.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ""));
          i += 1;
        }
        out.push("<blockquote>" + buf.map(inline).join("<br />") + "</blockquote>");
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
          i += 1;
        }
        out.push("<ul>" + buf.map((item) => "<li>" + inline(item) + "</li>").join("") + "</ul>");
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
          i += 1;
        }
        out.push("<ol>" + buf.map((item) => "<li>" + inline(item) + "</li>").join("") + "</ol>");
        continue;
      }

      const buf = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,3})\s+/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+[.)]\s+/.test(lines[i])
      ) {
        buf.push(lines[i]);
        i += 1;
      }
      out.push("<p>" + buf.map(inline).join("<br />") + "</p>");
    }

    return out.join("");
  }

  function renderMarkdown(source) {
    const text = String(source || "");
    const parts = text.split("```");
    let html = "";

    for (let i = 0; i < parts.length; i += 1) {
      if (i % 2 === 1) {
        const piece = parts[i];
        const breakAt = piece.indexOf("\n");
        let lang = "";
        let code = piece;
        if (breakAt !== -1) {
          lang = piece.slice(0, breakAt).trim();
          code = piece.slice(breakAt + 1);
        } else {
          lang = piece.trim();
          code = "";
        }
        html += codeBlock(escapeHtml(code.replace(/\n$/, "")), lang);
      } else {
        html += renderText(parts[i]);
      }
    }

    return html;
  }

  /* ---------- Message rows ---------- */
  function aiAvatar() {
    const avatar = document.createElement("span");
    avatar.className = "ai-avatar";
    avatar.innerHTML = SPARK_SVG;
    return avatar;
  }

  function assistantRow(message) {
    const row = document.createElement("div");
    row.className = "msg ai";
    row._raw = message.content;

    const body = document.createElement("div");
    body.className = "msg-body";

    const md = document.createElement("div");
    md.className = "md" + (message.error ? " is-error" : "");

    const actions = document.createElement("div");
    actions.className = "msg-actions";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-msg";
    copy.innerHTML = COPY_SVG + "<span>Nusxalash</span>";
    copy.addEventListener("click", async () => {
      const ok = await copyText(row._raw || "");
      toast(ok ? "Nusxalandi" : "Nusxalab bo'lmadi");
    });
    actions.appendChild(copy);

    if (message.error) {
      md.textContent = message.content;
    } else if (message.content) {
      md.innerHTML = renderMarkdown(message.content);
    } else {
      md.innerHTML = typingMarkup();
    }

    body.append(md, actions);
    row.append(aiAvatar(), body);
    return row;
  }

  function typingMarkup() {
    return '<span class="typing"><span></span><span></span><span></span></span>';
  }

  function userRow(message) {
    const row = document.createElement("div");
    row.className = "msg user";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = message.content;
    row.appendChild(bubble);
    return row;
  }

  function buildRow(message) {
    return message.role === "user" ? userRow(message) : assistantRow(message);
  }

  function updateAssistant(row, message) {
    row._raw = message.content;
    if (row._raf) return;
    row._raf = requestAnimationFrame(() => {
      row._raf = null;
      const md = row.querySelector(".md");
      if (!md) return;
      if (message.error) {
        md.classList.add("is-error");
        md.textContent = message.content;
      } else if (!message.content) {
        md.innerHTML = typingMarkup();
      } else {
        md.innerHTML = renderMarkdown(message.content);
      }
      stickToBottom();
    });
  }

  function markError(row, message, text) {
    message.content = text;
    message.error = true;
    row._raw = text;
    const md = row.querySelector(".md");
    if (md) {
      md.classList.add("is-error");
      md.textContent = text;
    }
    stickToBottom();
  }

  function renderChat() {
    const chat = getActiveChat();
    el.messages.textContent = "";
    state.current = chat;

    if (!chat || !chat.messages.length) {
      el.messages.hidden = true;
      el.empty.hidden = false;
      return;
    }

    el.empty.hidden = true;
    el.messages.hidden = false;
    const fragment = document.createDocumentFragment();
    chat.messages.forEach((message) => fragment.appendChild(buildRow(message)));
    el.messages.appendChild(fragment);
    stickToBottom(true);
  }

  /* ---------- Mode ---------- */
  function updateMode() {
    const hasKey = Boolean(getKey());
    const serverDemo = state.server ? Boolean(state.server.demo) : true;
    const cfg = loadConfig();

    el.modelDot.classList.remove("connected", "offline");

    if (!state.online) {
      el.modeLabel.textContent = "Demo rejim (brauzer)";
      el.modelDot.classList.add("offline");
    } else if (hasKey || !serverDemo) {
      el.modeLabel.textContent = "AI ulangan";
      el.modelDot.classList.add("connected");
    } else {
      el.modeLabel.textContent = "Demo rejim";
    }

    const model = cfg.model || (state.server && state.server.model) || "gpt-4o-mini";
    el.modelName.textContent = model;
    el.modelPill.title = state.online
      ? hasKey || !serverDemo
        ? "API kalit faol — haqiqiy javoblar"
        : "API kalit kiritilmagan — demo javoblar"
      : "Server topilmadi — brauzerdagi demo javoblar";
  }

  async function checkServer() {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (!response.ok) throw new Error("bad_status");
      const data = await response.json();
      state.server = data && typeof data === "object" ? data : null;
      state.online = true;
    } catch (error) {
      state.online = false;
      state.server = null;
    }
    updateMode();
  }

  /* ---------- Streaming ---------- */
  function setStreamingUI(active) {
    state.streaming = active;
    el.send.hidden = active;
    el.send.disabled = active;
    el.stop.hidden = !active;
    el.composer.setAttribute("aria-busy", active ? "true" : "false");
  }

  async function streamRemote(history, assistant, row) {
    const cfg = loadConfig();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history,
        key: getKey() || undefined,
        baseUrl: cfg.baseUrl || undefined,
        model: cfg.model || (state.server && state.server.model) || undefined,
      }),
      signal: state.abort.signal,
    });

    if (!response.ok) {
      let detail = "";
      try {
        const data = await response.json();
        detail = data && data.error ? String(data.error) : "";
      } catch (error) {
        detail = "";
      }
      throw new Error(detail || "Server xatosi (" + response.status + ").");
    }

    if (!response.body) {
      throw new Error("Brauzer oqimli javobni qo'llab-quvvatlamaydi.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          let data;
          try {
            data = JSON.parse(payload);
          } catch (error) {
            continue;
          }

          if (data && data.error) {
            if (!assistant.content) {
              markError(row, assistant, String(data.error));
            } else {
              assistant.content += "\n\n**Xatolik:** " + String(data.error);
              updateAssistant(row, assistant);
            }
          } else if (data && data.delta) {
            assistant.content += String(data.delta);
            updateAssistant(row, assistant);
          }
        }
      }
    }

    if (assistant.content) {
      const md = row.querySelector(".md");
      if (md) md.innerHTML = renderMarkdown(assistant.content);
      stickToBottom();
    }
  }

  function localDemoReply(prompt) {
    const text = String(prompt || "").toLowerCase();

    if (/(salom|assalom|hayrli|xayrli)/.test(text)) {
      return "Assalomu alaykum! Men ChatGPT demo nusxasiman.\n\nServer ulanmagan yoki API kalit kiritilmagan, shuning uchun namuna javoblar beraman. **Sozlamalar** oynasida API kalitni kiritib haqiqiy modelni yoqishingiz mumkin.";
    }

    if (/(nima qila|yordam|imkoniyat|mumkinmi)/.test(text)) {
      return "Demo rejimda quyidagilarni ko'rsataman:\n\n- matnni formatlash (sarlavha, **qalin**, `kod`)\n- kod bloklarini chiqarish va nusxalash\n- suhbatlar tarixini saqlash\n- mobil qurilmada qulay ko'rinish\n\nHaqiqiy savol-javob uchun sozlamalarda API kalitini kiriting.";
    }

    if (/(kod|code|funksiya|programma|javascript)/.test(text)) {
      return "Kod bloklarini shunday chiqaraman:\n\n```js\nfunction salomlash(ism) {\n  return `Salom, ${ism}!`;\n}\n\nconsole.log(salomlash(\"Dunyo\"));\n```\n\nBlokning o'ng burchagidagi **Nusxalash** tugmasi bilan kodni ko'chirib olishingiz mumkin.";
    }

    if (/(markdown|format|jadval|ro'yxat)/.test(text)) {
      return "Markdown namunalari:\n\n## Sarlavha\n\n- birinchi band\n- ikkinchi band\n- `inline kod` va **qalin** matn\n\n> Iqtibos ham qo'llab-quvvatlanadi.\n\nJavob demo rejimda shakllantirildi.";
    }

    const trimmed = String(prompt || "").trim().slice(0, 160);
    return "Savolingiz qabul qilindi: «" + trimmed + "»\n\nHozir **demo rejimdaman** — mazmunli javob bera olmayman. To'liq javob uchun:\n\n1. Sozlamalarni oching (yuqori o'ng burchak).\n2. API kalitni kiriting (OpenAI, Groq yoki OpenRouter).\n3. Model nomi va manzilni tekshiring.";
  }

  async function streamLocal(prompt, assistant, row) {
    const parts = localDemoReply(prompt).match(/\S+\s*/g) || [""];
    for (const part of parts) {
      if (!state.abort || state.abort.signal.aborted) break;
      assistant.content += part;
      updateAssistant(row, assistant);
      await sleep(18 + Math.random() * 24);
    }
    if (assistant.content) {
      const md = row.querySelector(".md");
      if (md) md.innerHTML = renderMarkdown(assistant.content);
      stickToBottom();
    }
  }

  /* ---------- Send ---------- */
  async function send(text) {
    const prompt = String(text || "").trim();
    if (!prompt || state.streaming) return;

    let chat = getActiveChat();
    if (!chat) chat = createChat(prompt);
    if (!chat.messages.length) chat.title = prompt.replace(/\s+/g, " ").slice(0, 70);

    el.input.value = "";
    autosize();
    closeSidebar();

    const userMessage = { role: "user", content: prompt };
    const assistant = { role: "assistant", content: "" };
    chat.messages.push(userMessage, assistant);
    chat.updatedAt = Date.now();

    if (!el.empty.hidden) {
      el.empty.hidden = true;
      el.messages.hidden = false;
    }

    el.messages.appendChild(userRow(userMessage));
    const row = assistantRow(assistant);
    el.messages.appendChild(row);
    stickToBottom(true);
    saveChats();
    renderSidebar();

    const history = chat.messages
      .filter((message) => !message.error && message.content.trim())
      .slice(-20)
      .map((message) => ({ role: message.role, content: message.content }));

    state.current = chat;
    state.abort = new AbortController();
    setStreamingUI(true);

    try {
      if (state.online) {
        await streamRemote(history, assistant, row);
      } else {
        await streamLocal(prompt, assistant, row);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        if (!assistant.content) {
          assistant.content = "Javob to'xtatildi.";
          const md = row.querySelector(".md");
          if (md) md.textContent = assistant.content;
        }
      } else if (error instanceof TypeError && !assistant.content) {
        state.online = false;
        updateMode();
        toast("Server bilan aloqa yo'q — demo javob");
        try {
          await streamLocal(prompt, assistant, row);
        } catch (innerError) {
          markError(row, assistant, "Javob olinmadi. Qayta urinib ko'ring.");
        }
      } else {
        markError(row, assistant, error.message || "Javob olinmadi. Qayta urinib ko'ring.");
      }
    } finally {
      if (!assistant.content && !assistant.error) {
        markError(row, assistant, "Bo'sh javob olindi. Qayta urinib ko'ring.");
      }
      if (!assistant.content) {
        chat.messages = chat.messages.filter((message) => message !== assistant);
        row.remove();
      }
      chat.updatedAt = Date.now();
      saveChats();
      renderSidebar();
      setStreamingUI(false);
      state.abort = null;
      if (window.matchMedia("(min-width: 861px)").matches) el.input.focus();
    }
  }

  function stopStream() {
    if (!state.streaming) return;
    if (state.abort) state.abort.abort();
    toast("To'xtatildi");
  }

  /* ---------- Sidebar / mobile ---------- */
  function openSidebar() {
    if (window.matchMedia("(min-width: 861px)").matches) return;
    el.sidebar.classList.add("open");
    el.overlay.hidden = false;
    el.menu.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    el.sidebar.classList.remove("open");
    el.overlay.hidden = true;
    el.menu.setAttribute("aria-expanded", "false");
  }

  /* ---------- Settings ---------- */
  function statusText(message, isError) {
    el.cfgStatus.textContent = message;
    el.cfgStatus.style.color = isError ? "#ff9b94" : "";
  }

  function openSettings() {
    const cfg = loadConfig();
    el.cfgKey.value = getKey();
    el.cfgBase.value = cfg.baseUrl;
    el.cfgModel.value = cfg.model || (state.server && state.server.model) || "gpt-4o-mini";
    statusText(
      getKey()
        ? "Kalit faol."
        : state.online
          ? "Kalit kiritilmagan — demo javoblar."
          : "Server yo'q — brauzerdagi demo javoblar.",
      false
    );
    if (typeof el.settings.showModal === "function") el.settings.showModal();
    else el.settings.setAttribute("open", "");
  }

  function closeSettings() {
    if (el.settings.open) el.settings.close();
  }

  /* ---------- Composer ---------- */
  function autosize() {
    el.input.style.height = "auto";
    el.input.style.height = Math.min(el.input.scrollHeight, 180) + "px";
  }

  /* ---------- Init ---------- */
  function init() {
    state.chats = loadChats();
    try {
      state.activeId = localStorage.getItem(ACTIVE_KEY) || "";
    } catch (error) {
      state.activeId = "";
    }
    if (!getActiveChat()) setActive("");

    renderSidebar();
    renderChat();
    updateMode();
    autosize();

    el.composer.addEventListener("submit", (event) => {
      event.preventDefault();
      send(el.input.value);
    });

    el.input.addEventListener("input", autosize);

    el.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        send(el.input.value);
      }
    });

    el.stop.addEventListener("click", stopStream);

    el.newChat.addEventListener("click", () => {
      if (state.streaming) stopStream();
      setActive("");
      renderChat();
      renderSidebar();
      closeSidebar();
      el.input.focus();
    });

    el.brand.addEventListener("click", (event) => {
      event.preventDefault();
      el.newChat.click();
    });

    el.chatList.addEventListener("click", (event) => {
      const del = event.target.closest(".chat-del");
      if (del) {
        const id = del.dataset.del;
        state.chats = state.chats.filter((chat) => chat.id !== id);
        if (state.activeId === id) {
          if (state.streaming) stopStream();
          setActive("");
          renderChat();
        }
        saveChats();
        renderSidebar();
        toast("Suhbat o'chirildi");
        return;
      }

      const open = event.target.closest(".chat-open");
      if (open) {
        if (state.streaming) stopStream();
        setActive(open.dataset.id);
        renderChat();
        renderSidebar();
        closeSidebar();
      }
    });

    el.messages.addEventListener("click", async (event) => {
      const codeCopy = event.target.closest(".code-copy");
      if (!codeCopy) return;
      const block = codeCopy.closest(".code-block");
      const code = block ? block.querySelector("pre code") : null;
      if (!code) return;
      const ok = await copyText(code.textContent);
      if (ok) {
        codeCopy.textContent = "Nusxalandi";
        setTimeout(() => {
          codeCopy.textContent = "Nusxalash";
        }, 1600);
      } else {
        toast("Nusxalab bo'lmadi");
      }
    });

    document.querySelectorAll(".suggestion").forEach((button) => {
      button.addEventListener("click", () => send(button.dataset.prompt || ""));
    });

    el.menu.addEventListener("click", openSidebar);
    el.sideClose.addEventListener("click", closeSidebar);
    el.overlay.addEventListener("click", closeSidebar);

    [el.openSettings, el.openSettings2, el.modelPill].forEach((button) => {
      button.addEventListener("click", openSettings);
    });

    el.settingsClose.addEventListener("click", closeSettings);

    el.settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const baseUrl = el.cfgBase.value.trim().replace(/\/+$/, "");
      const model = el.cfgModel.value.trim();

      if (baseUrl && !/^https?:\/\/[^\s]+$/i.test(baseUrl)) {
        statusText("API manzil http:// yoki https:// bilan boshlanishi kerak.", true);
        return;
      }

      if (model && !/^[a-zA-Z0-9._:/-]+$/.test(model)) {
        statusText("Model nomida faqat harf, raqam va . _ : / - belgilari bo'lsin.", true);
        return;
      }

      saveConfig({ baseUrl, model });
      setKey(el.cfgKey.value.trim());
      updateMode();
      statusText("Saqlandi. Kalit faqat shu sessiyada saqlanadi.", false);
      toast("Sozlamalar saqlandi");
      closeSettings();
    });

    el.cfgClear.addEventListener("click", () => {
      setKey("");
      el.cfgKey.value = "";
      updateMode();
      statusText("Kalit o'chirildi — demo javoblar.", false);
      toast("API kalit o'chirildi");
    });

    el.settings.addEventListener("close", () => statusText("", false));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSidebar();
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 861px)").matches) closeSidebar();
    });

    checkServer().then(() => {
      updateMode();
      if (!getActiveChat()) el.input.focus();
    });
  }

  init();
})();
