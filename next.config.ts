import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // TEMPORARY: GitHub Pages project hosting at the /estesharah subpath until a
  // custom domain is wired. Remove basePath + assetPrefix when moving to the
  // final domain (rebuild with them gone).
  basePath: "/estesharah",
  assetPrefix: "/estesharah",
  images: { unoptimized: true },
};

export default nextConfig;
