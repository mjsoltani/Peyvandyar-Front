import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // بهینه‌سازی برای build
  output: "standalone",
  // غیرفعال کردن telemetry برای build سریع‌تر
  telemetry: false,
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
