import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output für optimierten Production-Build (perfekt für Plesk/PM2)
  output: "standalone",
  // Native/Binary-Packages nicht bundlen (nötig für Vercel Serverless)
  serverExternalPackages: ["ffmpeg-static", "@distube/ytdl-core"],
};

export default nextConfig;
