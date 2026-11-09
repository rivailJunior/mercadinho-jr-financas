import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    WELCOME_MESSAGE: process.env.WELCOME_MESSAGE,
  },
  // Dev-only: the browser preview proxy serves the app on a different
  // origin than localhost:3000, which trips the Server Actions CSRF check.
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:62526", "localhost:62526"],
    },
  },
  allowedDevOrigins: ["127.0.0.1:62526", "localhost:62526"],
};

export default nextConfig;
