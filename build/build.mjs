// Build the single-file game: embed every cat photo + meow from ../assets
// into ../build/template.html and write ../dist/index.html.
// Zero dependencies — runs on plain Node. Invoked via `npm run build`.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const TEMPLATE = join(ROOT, "build", "template.html");
const OUT_DIR = join(ROOT, "dist");
const OUT = join(OUT_DIR, "index.html");

const VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

const IMG_MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const AUDIO_MIME = { mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav", m4a: "audio/mp4" };

const ext = (f) => f.toLowerCase().split(".").pop();
const dataUri = (path, mimeMap) => {
  const b64 = readFileSync(path).toString("base64");
  const mime = mimeMap[ext(path)] || "application/octet-stream";
  return `data:${mime};base64,${b64}`;
};
const kb = (path) => Math.round(readFileSync(path).length / 1024);

let html = readFileSync(TEMPLATE, "utf8");

// Cats
for (const v of VALUES) {
  const match = readdirSync(ASSETS).find((f) => f.startsWith(`cat_${v}.`));
  if (!match) throw new Error(`MISSING image for value ${v}`);
  const p = join(ASSETS, match);
  html = html.replaceAll(`__CAT_${v}__`, dataUri(p, IMG_MIME));
  console.log(`  ${String(v).padStart(5)} <- ${match} (${kb(p)} KB)`);
}

// Meows (a random one plays per merge)
const meows = readdirSync(ASSETS).filter((f) => f.startsWith("meow")).sort();
if (meows.length === 0) throw new Error("MISSING meow audio");
const uris = meows.map((f) => {
  const p = join(ASSETS, f);
  console.log(`  meow  <- ${f} (${kb(p)} KB)`);
  return `'${dataUri(p, AUDIO_MIME)}'`;
});
html = html.replaceAll("__MEOWS__", uris.join(","));

if (/__CAT_|__MEOW/.test(html)) throw new Error("ERROR: unfilled placeholders remain");

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, html);
console.log(`\nWrote ${OUT} (${kb(OUT)} KB)`);
