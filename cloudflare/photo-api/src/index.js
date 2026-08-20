const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_APPROVED_BYTES = 2 * 1024 * 1024;
const GLOBAL_REQUEST_LIMIT_PER_24_HOURS = 50;
const GLOBAL_PENDING_REQUEST_LIMIT = 100;
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

const worker = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      if (request.method === "POST" && path === "/api/public/photo-requests") return submitPhotoRequest(request, env);
      if (request.method === "GET" && path === "/api/public/artist-images") return listArtistImages(env);
      const approvedMatch = path.match(/^\/api\/public\/artist-images\/(artist-[a-f0-9-]+\.webp)$/u);
      if (request.method === "GET" && approvedMatch) return serveApprovedImage(approvedMatch[1], env);

      if (path.startsWith("/api/admin/")) {
        if (!requireAdmin(request, env)) return json({ message: "\u05e0\u05d3\u05e8\u05e9\u05ea \u05db\u05e0\u05d9\u05e1\u05ea \u05de\u05e0\u05d4\u05dc \u05d3\u05e8\u05da Cloudflare Access." }, 401);
        if (request.method === "GET" && path === "/api/admin/photo-requests") return listPending(env);
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
};

export default worker;
