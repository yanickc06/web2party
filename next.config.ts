import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output für optimierten Production-Build (perfekt für Plesk/PM2)
  output: "standalone",
};

export default nextConfig;
