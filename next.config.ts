import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  env: {
    KOREA_CONTACT_EMAIL: process.env.KOREA_CONTACT_EMAIL ?? "",
    PHILIPPINES_CONTACT_EMAIL: process.env.PHILIPPINES_CONTACT_EMAIL ?? "",
  },
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
