"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "public");
const PORT = Number(process.env.PORT) || 3100;

const ENV_KEY = (process.env.OPENAI_API_KEY || "").trim();
const ENV_BASE = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const ENV_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const PUBLIC_EXTENSIONS = new Set([".html", ".css", ".js", ".png", ".jpg", ".svg", ".webp", ".ico"]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function readJson(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(Object.assign(new Error("bad_json"), { status: 400 }));
      }
    });

    req.on("error", reject);
  });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeMessages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .filter((message) => message && ["user", "assistant", "system"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 12000),
    }))
    .filter((message) => message.content.trim().length > 0)
    .slice(-40);
}

function normalizeBase(url) {
  const value = String(url || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s]+$/i.test(value)) return null;
  return value;
}

/* ---------- Demo replies ---------- */
function demoReply(prompt) {
  const text = String(prompt || "").toLowerCase();

  if (/(salom|assalom|hayrli|xayrli)/.test(text)) {
    return "Assalomu alaykum! Men ChatGPT demo nusxasiman.\n\nHozir API kaliti ulanmagan, shuning uchun namuna javoblar beraman. **Sozlamalar** oynasida API kalitni kiritib haqiqiy modelni yoqishingiz mumkin.";
  }

  if (/(nima qila|yordam|imkoniyat|mumkinmi)/.test(text)) {
    return "Hozirgi demo rejimda quyidagilarni ko'rsatib bera olaman:\n\n- matnni formatlash (sarlavha, **qalin**, `kod`)\n- kod bloklarini chiqarish va nusxalash\n- suhbatlar tarixini saqlash va qidirish\n- mobil qurilmada qulay ko'rinish\n\nHaqiqiy savol-javob uchun sozlamalarda API kalitini kiriting yoki serverni `OPENAI_API_KEY` bilan qayta ishga tushiring.";
  }

  if (/(kod|code|funksiya|programma|javascript)/.test(text)) {
    return "Mana, kod bloklarini qanday chiqarishimning namunasi:\n\n```js\nfunction salomlash(ism) {\n  return `Salom, ${ism}!`;\n}\n\nconsole.log(salomlash(\"Dunyo\"));\n```\n\nYuqoridagi blokning o'ng burchagidagi **Nusxalash** tugmasi bilan kodni ko'chirib olishingiz mumkin.";
  }

  if (/(markdown|format|jadval|ro'yxat)/.test(text)) {
    return "Markdown namunalari:\n\n## Sarlavha\n\n- birinchi band\n- ikkinchi band\n- `inline kod` va **qalin** matn\n\n> Iqtibos ham qo'llab-quvvatlanadi.\n\nBu javob demo rejimda shakllantirildi.";
  }

  if (/(tarjima|translate)/.test(text)) {
    return "Tarjima qilish uchun haqiqiy model kerak. **Sozlamalar** bo'limiga OpenAI, Groq yoki OpenRouter API kalitini kiriting — shundan so'ng tarjima va boshqa savollarga to'liq javob olasiz.";
  }

  const trimmed = String(prompt || "").trim().slice(0, 160);
  return `Savolingiz qabul qilindi: «${trimmed}»\n\nHozir **demo rejimdaman** — mazmunli javob bera olmayman. To'liq javoblar uchun:\n\n1. Sozlamalarni oching (yuqori o'ng burchak).\n2. API kalitni kiriting (masalan, OpenAI yoki Groq).\n3. Model nomini va manzilni tekshiring.\n\nYoki serverni \`OPENAI_API_KEY\` muhit o'zgaruvchisi bilan ishga tushiring.`;
}

/* ---------- Streaming ---------- */
function sseStart(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");
}

function sseSend(res, data) {
  if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sseEnd(res) {
  if (!res.writableEnded) {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

async function streamDemo(res, prompt) {
  let closed = false;
  res.on("close", () => {
    closed = true;
  });

  const parts = demoReply(prompt).match(/\S+\s*/g) || [""];

  for (const part of parts) {
    if (closed) return;
    sseSend(res, { delta: part });
    await delay(22 + Math.random() * 26);
  }

  sseSend(res, { done: true });
  sseEnd(res);
}

function friendlyError(status) {
  if (status === 401 || status === 403) return "API kaliti noto'g'ri yoki ruxsat yo'q (401/403).";
  if (status === 404) return "Model yoki API manzili topilmadi (404). Sozlamalardagi manzilni tekshiring.";
  if (status === 429) return "So'rovlar limiti tugadi (429). Birozdan so'ng qayta urinib ko'ring.";
  return `API xatosi (${status}).`;
}

async function streamUpstream(res, { key, baseUrl, model, messages }) {
  const controller = new AbortController();
  res.on("close", () => controller.abort());

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: controller.signal,
  });

  if (!upstream.ok) {
    let detail = "";
    try {
      const payload = await upstream.json();
      detail = payload?.error?.message || "";
    } catch (error) {
      /* javob JSON emas */
    }
    sseSend(res, { error: detail ? `${friendlyError(upstream.status)} ${detail}` : friendlyError(upstream.status) });
    sseEnd(res);
    return;
  }

  const reader = upstream.body.getReader();
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

        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch (error) {
          continue;
        }

        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) sseSend(res, { delta });
      }
    }
  }

  sseSend(res, { done: true });
  sseEnd(res);
}

/* ---------- API ---------- */
async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/config") {
    return sendJson(res, 200, { demo: !ENV_KEY, model: ENV_MODEL });
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    const body = await readJson(req);
    const messages = normalizeMessages(body.messages);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return sendJson(res, 400, { error: "Xabar bo'sh." });
    }

    const key = (typeof body.key === "string" && body.key.trim()) || ENV_KEY;
    const baseUrl = normalizeBase(body.baseUrl) || ENV_BASE;
    const model = String(body.model || ENV_MODEL).trim().slice(0, 80) || ENV_MODEL;

    if (!normalizeBase(baseUrl)) {
      return sendJson(res, 400, { error: "API manzili noto'g'ri." });
    }

    sseStart(res);

    if (!key) {
      return streamDemo(res, messages[messages.length - 1].content);
    }

    try {
      await streamUpstream(res, { key, baseUrl, model, messages });
    } catch (error) {
      if (error.name !== "AbortError") {
        sseSend(res, { error: "API bilan aloqa o'rnatilmadi. Manzil va internetni tekshiring." });
        sseEnd(res);
      } else if (!res.writableEnded) {
        res.end();
      }
    }
    return;
  }

  return false;
}

/* ---------- Static ---------- */
function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (error) {
    return sendJson(res, 400, { error: "bad_path" });
  }

  if (pathname === "/") pathname = "/index.html";
  if (!path.extname(pathname)) pathname += ".html";

  if (pathname.split("/").some((segment) => segment.startsWith("."))) {
    return sendJson(res, 404, { error: "not_found" });
  }

  const filePath = path.join(ROOT, path.normalize(pathname));
  const extension = path.extname(filePath).toLowerCase();

  if (!filePath.startsWith(ROOT + path.sep) || !PUBLIC_EXTENSIONS.has(extension)) {
    return sendJson(res, 404, { error: "not_found" });
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return sendJson(res, 404, { error: "not_found" });

    res.writeHead(200, {
      "Content-Type": MIME[extension] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });

    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  try {
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (handled === false) sendJson(res, 404, { error: "not_found" });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { error: "method_not_allowed" });
    }

    serveStatic(req, res);
  } catch (error) {
    const status = error.status || 500;
    if (!res.headersSent) {
      sendJson(res, status, { error: status === 500 ? "server_error" : error.message });
    } else if (!res.writableEnded) {
      res.end();
    }
    if (status === 500) console.error(error);
  }
});

server.listen(PORT, () => {
  console.log(`ChatGPT demo: http://localhost:${PORT}`);
  console.log(ENV_KEY ? `AI rejim: ${ENV_MODEL} ulangan` : "Demo rejim: API kaliti kiritilmagan");
});
