import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isključi Turbopack za build
  turbopack: {
    build: false,
  },
};

export default nextConfig;