import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source, so Next.js compiles them.
  transpilePackages: ["@toyshop/shared", "@toyshop/theme"],
  images: {
    // Photos are already resized and compressed when the owner uploads them,
    // so skip Vercel's image optimisation (it has a small free quota).
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
