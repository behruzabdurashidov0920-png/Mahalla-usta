"use strict";

// Minimal .env loader — the project intentionally has no npm dependencies.
// Existing process environment variables always win over the file.

const fs = require("node:fs");
const path = require("node:path");

const ENV_FILE = path.join(__dirname, "..", ".env");

function unquote(value) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return quoted ? trimmed.slice(1, -1) : trimmed;
}

function load() {
  let raw;
  try {
    raw = fs.readFileSync(ENV_FILE, "utf8");
  } catch (error) {
    return { loaded: false, keys: [] };
  }

  const keys = [];

  raw.split(/\r?\n/).forEach((line) => {
    const text = line.trim();
    if (!text || text.startsWith("#")) return;

    const index = text.indexOf("=");
    if (index < 1) return;

    const name = text.slice(0, index).trim();
    const value = unquote(text.slice(index + 1));

    if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) return;
    if (process.env[name] !== undefined) return;

    process.env[name] = value;
    keys.push(name);
  });

  return { loaded: true, keys };
}

module.exports = { load };
