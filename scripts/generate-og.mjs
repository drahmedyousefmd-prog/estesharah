// Generates public/og-image.png (1200x630) using Next's bundled ImageResponse (Satori).
// Imports "next/og.js" directly because node's ESM loader doesn't apply next's
// package "exports" map for extension-less subpaths.
// Mirrors the brand constants in src/lib/site.ts — update both together.
// Run via `node scripts/generate-og.mjs` (automated by the prebuild hook).
import { ImageResponse } from "next/og.js";
import { createElement as h } from "react";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NAME = "استشارة";
const TAGLINE_AR = "بوابتك الآمنة للتواصل مع طبيبك";
const TAGLINE_EN = "Your Trusted Medical Consultation Portal";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function row(children, style) {
  return h("div", { style: { display: "flex", flexDirection: "row", ...style } }, children);
}
function col(children, style) {
  return h("div", { style: { display: "flex", flexDirection: "column", ...style } }, children);
}

function ecg() {
  return h(
    "svg",
    {
      viewBox: "0 0 1200 200",
      width: 1200,
      height: 200,
      style: { position: "absolute", bottom: 0, left: 0 },
    },
    h("path", {
      d: "M0 140 H300 L380 140 L430 70 L510 210 L560 130 H1200",
      fill: "none",
      stroke: "#2d9cdb",
      "stroke-opacity": 0.07,
      "stroke-width": 14,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    })
  );
}

async function main() {
  const [regular, bold, mark] = await Promise.all([
    readFile(join(rootDir, "assets/fonts/Tajawal-Regular.ttf")),
    readFile(join(rootDir, "assets/fonts/Tajawal-Bold.ttf")),
    readFile(join(rootDir, "public/app-icon-512.png")),
  ]);
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  const el = col(
    [
      ecg(),
      h("img", {
        src: markSrc,
        alt: "",
        style: { width: 160, height: 160, borderRadius: 36 },
      }),
      row(NAME, { fontSize: 72, fontWeight: 700, color: "#123a5c", marginTop: 28 }),
      row(TAGLINE_AR, { fontSize: 34, fontWeight: 700, color: "#2d9cdb", marginTop: 14 }),
      row(TAGLINE_EN, {
        fontSize: 20,
        color: "#68736d",
        letterSpacing: 3,
        textTransform: "uppercase",
        marginTop: 12,
        direction: "ltr",
      }),
    ],
    {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f7f5f1",
      fontFamily: "Tajawal",
      direction: "rtl",
      position: "relative",
      overflow: "hidden",
    }
  );

  const img = await new ImageResponse(el, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Tajawal", data: regular, weight: 400, style: "normal" },
      { name: "Tajawal", data: bold, weight: 700, style: "normal" },
    ],
  });
  const buf = Buffer.from(await img.arrayBuffer());
  const out = join(rootDir, "public/og-image.png");
  await writeFile(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});