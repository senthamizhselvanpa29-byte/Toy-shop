import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source, so Next.js compiles them.
  transpilePackages: ["@toyshop/shared", "@toyshop/theme"],
  images: {
    // Photos are resized and compressed in three sizes when the owner uploads
    // them, so Vercel's image optimisation (which has a small free quota) isn't
    // needed: the loader just picks the right copy. See src/lib/photoSizes.ts.
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
    deviceSizes: [640, 800, 1200, 1600],
    imageSizes: [100, 200, 400],
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
