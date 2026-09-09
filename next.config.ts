import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "32mb",
  },
  devIndicators: false
};

export default nextConfig;
