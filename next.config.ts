import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://34.102.213.236/api/:path*",
      },
    ];
  },
};

export default nextConfig;