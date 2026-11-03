"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const ESTIMATES = {
  Santexnika: 180000,
  "Elektr ishlari": 240000,
  Duradgorlik: 420000,
  "Bo'yash va suvoq": 800000,
  "Plitka va kafel": 1200000,
  Konditsioner: 300000,
};

const SEED_ORDERS = [
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

const SEED_MASTERS = [
  { name: "Aziz Karimov", spec: "Santexnik", district: "Chilonzor", rating: 4.9, jobs: 128, status: "active" },
  { name: "Dilnoza Yusupova", spec: "Bo'yoqchi", district: "Yunusobod", rating: 5.0, jobs: 96, status: "active" },
  { name: "Sardor Toshmatov", spec: "Elektrik", district: "Mirzo Ulug'bek", rating: 4.8, jobs: 211, status: "busy" },
  { name: "Rustam Qodirov", spec: "Duradgor", district: "Sergeli", rating: 4.7, jobs: 74, status: "active" },
  { name: "Bekzod Umarov", spec: "Konditsioner ustasi", district: "Yakkasaroy", rating: 4.9, jobs: 163, status: "active" },
];

const SEED_CLIENTS = [
  { name: "Nilufar Rahimova", phone: "+998 90 123 45 67", orders: 12, last: "27.10.2026", status: "active" },
  { name: "Jasur Tursunov", phone: "+998 93 555 12 34", orders: 8, last: "26.10.2026", status: "active" },
  { name: "Malika Karimova", phone: "+998 97 700 88 21", orders: 5, last: "25.10.2026", status: "active" },
  { name: "Olim Rasulov", phone: "+998 91 234 56 78", orders: 3, last: "24.10.2026", status: "inactive" },
  { name: "Shahnoza Mirzayeva", phone: "+998 88 909 11 22", orders: 9, last: "23.10.2026", status: "active" },
  { name: "Anvar Saidov", phone: "+998 90 987 65 43", orders: 2, last: "21.10.2026", status: "active" },
];

const SEED_STATS = {
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
};

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function buildUser({ name, email, phone, password }) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    id: "u1",
    name,
    email,
    phone,
    role: "Administrator",
    salt,
    passwordHash: hashPassword(password, salt),
  };
}

function createSeed() {
  return {
    secret: crypto.randomBytes(32).toString("hex"),
    nextOrder: 1049,
    users: [
      buildUser({
        name: process.env.ADMIN_NAME || "Bekzod Admin",
        email: (process.env.ADMIN_EMAIL || "admin@mahallausta.uz").toLowerCase(),
        phone: (process.env.ADMIN_PHONE || "998901234567").replace(/\D/g, ""),
        password: process.env.ADMIN_PASSWORD || "admin123",
      }),
    ],
    orders: SEED_ORDERS,
    masters: SEED_MASTERS,
    clients: SEED_CLIENTS,
    stats: SEED_STATS,
    applications: [],
    seededAt: new Date().toISOString(),
  };
}

let db = null;

function load() {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (error) {
      console.error("db.json o'qib bo'lmadi, yangi baza yaratiladi:", error.message);
      db = null;
    }
  }

  if (!db) {
    db = createSeed();
    save();
  }

  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function findUser(login) {
  const value = String(login || "").trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  return (
    db.users.find(
      (user) => user.email === value || (digits.length > 0 && user.phone === digits)
    ) || null
  );
}

function verifyPassword(user, password) {
  if (!user || typeof password !== "string") return false;
  const attempt = Buffer.from(hashPassword(password, user.salt), "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  return (
    attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected)
  );
}

function publicUser(user) {
  return { name: user.name, email: user.email, phone: user.phone, role: user.role };
}

function createToken(user, maxAgeMs) {
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, exp: Date.now() + maxAgeMs })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", db.secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (typeof token !== "string") return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", db.secret)
    .update(payload)
    .digest("base64url");
  const received = Buffer.from(signature);
  const check = Buffer.from(expected);

  if (received.length !== check.length || !crypto.timingSafeEqual(received, check)) {
    return null;
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }

  if (!data || typeof data.exp !== "number" || data.exp < Date.now()) return null;
  return db.users.find((user) => user.id === data.sub) || null;
}

function clock(now) {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(now)
    .replace(/\//g, ".");

  return { time, date };
}

function addRequest({ kind, name, phone, service, district, master }) {
  const now = new Date();
  const { time, date } = clock(now);

  if (kind === "master") {
    db.applications.push({
      id: `APP-${db.applications.length + 1}`,
      name,
      phone,
      service,
      district,
      createdAt: now.toISOString(),
    });
    save();
    return { kind: "master" };
  }

  const order = {
    id: `MU-${db.nextOrder++}`,
    client: name,
    phone,
    district,
    service,
    master: master || "Biriktirilmagan",
    amount: ESTIMATES[service] || 0,
    status: "new",
    time,
    createdAt: now.toISOString(),
  };

  db.orders.unshift(order);
  db.stats.ordersTotal += 1;
  db.stats.ordersToday += 1;
  db.stats.newToday += 1;

  const digits = phone.replace(/\D/g, "");
  const client = db.clients.find((item) => item.phone.replace(/\D/g, "") === digits);

  if (client) {
    client.orders += 1;
    client.last = date;
    client.status = "active";
  } else {
    db.clients.unshift({ name, phone, orders: 1, last: date, status: "active" });
    db.stats.clientsTotal += 1;
  }

  save();
  return { kind: "request", order };
}

module.exports = {
  load,
  findUser,
  verifyPassword,
  publicUser,
  createToken,
  verifyToken,
  addRequest,
};
