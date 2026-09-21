/**
 * Zero-dependency brand asset generator.
 * Produces PNG app icons + apple-touch-icon + favicon.ico from the Rochetta
 * logo geometry (teal tile + white ECG pulse + capsule). Uses only Node
 * built-ins (`node:zlib` for PNG compression, `node:fs`).
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const BRAND = [0x1f, 0x5b, 0x54]; // #1F5B54
const WHITE = [0xff, 0xff, 0xff];

/* ---------------- PNG encoding ---------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** rgba: Uint8Array of width*height*4. */
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(
      raw,
      y * stride + 1
    );
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------------- ICO packing ---------------- */

function encodeICO(entries) {
  // entries: [{ width, height, png: Buffer }]
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dirs = [];
  let offset = 6 + 16 * entries.length;
  for (const e of entries) {
    const d = Buffer.alloc(16);
    d[0] = e.width === 256 ? 0 : e.width;
    d[1] = e.height === 256 ? 0 : e.height;
    d[2] = 0; // palette
    d[3] = 0; // reserved
    d.writeUInt16LE(1, 4); // planes
    d.writeUInt16LE(32, 6); // bit count
    d.writeUInt32LE(e.png.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += e.png.length;
    dirs.push(d);
  }
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.png)]);
}

/* ---------------- Geometry (logical 64x64 space) ---------------- */

const PULSE_PTS = [
  [10, 36],
  [22, 36],
  [27, 27],
  [33, 41],
  [36.5, 32],
  [52, 32],
];
const STROKE_HALF = 1.7; // stroke width 3.4
const CAP = { cx: 46.5, cy: 32, hw: 5.5, hh: 2.8, r: 2.8, angle: -12 };

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function rotated(px, py, cx, cy, rad) {
  const dx = px - cx;
  const dy = py - cy;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

function roundedRectDist(px, py, cx, cy, hw, hh, r) {
  const dx = Math.max(Math.abs(px - cx) - hw + r, 0);
  const dy = Math.max(Math.abs(py - cy) - hh + r, 0);
  return Math.hypot(dx, dy) + Math.min(Math.max(dx, dy), 0) - r;
}

/** distance to the tile's rounded rect (negative = inside). */
function tileDist(px, py, inset) {
  const half = 32 - inset;
  const r = 14 - inset * 0.4;
  return roundedRectDist(px, py, 32, 32, half, half, Math.max(r, 3));
}

function glyphDist(px, py) {
  let d = Infinity;
  for (let i = 0; i < PULSE_PTS.length - 1; i++) {
    d = Math.min(
      d,
      segDist(px, py, PULSE_PTS[i][0], PULSE_PTS[i][1], PULSE_PTS[i + 1][0], PULSE_PTS[i + 1][1])
    );
  }
  const rad = (CAP.angle * Math.PI) / 180;
  const p = rotated(px, py, CAP.cx, CAP.cy, -rad); // into capsule local space
  d = Math.min(d, roundedRectDist(p.x, p.y, CAP.cx, CAP.cy, CAP.hw, CAP.hh, CAP.r));
  return d;
}

/* ---------------- Rasterization ---------------- */

function renderMark(size, inset) {
  const img = new Uint8Array(size * size * 4);
  const SS = 3; // 3x3 supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let tileCount = 0;
      let whiteCount = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = ((x + (sx + 0.5) / SS) * 64) / size;
          const py = ((y + (sy + 0.5) / SS) * 64) / size;
          const t = tileDist(px, py, inset);
          if (t <= 0) {
            tileCount++;
            if (glyphDist(px, py) <= STROKE_HALF) whiteCount++;
          }
        }
      }
      const i = (y * size + x) * 4;
      const total = SS * SS;
      const tileFrac = tileCount / total;
      if (tileFrac <= 0) {
        img[i] = img[i + 1] = img[i + 2] = img[i + 3] = 0;
      } else {
        const wf = whiteCount / Math.max(tileCount, 1);
        const r = BRAND[0] + (WHITE[0] - BRAND[0]) * wf;
        const g = BRAND[1] + (WHITE[1] - BRAND[1]) * wf;
        const b = BRAND[2] + (WHITE[2] - BRAND[2]) * wf;
        img[i] = Math.round(r);
        img[i + 1] = Math.round(g);
        img[i + 2] = Math.round(b);
        img[i + 3] = Math.round(tileFrac * 255);
      }
    }
  }
  return img;
}

/* ---------------- Output ---------------- */

const publicDir = join(ROOT, "public");
mkdirSync(publicDir, { recursive: true });

function savePNG(name, size, inset) {
  const png = encodePNG(size, size, renderMark(size, inset));
  writeFileSync(join(publicDir, name), png);
  return png;
}

savePNG("app-icon-192.png", 192, 10);
savePNG("app-icon-512.png", 512, 10);
savePNG("apple-touch-icon.png", 180, 2);
savePNG("app-icon-32.png", 32, 2);
savePNG("app-icon-16.png", 16, 2);

const ico = encodeICO([
  { width: 32, height: 32, png: encodePNG(32, 32, renderMark(32, 2)) },
  { width: 16, height: 16, png: encodePNG(16, 16, renderMark(16, 2)) },
]);
const faviconPath = join(ROOT, "src", "app", "favicon.ico");
writeFileSync(faviconPath, ico);

console.log("Generated:");
console.log("  public/app-icon-192.png   (192x192)");
console.log("  public/app-icon-512.png   (512x512)");
console.log("  public/apple-touch-icon.png (180x180)");
console.log("  public/app-icon-32.png / app-icon-16.png");
console.log(`  ${faviconPath} (ico) — ${ico.length} bytes`);