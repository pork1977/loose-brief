import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, a stray lockfile further up the drive is treated as the
  // workspace root.
  turbopack: { root: __dirname },
};

export default nextConfig;
