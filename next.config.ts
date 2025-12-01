import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // بهینه‌سازی برای build
  output: "standalone",
  // بهینه‌سازی images
  images: {
    unoptimized: false,
  },
  // کاهش bundle size
  experimental: {
    optimizePackageImports: ["lucide-react", "@tabler/icons-react"],
  },
};

export default nextConfig;
