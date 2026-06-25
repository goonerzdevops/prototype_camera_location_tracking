import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["10.203.22.186", "192.168.18.109", "orange-nights-say.loca.lt"],
  experimental: {
    // @ts-ignore
    allowedDevOrigins: ["10.203.22.186", "192.168.18.109", "orange-nights-say.loca.lt"],
  }
};

export default nextConfig;
