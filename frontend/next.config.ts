import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Instant 307 at the edge/server layer. A `redirect()` inside `app/page.tsx`
  // cannot run during prerender with cacheComponents and degrades to a
  // client-rendered 1s meta-refresh, so the root redirect lives here instead.
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
