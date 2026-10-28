import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source, so Next.js compiles them.
  transpilePackages: ["@toyshop/shared", "@toyshop/theme"],
  images: {
    remotePatterns: [
      // Product images served from Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
