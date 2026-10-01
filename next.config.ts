import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image refuses to load images from hosts it does not know about, so
    // TMDB's image CDN has to be allowlisted here.
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }],
  },
};

export default nextConfig;
