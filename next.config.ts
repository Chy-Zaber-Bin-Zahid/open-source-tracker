import type { NextConfig } from "next";

/**
 * `output: "standalone"` produces the self-contained server the Dockerfile
 * copies out of `.next/standalone`. It must NOT be set when building on
 * Vercel: Vercel runs its own Node file tracing, and the two collide with
 *
 *   ENOENT: no such file or directory, open '.next/next-server.js.nft.json'
 *
 * Vercel sets VERCEL=1 during the build, so self-hosted builds still get a
 * standalone bundle and Vercel builds are left alone.
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
