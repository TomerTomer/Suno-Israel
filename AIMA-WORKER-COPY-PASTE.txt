const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_APPROVED_BYTES = 2 * 1024 * 1024;
const GLOBAL_REQUEST_LIMIT_PER_24_HOURS = 50;
const GLOBAL_PENDING_REQUEST_LIMIT = 100;
const GLOBAL_VOTE_LIMIT_PER_DAY = 5000;
const VOTER_LIMIT_PER_DAY = 10;
const SITE_ORIGIN = "https://sunoisrael.com";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "same-origin",
      ...extraHeaders,
    },
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().replace(/[\u0000-\u001f\u007f]/gu, "").slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function requestOriginAllowed(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === SITE_ORIGIN;
}

function adminEmail(request) {
  return clean(request.headers.get("cf-access-authenticated-user-email"), 160).toLowerCase();
}

function requireAdmin(request, env) {
  const expected = clean(env.ADMIN_EMAIL, 160).toLowerCase();
  return expected && adminEmail(request) === expected;
}

async function fingerprint(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const input = new TextEncoder().encode(`${ip}:${env.RATE_LIMIT_SALT}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(digest)].slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function dailyVoteFingerprint(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const agent = clean(request.headers.get("user-agent"), 180);
  const day = new Date().toISOString().slice(0, 10);
  const input = new TextEncoder().encode(`${ip}:${agent}:${day}:${env.RATE_LIMIT_SALT}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(digest)].slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

let votingSchemaReady;
function ensureVotingSchema(env) {
  votingSchemaReady ||= env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS artist_vote_totals (artist_name TEXT PRIMARY KEY COLLATE NOCASE, votes INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now')))"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS artist_vote_receipts (artist_name TEXT NOT NULL COLLATE NOCASE, voter_key TEXT NOT NULL, vote_day TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (artist_name, voter_key, vote_day))"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS artist_vote_receipts_voter_day ON artist_vote_receipts(voter_key, vote_day)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS artist_vote_receipts_day ON artist_vote_receipts(vote_day)"),
  ]).catch((error) => {
    votingSchemaReady = undefined;
    throw error;
  });
  return votingSchemaReady;
}

async function knownArtistName(name) {
  const response = await fetch(new URL("/content/artists.json", SITE_ORIGIN), {
    headers: { accept: "application/json" },
    cf: { cacheEverything: true, cacheTtl: 300 },
  });
  if (!response.ok) return false;
  const artists = await response.json();
  return Array.isArray(artists) && artists.some((artist) => artist && typeof artist.name === "string" && artist.name.trim() === name);
}

function extensionFor(type) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" })[type] || "bin";
}

async function submitPhotoRequest(request, env) {
  if (!requestOriginAllowed(request)) return json({ message: "\u05de\u05e7\u05d5\u05e8 \u05d4\u05d1\u05e7\u05e9\u05d4 \u05d0\u05d9\u05e0\u05d5 \u05de\u05d5\u05e8\u05e9\u05d4." }, 403);
  const data = await request.formData();
  if (clean(data.get("website"), 50)) return json({ ok: true }, 202);
  const artistName = clean(data.get("artistName"), 140);
  const submitterName = clean(data.get("submitterName"), 90);
  const email = clean(data.get("email"), 160).toLowerCase();
  const note = clean(data.get("note"), 300);
  const consent = data.get("consent") === "yes";
  const image = data.get("image");
  if (!artistName || !submitterName || !validEmail(email) || !consent) return json({ message: "\u05d7\u05e1\u05e8\u05d9\u05dd \u05e4\u05e8\u05d8\u05d9\u05dd \u05d0\u05d5 \u05d0\u05d9\u05e9\u05d5\u05e8 \u05dc\u05e4\u05e8\u05e1\u05d5\u05dd \u05d4\u05ea\u05de\u05d5\u05e0\u05d4." }, 400);
  if (!(await knownArtistName(artistName))) return json({ message: "\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc \u05d4\u05d0\u05de\u05df \u05e9\u05e0\u05d1\u05d7\u05e8 \u05d0\u05d9\u05e0\u05d5 \u05e7\u05d9\u05d9\u05dd \u05db\u05e8\u05d2\u05e2 \u05d1\u05de\u05d0\u05d2\u05e8." }, 400);
  if (!(image instanceof File) || !ALLOWED_IMAGE_TYPES.has(image.type) || image.size === 0 || image.size > MAX_UPLOAD_BYTES) return json({ message: "\u05e7\u05d5\u05d1\u05e5 \u05d4\u05ea\u05de\u05d5\u05e0\u05d4 \u05d0\u05d9\u05e0\u05d5 \u05ea\u05e7\u05d9\u05df \u05d0\u05d5 \u05d2\u05d3\u05d5\u05dc \u05de-6MB." }, 400);

  const clientFingerprint = await fingerprint(request, env);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM photo_requests WHERE client_fingerprint = ? AND submitted_at > datetime('now', '-1 day')").bind(clientFingerprint).first();
  if (Number(recent?.count || 0) >= 5) return json({ message: "\u05e0\u05e9\u05dc\u05d7\u05d5 \u05d9\u05d5\u05ea\u05e8 \u05de\u05d3\u05d9 \u05d1\u05e7\u05e9\u05d5\u05ea \u05de\u05d4\u05de\u05db\u05e9\u05d9\u05e8 \u05d4\u05d6\u05d4. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1 \u05de\u05d7\u05e8." }, 429);

  const id = crypto.randomUUID();
  const pendingKey = `pending/${id}.${extensionFor(image.type)}`;
  const reservation = await env.DB.prepare(`
    INSERT INTO photo_requests (
      id, artist_name, submitter_name, email, note,
      pending_object_key, original_type, client_fingerprint
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (
      SELECT COUNT(*)
      FROM photo_requests
      WHERE submitted_at > datetime('now', '-1 day')
    ) < ?
    AND (
      SELECT COUNT(*)
      FROM photo_requests
      WHERE status = 'pending'
    ) < ?
  `).bind(
    id,
    artistName,
    submitterName,
    email,
    note,
    pendingKey,
    image.type,
    clientFingerprint,
    GLOBAL_REQUEST_LIMIT_PER_24_HOURS,
    GLOBAL_PENDING_REQUEST_LIMIT,
  ).run();

  if (Number(reservation.meta?.changes || 0) !== 1) {
    return json({ message: "\u05de\u05db\u05e1\u05ea \u05d4\u05d1\u05d8\u05d9\u05d7\u05d5\u05ea \u05e9\u05dc \u05de\u05e2\u05e8\u05db\u05ea \u05d4\u05d1\u05e7\u05e9\u05d5\u05ea \u05d4\u05ea\u05de\u05dc\u05d0\u05d4. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1 \u05de\u05d0\u05d5\u05d7\u05e8 \u05d9\u05d5\u05ea\u05e8." }, 429, { "retry-after": "3600" });
  }

  try {
    await env.IMAGES.put(pendingKey, image.stream(), {
      httpMetadata: { contentType: image.type, cacheControl: "private, no-store" },
      customMetadata: { requestId: id },
    });
  } catch (error) {
    await env.DB.prepare("DELETE FROM photo_requests WHERE id = ?").bind(id).run();
    throw error;
  }
  return json({ ok: true, id }, 201);
}

async function listArtistImages(env) {
  const result = await env.DB.prepare("SELECT artist_name, object_key, version FROM artist_images ORDER BY artist_name COLLATE NOCASE").all();
  const items = result.results.map((row) => ({
    artistName: row.artist_name,
    image: `/api/public/artist-images/${encodeURIComponent(String(row.object_key).replace(/^approved\//u, ""))}?v=${row.version}`,
  }));
  return json({ items });
}

async function listArtistVotes(env) {
  await ensureVotingSchema(env);
  const result = await env.DB.prepare("SELECT artist_name, votes FROM artist_vote_totals ORDER BY votes DESC, artist_name COLLATE NOCASE").all();
  return json({
    items: result.results.map((row) => ({ artistName: row.artist_name, votes: Number(row.votes || 0) })),
  });
}

async function submitArtistVote(request, env) {
  if (!requestOriginAllowed(request)) return json({ message: "\u05de\u05e7\u05d5\u05e8 \u05d4\u05d1\u05e7\u05e9\u05d4 \u05d0\u05d9\u05e0\u05d5 \u05de\u05d5\u05e8\u05e9\u05d4." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ message: "\u05d4\u05d1\u05e7\u05e9\u05d4 \u05d0\u05d9\u05e0\u05d4 \u05ea\u05e7\u05d9\u05e0\u05d4." }, 415);
  const body = await request.json().catch(() => ({}));
  const artistName = clean(body.artistName, 140);
  if (!artistName || !(await knownArtistName(artistName))) return json({ message: "\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc \u05d4\u05d0\u05de\u05df \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0." }, 400);

  await ensureVotingSchema(env);
  const voterKey = await dailyVoteFingerprint(request, env);
  const voteDay = new Date().toISOString().slice(0, 10);
  const existing = await env.DB.prepare("SELECT 1 AS found FROM artist_vote_receipts WHERE artist_name = ? COLLATE NOCASE AND voter_key = ? AND vote_day = ?").bind(artistName, voterKey, voteDay).first();
  if (existing) return json({ message: "\u05d4\u05e7\u05d5\u05dc \u05e9\u05dc\u05db\u05dd \u05dc\u05d0\u05de\u05df \u05d4\u05d6\u05d4 \u05db\u05d1\u05e8 \u05e0\u05e9\u05de\u05e8 \u05d4\u05d9\u05d5\u05dd. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d7\u05d6\u05d5\u05e8 \u05de\u05d7\u05e8." }, 409);

  const reservation = await env.DB.prepare(`
    INSERT OR IGNORE INTO artist_vote_receipts (artist_name, voter_key, vote_day)
    SELECT ?, ?, ?
    WHERE (SELECT COUNT(*) FROM artist_vote_receipts WHERE vote_day = ?) < ?
      AND (SELECT COUNT(*) FROM artist_vote_receipts WHERE voter_key = ? AND vote_day = ?) < ?
  `).bind(artistName, voterKey, voteDay, voteDay, GLOBAL_VOTE_LIMIT_PER_DAY, voterKey, voteDay, VOTER_LIMIT_PER_DAY).run();
  if (Number(reservation.meta?.changes || 0) !== 1) return json({ message: "\u05de\u05db\u05e1\u05ea \u05d4\u05d4\u05e6\u05d1\u05e2\u05d5\u05ea \u05d4\u05d9\u05d5\u05de\u05d9\u05ea \u05d4\u05d2\u05d9\u05e2\u05d4 \u05dc\u05de\u05d2\u05d1\u05dc\u05ea \u05d4\u05d1\u05d8\u05d9\u05d7\u05d5\u05ea. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1 \u05de\u05d7\u05e8." }, 429, { "retry-after": "3600" });

  try {
    await env.DB.prepare("INSERT INTO artist_vote_totals (artist_name, votes, updated_at) VALUES (?, 1, datetime('now')) ON CONFLICT(artist_name) DO UPDATE SET votes = votes + 1, updated_at = datetime('now')").bind(artistName).run();
  } catch (error) {
    await env.DB.prepare("DELETE FROM artist_vote_receipts WHERE artist_name = ? COLLATE NOCASE AND voter_key = ? AND vote_day = ?").bind(artistName, voterKey, voteDay).run();
    throw error;
  }
  const total = await env.DB.prepare("SELECT votes FROM artist_vote_totals WHERE artist_name = ? COLLATE NOCASE").bind(artistName).first();
  return json({ ok: true, artistName, votes: Number(total?.votes || 1) }, 201);
}

async function serveApprovedImage(filename, env) {
  if (!/^artist-[a-f0-9-]+\.webp$/u.test(filename)) return new Response("Not found", { status: 404 });
  const object = await env.IMAGES.get(`approved/${filename}`);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}

async function listPending(env) {
  const result = await env.DB.prepare("SELECT id, artist_name, submitter_name, email, note, submitted_at FROM photo_requests WHERE status = 'pending' ORDER BY submitted_at ASC LIMIT 100").all();
  return json({
    items: result.results.map((row) => ({
      id: row.id,
      artistName: row.artist_name,
      submitterName: row.submitter_name,
      email: row.email,
      note: row.note,
      submittedAt: row.submitted_at,
      preview: `/api/admin/photo-requests/${row.id}/image`,
    })),
  });
}

async function pendingRecord(id, env) {
  return env.DB.prepare("SELECT * FROM photo_requests WHERE id = ? AND status = 'pending'").bind(id).first();
}

async function servePendingImage(id, env) {
  const record = await pendingRecord(id, env);
  if (!record) return new Response("Not found", { status: 404 });
  const object = await env.IMAGES.get(record.pending_object_key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff" });
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}

async function approveRequest(request, id, env) {
  if (!requestOriginAllowed(request)) return json({ message: "\u05de\u05e7\u05d5\u05e8 \u05d4\u05d1\u05e7\u05e9\u05d4 \u05d0\u05d9\u05e0\u05d5 \u05de\u05d5\u05e8\u05e9\u05d4." }, 403);
  if (request.headers.get("content-type") !== "image/webp") return json({ message: "\u05d4\u05ea\u05de\u05d5\u05e0\u05d4 \u05d4\u05de\u05d0\u05d5\u05e9\u05e8\u05ea \u05d7\u05d9\u05d9\u05d1\u05ea \u05dc\u05d4\u05d9\u05d5\u05ea WebP." }, 415);
  const record = await pendingRecord(id, env);
  if (!record) return json({ message: "\u05d4\u05d1\u05e7\u05e9\u05d4 \u05db\u05d1\u05e8 \u05d8\u05d5\u05e4\u05dc\u05d4 \u05d0\u05d5 \u05e9\u05d0\u05d9\u05e0\u05d4 \u05e7\u05d9\u05d9\u05de\u05ea." }, 404);
  const image = await request.arrayBuffer();
  if (!image.byteLength || image.byteLength > MAX_APPROVED_BYTES) return json({ message: "\u05d4\u05ea\u05de\u05d5\u05e0\u05d4 \u05d4\u05de\u05e2\u05d5\u05d1\u05d3\u05ea \u05d0\u05d9\u05e0\u05d4 \u05ea\u05e7\u05d9\u05e0\u05d4." }, 400);
  const previous = await env.DB.prepare("SELECT object_key FROM artist_images WHERE artist_name = ? COLLATE NOCASE").bind(record.artist_name).first();
  const approvedKey = `approved/artist-${crypto.randomUUID()}.webp`;
  const version = Date.now();
  await env.IMAGES.put(approvedKey, image, { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } });
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO artist_images (artist_name, object_key, version, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(artist_name) DO UPDATE SET object_key = excluded.object_key, version = excluded.version, updated_at = excluded.updated_at").bind(record.artist_name, approvedKey, version),
      env.DB.prepare("UPDATE photo_requests SET status = 'approved', submitter_name = '', email = '', note = '', decided_at = datetime('now'), decided_by = ? WHERE id = ? AND status = 'pending'").bind(adminEmail(request), id),
    ]);
  } catch (error) {
    await env.IMAGES.delete(approvedKey);
    throw error;
  }
  await env.IMAGES.delete(record.pending_object_key);
  if (previous?.object_key && previous.object_key !== approvedKey) await env.IMAGES.delete(previous.object_key);
  return json({ ok: true, artistName: record.artist_name });
}

async function rejectRequest(request, id, env) {
  if (!requestOriginAllowed(request)) return json({ message: "\u05de\u05e7\u05d5\u05e8 \u05d4\u05d1\u05e7\u05e9\u05d4 \u05d0\u05d9\u05e0\u05d5 \u05de\u05d5\u05e8\u05e9\u05d4." }, 403);
  const record = await pendingRecord(id, env);
  if (!record) return json({ message: "\u05d4\u05d1\u05e7\u05e9\u05d4 \u05db\u05d1\u05e8 \u05d8\u05d5\u05e4\u05dc\u05d4 \u05d0\u05d5 \u05e9\u05d0\u05d9\u05e0\u05d4 \u05e7\u05d9\u05d9\u05de\u05ea." }, 404);
  await env.DB.prepare("UPDATE photo_requests SET status = 'rejected', submitter_name = '', email = '', note = '', decided_at = datetime('now'), decided_by = ? WHERE id = ? AND status = 'pending'").bind(adminEmail(request), id).run();
  await env.IMAGES.delete(record.pending_object_key);
  return json({ ok: true });
}

let contentSchemaReady;
function ensureContentSchema(env) {
  contentSchemaReady ||= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL UNIQUE,
      source_kind TEXT NOT NULL DEFAULT 'manual',
      content_type TEXT NOT NULL DEFAULT 'news',
      original_title TEXT NOT NULL DEFAULT '',
      original_summary TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      impact TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      published_at TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'AIMA UPDATE',
      status TEXT NOT NULL DEFAULT 'draft',
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS content_items_status_date ON content_items(status, published_at DESC)"),
  ]).catch((error) => {
    contentSchemaReady = undefined;
    throw error;
  });
  return contentSchemaReady;
}

function contentRow(row) {
  return {
    id: Number(row.id),
    sourceId: row.source_id,
    sourceKind: row.source_kind,
    contentType: row.content_type || "news",
    originalTitle: row.original_title,
    originalSummary: row.original_summary,
    title: row.title,
    summary: row.summary,
    impact: row.impact,
    action: row.action,
    url: row.url,
    publishedAt: row.published_at,
    label: row.label,
    status: row.status,
    position: Number(row.position || 0),
    updatedAt: row.updated_at,
  };
}

async function listPublishedContent(request, env) {
  await ensureContentSchema(env);
  const url = new URL(request.url);
  const limit = Math.min(30, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const contentType = clean(url.searchParams.get("type"), 30) || "news";
  const result = await env.DB.prepare("SELECT * FROM content_items WHERE status = 'published' AND content_type = ? ORDER BY position ASC, published_at DESC, id DESC LIMIT ?").bind(contentType, limit).all();
  return json({ items: result.results.map(contentRow) });
}

async function listAdminContent(env) {
  await ensureContentSchema(env);
  const result = await env.DB.prepare("SELECT * FROM content_items ORDER BY CASE status WHEN 'draft' THEN 0 ELSE 1 END, published_at DESC, id DESC LIMIT 100").all();
  return json({ items: result.results.map(contentRow) });
}

function contentStatus(value) {
  return value === "published" ? "published" : "draft";
}

async function createAdminContent(request, env) {
  if (!requestOriginAllowed(request)) return json({ message: "מקור הבקשה אינו מורשה." }, 403);
  const body = await request.json().catch(() => ({}));
  const title = clean(body.title, 180);
  const publishedAt = clean(body.publishedAt, 30) || new Date().toISOString().slice(0, 10);
  if (!title) return json({ message: "נדרשת כותרת לעדכון." }, 400);
  await ensureContentSchema(env);
  const result = await env.DB.prepare(`INSERT INTO content_items (
    source_id, source_kind, content_type, title, summary, impact, action, url,
    published_at, label, status, position
  ) VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      `manual:${crypto.randomUUID()}`,
      clean(body.contentType, 30) === "resource" ? "resource" : "news",
      title,
      clean(body.summary, 1200),
      clean(body.impact, 900),
      clean(body.action, 600),
      clean(body.url, 700),
      publishedAt,
      clean(body.label, 60) || "AIMA UPDATE",
      contentStatus(body.status),
      Number.isFinite(Number(body.position)) ? Number(body.position) : 0,
    ).run();
  const row = await env.DB.prepare("SELECT * FROM content_items WHERE id = ?").bind(result.meta.last_row_id).first();
  return json({ item: contentRow(row) }, 201);
}

async function updateAdminContent(request, id, env) {
  if (!requestOriginAllowed(request)) return json({ message: "מקור הבקשה אינו מורשה." }, 403);
  const body = await request.json().catch(() => ({}));
  const current = await env.DB.prepare("SELECT * FROM content_items WHERE id = ?").bind(id).first();
  if (!current) return json({ message: "העדכון לא נמצא." }, 404);
  const title = clean(body.title, 180) || current.title;
  await env.DB.prepare(`UPDATE content_items SET
    content_type = ?, title = ?, summary = ?, impact = ?, action = ?, url = ?,
    published_at = ?, label = ?, status = ?, position = ?, updated_at = datetime('now')
    WHERE id = ?`)
    .bind(
      clean(body.contentType, 30) === "resource" ? "resource" : (current.content_type || "news"),
      title,
      body.summary === undefined ? current.summary : clean(body.summary, 1200),
      body.impact === undefined ? current.impact : clean(body.impact, 900),
      body.action === undefined ? current.action : clean(body.action, 600),
      body.url === undefined ? current.url : clean(body.url, 700),
      clean(body.publishedAt, 30) || current.published_at,
      clean(body.label, 60) || current.label,
      contentStatus(body.status === undefined ? current.status : body.status),
      Number.isFinite(Number(body.position)) ? Number(body.position) : Number(current.position || 0),
      id,
    ).run();
  const row = await env.DB.prepare("SELECT * FROM content_items WHERE id = ?").bind(id).first();
  return json({ item: contentRow(row) });
}

async function deleteAdminContent(request, id, env) {
  if (!requestOriginAllowed(request)) return json({ message: "מקור הבקשה אינו מורשה." }, 403);
  await env.DB.prepare("DELETE FROM content_items WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

function appendReleaseText(state, value) {
  if (!state.current) return;
  const text = String(value || "").replace(/\s+/gu, " ").trim();
  if (text) state.current.body += `${state.current.body ? " " : ""}${text}`;
}

async function fetchSunoReleaseNotes() {
  const response = await fetch("https://suno.com/release-notes", {
    headers: { accept: "text/html", "user-agent": "AIMA Community release monitor/1.0" },
  });
  if (!response.ok) throw new Error(`Suno release notes returned ${response.status}`);
  const state = { items: [], current: null, heading: null };
  const rewriter = new HTMLRewriter()
    .on("h2", {
      element() {
        state.heading = { title: "", body: "", url: "" };
      },
      text(text) { if (state.heading) state.heading.title += text.text; },
    })
    .on("h2 a", {
      element(element) {
        if (!state.heading) return;
        const href = element.getAttribute("href");
        if (!href) return;
        state.heading.url = new URL(href, "https://suno.com/release-notes").href;
        state.current = state.heading;
        state.items.push(state.current);
      },
    })
    .on("p", { text(text) { appendReleaseText(state, text.text); } })
    .on("li", { text(text) { appendReleaseText(state, text.text); } })
    .on("button", { text(text) { appendReleaseText(state, text.text); } });
  await rewriter.transform(response).arrayBuffer();
  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/u;
  return state.items
    .map((item) => {
      const title = clean(item.title, 180);
      const dateLabel = item.body.match(datePattern)?.[0] || "";
      const publishedAt = dateLabel ? new Date(`${dateLabel} 12:00:00 UTC`).toISOString().slice(0, 10) : "";
      const body = clean(item.body.replace(datePattern, ""), 2200);
      return { title, body, url: item.url, publishedAt };
    })
    .filter((item) => item.title && item.publishedAt && item.body)
    .slice(0, 8);
}

function parseAiJson(value) {
  const text = typeof value === "string" ? value : value?.response;
  if (!text) return null;
  try {
    return JSON.parse(String(text).replace(/^```(?:json)?\s*|\s*```$/gu, ""));
  } catch {
    return null;
  }
}

async function hebrewReleaseDraft(note, env) {
  const fallback = {
    title: `חדש ב-Suno: ${note.title}`,
    summary: "Suno פרסמה עדכון חדש למוצר. אפשר לערוך כאן הסבר קצר בעברית לפני הפרסום באתר.",
    impact: "כדאי לבדוק אם העדכון משנה את תהליך היצירה, העריכה או השיתוף שלכם.",
    action: "פתחו את המקור הרשמי, נסו את היכולת החדשה ועדכנו את ההסבר לפני הפרסום.",
    label: "SUNO UPDATE",
  };
  if (!env.AI?.run) return fallback;
  try {
    const result = await env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
      messages: [
        { role: "system", content: "אתה עורך תוכן ישראלי מומחה ל-Suno ולמוזיקה עם AI. החזר JSON בלבד עם השדות title, summary, impact, action, label. כתוב בעברית טבעית, קצרה וברורה. title עד 90 תווים, summary עד 220, impact עד 180, action עד 160, label עד 24. אל תמציא יכולות, מחירים או זמינות שלא מופיעים במקור." },
        { role: "user", content: `כותרת מקור: ${note.title}\nתאריך: ${note.publishedAt}\nתוכן מקור: ${note.body}` },
      ],
      max_tokens: 420,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    const parsed = parseAiJson(result);
    if (!parsed) return fallback;
    return {
      title: clean(parsed.title, 180) || fallback.title,
      summary: clean(parsed.summary, 1200) || fallback.summary,
      impact: clean(parsed.impact, 900) || fallback.impact,
      action: clean(parsed.action, 600) || fallback.action,
      label: clean(parsed.label, 60) || fallback.label,
    };
  } catch (error) {
    console.warn("AIMA Hebrew release draft fallback", error);
    return fallback;
  }
}

async function importSunoReleases(env) {
  await ensureContentSchema(env);
  const notes = await fetchSunoReleaseNotes();
  let imported = 0;
  for (const note of notes) {
    const sourceId = `suno:${note.url}:${note.publishedAt}`;
    const exists = await env.DB.prepare("SELECT id FROM content_items WHERE source_id = ?").bind(sourceId).first();
    if (exists) continue;
    const draft = await hebrewReleaseDraft(note, env);
    const result = await env.DB.prepare(`INSERT OR IGNORE INTO content_items (
      source_id, source_kind, content_type, original_title, original_summary,
      title, summary, impact, action, url, published_at, label, status
    ) VALUES (?, 'suno', 'news', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`)
      .bind(sourceId, note.title, note.body, draft.title, draft.summary, draft.impact, draft.action, note.url, note.publishedAt, draft.label).run();
    imported += Number(result.meta?.changes || 0);
  }
  return { imported, checked: notes.length };
}

async function importSunoForAdmin(request, env) {
  if (!requestOriginAllowed(request)) return json({ message: "מקור הבקשה אינו מורשה." }, 403);
  return json({ ok: true, ...(await importSunoReleases(env)) });
}

const worker = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      if (request.method === "POST" && path === "/api/public/photo-requests") return submitPhotoRequest(request, env);
      if (request.method === "GET" && path === "/api/public/artist-images") return listArtistImages(env);
      if (request.method === "GET" && path === "/api/public/artist-votes") return listArtistVotes(env);
      if (request.method === "POST" && path === "/api/public/artist-votes") return submitArtistVote(request, env);
      if (request.method === "GET" && path === "/api/public/content") return listPublishedContent(request, env);
      const approvedMatch = path.match(/^\/api\/public\/artist-images\/(artist-[a-f0-9-]+\.webp)$/u);
      if (request.method === "GET" && approvedMatch) return serveApprovedImage(approvedMatch[1], env);

      if (path.startsWith("/api/admin/")) {
        if (!requireAdmin(request, env)) return json({ message: "\u05e0\u05d3\u05e8\u05e9\u05ea \u05db\u05e0\u05d9\u05e1\u05ea \u05de\u05e0\u05d4\u05dc \u05d3\u05e8\u05da Cloudflare Access." }, 401);
        if (request.method === "GET" && path === "/api/admin/photo-requests") return listPending(env);
        if (request.method === "GET" && path === "/api/admin/content") return listAdminContent(env);
        if (request.method === "POST" && path === "/api/admin/content") return createAdminContent(request, env);
        if (request.method === "POST" && path === "/api/admin/content/import-suno") return importSunoForAdmin(request, env);
        const contentMatch = path.match(/^\/api\/admin\/content\/(\d+)$/u);
        if (request.method === "PATCH" && contentMatch) return updateAdminContent(request, Number(contentMatch[1]), env);
        if (request.method === "DELETE" && contentMatch) return deleteAdminContent(request, Number(contentMatch[1]), env);
        const imageMatch = path.match(/^\/api\/admin\/photo-requests\/([a-f0-9-]+)\/image$/u);
        if (request.method === "GET" && imageMatch) return servePendingImage(imageMatch[1], env);
        const approveMatch = path.match(/^\/api\/admin\/photo-requests\/([a-f0-9-]+)\/approve$/u);
        if (request.method === "POST" && approveMatch) return approveRequest(request, approveMatch[1], env);
        const rejectMatch = path.match(/^\/api\/admin\/photo-requests\/([a-f0-9-]+)\/reject$/u);
        if (request.method === "POST" && rejectMatch) return rejectRequest(request, rejectMatch[1], env);
      }
      return json({ message: "Not found" }, 404);
    } catch (error) {
      console.error("AIMA photo API error", error);
      return json({ message: "\u05d0\u05d9\u05e8\u05e2\u05d4 \u05ea\u05e7\u05dc\u05d4 \u05d6\u05de\u05e0\u05d9\u05ea. \u05e0\u05e1\u05d5 \u05e9\u05d5\u05d1 \u05de\u05d0\u05d5\u05d7\u05e8 \u05d9\u05d5\u05ea\u05e8." }, 500);
    }
  },
  async scheduled(_controller, env, context) {
    context.waitUntil(importSunoReleases(env));
  },
};

export default worker;
