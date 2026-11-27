// Daily job: append the latest Worker news items to magazine/archive.json so the
// magazine can keep older stories scrollable after they roll out of the live
// 30-item feed. Also refreshes magazine/snapshot.js (the offline fallback).
// Archive items are stored slim (title, originalTitle, url, publishedAt) and the
// page keeps rendering them as "עדכון אוטומטי · טרם נבדק מול המקור" rows.

import { readFileSync, writeFileSync } from "node:fs";

const FEED = "https://sunoisrael.com/api/public/content?type=news&limit=30";
const ARCHIVE_PATH = "magazine/archive.json";
const SNAPSHOT_PATH = "magazine/snapshot.js";

const clean = (value, max) =>
  String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

function slim(item) {
  const url = String(item.url ?? "");
  if (!/^https:\/\//i.test(url) || url.length > 1000) return null;
  const publishedAt = String(item.publishedAt ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) return null;
  const title = clean(item.title, 200);
  if (!title) return null;
  return { title, originalTitle: clean(item.originalTitle, 300), url, publishedAt };
}

async function fetchFeed() {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(FEED, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) throw new Error("feed has no items array");
      return data.items;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5000 * (attempt + 1)));
    }
  }
  throw lastError;
}

const raw = await fetchFeed();
const fresh = raw.map(slim).filter(Boolean);
if (fresh.length < 10) throw new Error(`Only ${fresh.length} usable feed items; refusing to run`);

let before = [];
try {
  const parsed = JSON.parse(readFileSync(ARCHIVE_PATH, "utf8"));
  before = Array.isArray(parsed) ? parsed : parsed.items ?? [];
} catch {
  before = [];
}

const seen = new Set(before.map((item) => item.url));
const added = fresh.filter((item) => !seen.has(item.url));
const merged = [...before, ...added];
merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0));

if (merged.length < before.length) {
  throw new Error(`Archive would shrink from ${before.length} to ${merged.length}`);
}

writeFileSync(
  ARCHIVE_PATH,
  `${JSON.stringify({ updated: new Date().toISOString().slice(0, 10), items: merged }, null, 2)}\n`,
  "utf8"
);

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  SNAPSHOT_PATH,
  `/* Offline fallback only: titles and links, no summaries. Taken ${today} */\nwindow.AIMA_SNAPSHOT=${JSON.stringify(fresh)};\n`,
  "utf8"
);

console.log(`archive: ${before.length} -> ${merged.length} (${added.length} new); snapshot refreshed with ${fresh.length} items`);
