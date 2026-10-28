import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nearly every page here is personalised (your ratings, your friends), so pages render
  // per request. Cache Components is left off to keep the data flow simple for contributors;
  // TMDB responses are still cached via fetch revalidation in src/lib/tmdb.ts.
  cacheComponents: false,
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
