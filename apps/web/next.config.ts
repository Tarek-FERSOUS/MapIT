import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.196.69.229"
  ],
  eslint: {
    dirs: ["src"]
  }
};

export default nextConfig;
