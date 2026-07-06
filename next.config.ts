import type { NextConfig } from "next";

// Capacitor inahitaji static HTML/JS/CSS (siyo Node server), kwa hiyo build ya
// Capacitor pekee (CAPACITOR_BUILD=true) inatumia static export. Kwa hosting ya
// kawaida (Railway) tunatumia server ya kawaida ya Next.js (next start).
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  ...(isCapacitorBuild
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
