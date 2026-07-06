// db.js
// A tiny file-backed JSON datastore. Zero native dependencies so it installs
// anywhere instantly. Swap this module out for Postgres/Mongo/etc later —
// every route only talks to the functions exported here, never to the file
// directly, so the storage engine can change without touching route code.

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");

function load() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error("Database file missing. Run `npm run seed` first.");
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Generic collection helpers -------------------------------------------------

function all(collection) {
  const data = load();
  return data[collection] || [];
}

function findById(collection, id) {
  return all(collection).find((row) => String(row.id) === String(id));
}

function insert(collection, row) {
  const data = load();
  if (!data[collection]) data[collection] = [];
  data[collection].push(row);
  save(data);
  return row;
}

function update(collection, id, patch) {
  const data = load();
  const rows = data[collection] || [];
  const idx = rows.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch };
  save(data);
  return rows[idx];
}

function remove(collection, id) {
  const data = load();
  const rows = data[collection] || [];
  const next = rows.filter((r) => String(r.id) !== String(id));
  data[collection] = next;
  save(data);
  return next.length !== rows.length;
}

function replaceAll(collection, rows) {
  const data = load();
  data[collection] = rows;
  save(data);
  return rows;
}

module.exports = { load, save, all, findById, insert, update, remove, replaceAll };
