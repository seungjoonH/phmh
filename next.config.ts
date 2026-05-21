import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/about/who-we-are",
        permanent: true,
      },
      {
        source: "/fee/fee",
        destination: "/fee",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
