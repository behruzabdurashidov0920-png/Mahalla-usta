"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const store = require("./lib/store");
const ai = require("./lib/ai");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE = "mu_session";
const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

const PUBLIC_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".ico",
  ".woff2",
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const SERVER_FILES = new Set(["/server.js", "/package.json", "/package-lock.json"]);
const SERVER_DIRS = ["/lib/", "/data/", "/node_modules/", "/chatgpt/"];

const db = store.load();

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

function readJson(req, limit = 32 * 1024) {
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

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || "";

  header.split(";").forEach((part) => {
    const index = part.indexOf("=");
    if (index > 0) {
      const name = part.slice(0, index).trim();
      cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
    }
  });

  return cookies;
}

function currentUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  return token ? store.verifyToken(token) : null;
}

function sessionCookie(token, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (maxAgeSeconds) parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join("; ");
}

/* ---------- Login rate limiting ---------- */
const loginAttempts = new Map();

function isBlocked(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= 8;
}

function noteAttempt(ip, success) {
  const now = Date.now();

  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
  } else {
    entry.count += 1;
  }
}

const clean = (value, max = 80) =>
  String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

/* ---------- API ---------- */
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const ip = req.socket.remoteAddress || "local";

  if (route === "GET /api/masters/locations") {
    return sendJson(res, 200, { locations: store.shareableMasterLocations() });
  }

  if (route === "POST /api/auth/login") {
    const body = await readJson(req);

    if (isBlocked(ip)) {
      return sendJson(res, 429, { error: "rate_limited" });
    }

    const user = store.findUser(body.login);
    const valid = store.verifyPassword(user, body.password);

    if (!valid) {
      noteAttempt(ip, false);
      return sendJson(res, 401, { error: "invalid_credentials" });
    }

    noteAttempt(ip, true);

    const remember = Boolean(body.remember);
    const maxAge = remember ? REMEMBER_MS : SESSION_MS;
    const token = store.createToken(user, maxAge);

    store.touchLogin(user);
    res.setHeader("Set-Cookie", sessionCookie(token, remember ? maxAge / 1000 : null));
    return sendJson(res, 200, { ok: true, user: store.publicUser(user) });
  }

  if (route === "POST /api/auth/logout") {
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    return sendJson(res, 200, { ok: true });
  }

  if (route === "GET /api/auth/me") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });
    return sendJson(res, 200, { user: store.publicUser(user) });
  }

  if (route === "GET /api/data") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });

    return sendJson(res, 200, {
      user: store.publicUser(user),
      orders: db.orders,
      masters: db.masters,
      clients: db.clients,
      subscriptions: db.subscriptions,
      stats: db.stats,
    });
  }

  if (route === "GET /api/profile") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });

    return sendJson(res, 200, { user: store.publicUser(user), profile: store.getProfile(user) });
  }

  if (route === "POST /api/profile") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });

    const body = await readJson(req);

    const name = clean(body.name, 60);
    const email = clean(body.email, 80).toLowerCase();
    const phone = clean(body.phone, 24).replace(/\D/g, "");
    const district = clean(body.district, 40);

    if (name.length < 3) return sendJson(res, 400, { error: "invalid_name" });
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return sendJson(res, 400, { error: "invalid_email" });
    if (phone.length !== 12) return sendJson(res, 400, { error: "invalid_phone" });
    if (district.length < 2) return sendJson(res, 400, { error: "invalid_district" });

    const result = store.updateProfile(user, {
      name,
      email,
      phone,
      district,
      notifySms: Boolean(body.notifySms),
      notifyPush: Boolean(body.notifyPush),
    });

    if (result.error) return sendJson(res, 409, { error: result.error });
    return sendJson(res, 200, result);
  }

  if (route === "POST /api/profile/location") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });

    const body = await readJson(req);
    if (typeof body.share !== "boolean") {
      return sendJson(res, 400, { error: "invalid_location" });
    }

    const result = store.updateMasterLocation(user, {
      share: body.share,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    if (result.error === "master_only") return sendJson(res, 403, { error: result.error });
    if (result.error) return sendJson(res, 400, { error: result.error });
    return sendJson(res, 200, result);
  }

  if (route === "POST /api/profile/password") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });

    const body = await readJson(req);
    const result = store.changePassword(user, String(body.current || ""), String(body.next || ""));

    if (result.error) return sendJson(res, 400, { error: result.error });

    const remember = Boolean(body.remember);
    const token = store.createToken(user, remember ? REMEMBER_MS : SESSION_MS);
    res.setHeader("Set-Cookie", sessionCookie(token, remember ? REMEMBER_MS / 1000 : null));

    return sendJson(res, 200, { ok: true });
  }

  if (route === "POST /api/chat") {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });

    const body = await readJson(req);
    const message = clean(body.message, 600);
    const lang = ai.LANGS.includes(body.lang) ? body.lang : "uz";

    if (!message) return sendJson(res, 400, { error: "empty_message" });
    return sendJson(res, 200, { reply: ai.reply(message, db, lang), lang });
  }

  if (route === "POST /api/requests") {
    const body = await readJson(req);

    const name = clean(body.name, 60);
    const phone = clean(body.phone, 24);
    const service = clean(body.service, 60);
    const district = clean(body.district, 60);
    const master = clean(body.master, 60);
    const plan = store.PLANS[body.plan] && body.plan !== "standart" ? body.plan : "";
    const billing = body.billing === "yearly" ? "yearly" : "monthly";
    const kind = ["master", "subscription"].includes(body.kind) ? body.kind : "request";

    if (
      name.length < 2 ||
      district.length < 2 ||
      phone.replace(/\D/g, "").length !== 12 ||
      (kind === "subscription" ? !plan : !service)
    ) {
      return sendJson(res, 400, { error: "invalid_input" });
    }

    const result = store.addRequest({ kind, name, phone, service, district, master, plan, billing });
    const record = result.order || result.subscription || null;

    return sendJson(res, 201, {
      ok: true,
      kind: result.kind,
      id: record ? record.id : null,
      plan: record && record.plan ? record.plan : null,
    });
  }

  return false;
}

/* ---------- Static files ---------- */
function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (error) {
    return sendJson(res, 400, { error: "bad_path" });
  }

  if (pathname === "/") pathname = "/index.html";
  if (!path.extname(pathname)) pathname += ".html";

  const segments = pathname.split("/");
  if (segments.some((segment) => segment.startsWith("."))) {
    return sendJson(res, 404, { error: "not_found" });
  }

  const lower = pathname.toLowerCase();
  if (SERVER_FILES.has(lower) || SERVER_DIRS.some((dir) => lower.startsWith(dir))) {
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
      "Cache-Control":
        extension === ".html" || extension === ".js" || extension === ".css"
          ? "no-cache"
          : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    });

    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------- Server ---------- */
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
      sendJson(res, status, {
        error: status === 500 ? "server_error" : error.message,
      });
    } else {
      res.end();
    }
    if (status === 500) console.error(error);
  }
});

server.listen(PORT, () => {
  console.log(`MahallaUsta server: http://localhost:${PORT}`);
  console.log(`Admin: admin@mahallausta.uz (parolni ADMIN_PASSWORD bilan o'zgartirish mumkin)`);
});
