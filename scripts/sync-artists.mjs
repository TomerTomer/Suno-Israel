import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node sync-artists.mjs input.csv output.json");
}

const fields = ["spotify", "youtube", "other", "instagram", "facebook", "tiktok", "suno", "soundcloud"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function cleanText(value) {
  const text = String(value ?? "").replace(/\s+/gu, " ").trim();
  const emptyValues = new Set(["none", "not really using it", "עוד אין", "בבניה", "לא משתמש", "לא רלוונטי", "אין", "no", "n/a", "na", "-"]);
  return emptyValues.has(text.toLocaleLowerCase()) ? "" : text;
}

function normalizeUrl(value, platform) {
  let text = cleanText(value);
  if (!text) return "";
  if (text.includes("](")) text = text.split("](", 2)[1].replace(/\)$/u, "");
  if (/^www\./iu.test(text) || /^[a-z0-9.-]+\.(com|co|net|org)\//iu.test(text)) text = `https://${text}`;
  const secondProtocol = [text.indexOf("https://", 8), text.indexOf("http://", 7)].filter((position) => position > 0).sort((a, b) => a - b)[0];
  if (secondProtocol) text = text.slice(0, secondProtocol);

  if (text.startsWith("@")) {
    const bases = {
      youtube: "https://youtube.com/@",
      instagram: "https://instagram.com/",
      tiktok: "https://www.tiktok.com/@",
      suno: "https://suno.com/@",
    };
    text = bases[platform] ? `${bases[platform]}${text.slice(1)}` : "";
  } else if (["instagram", "tiktok"].includes(platform) && !text.includes(" ") && !/^https?:/iu.test(text)) {
    const base = platform === "instagram" ? "https://instagram.com/" : "https://www.tiktok.com/@";
    text = `${base}${text.replace(/^@/u, "")}`;
  }

  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.toString() : "";
  } catch {
    return "";
  }
}

function platformForUrl(value, intended) {
  const host = new URL(value).hostname.replace(/^www\./u, "").toLocaleLowerCase();
  const platformHosts = {
    spotify: ["spotify.com"],
    youtube: ["youtube.com", "youtu.be"],
    instagram: ["instagram.com"],
    facebook: ["facebook.com", "fb.com"],
    tiktok: ["tiktok.com"],
    suno: ["suno.com"],
    soundcloud: ["soundcloud.com"],
  };
  for (const [platform, hosts] of Object.entries(platformHosts)) {
    if (hosts.some((item) => host === item || host.endsWith(`.${item}`))) return platform;
  }
  return intended === "other" ? intended : "other";
}

function normalizedName(value) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}_]+/gu, "");
}

function artistKey(name) {
  const key = normalizedName(name);
  const aliases = new Map([
    ["eliezer", "eliezerkhalfon"],
    ["eliezerkhalfon", "eliezerkhalfon"],
    ["shlomiyamin", "djshlomiyamin"],
    ["djshlomiyamin", "djshlomiyamin"],
    ["rutihairutha", "rutihai"],
    ["רותיחיrutha", "rutihai"],
    ["רותיחי", "rutihai"],
    ["רותיחיrutihai", "rutihai"],
  ]);
  return aliases.get(key) ?? key;
}

const rows = parseCsv(await readFile(inputPath, "utf8"));
if (!rows[0]?.[1]?.toLocaleLowerCase().includes("artist name")) {
  throw new Error("The Google Sheet did not return the expected artist response columns");
}
const sourceRows = [];
let continuationRows = 0;

for (const values of rows.slice(1)) {
  const row = [...values, ...Array(12).fill("")];
  const name = cleanText(row[1]);
  const links = Object.fromEntries(fields.map((field) => [field, ""]));
  fields.forEach((field, index) => {
    const url = normalizeUrl(row[index + 3], field);
    if (url) links[platformForUrl(url, field)] = url;
  });
  if (!name) {
    if (sourceRows.length && Object.values(links).some(Boolean)) {
      Object.assign(sourceRows.at(-1), Object.fromEntries(Object.entries(links).filter(([, value]) => value)));
      continuationRows += 1;
    }
    continue;
  }
  sourceRows.push({ name, genres: cleanText(row[2]), ...links, image: "" });
}

const merged = new Map();
const order = [];
let duplicateEntries = 0;
for (const artist of sourceRows) {
  const key = artistKey(artist.name);
  if (!merged.has(key)) {
    merged.set(key, Object.fromEntries(["name", "genres", ...fields, "image"].map((field) => [field, ""])));
    order.push(key);
  } else {
    duplicateEntries += 1;
  }
  const target = merged.get(key);
  for (const [field, value] of Object.entries(artist)) {
    if (value) target[field] = value;
  }
}

const artists = order.map((key) => merged.get(key));
if (!artists.length) throw new Error("Artist sync returned an empty directory");
await writeFile(outputPath, `${JSON.stringify(artists, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ sourceNamedRows: sourceRows.length, continuationRowsMerged: continuationRows, duplicateEntriesMerged: duplicateEntries, finalArtists: artists.length }));
