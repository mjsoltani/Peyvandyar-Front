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
  async redirects() {
    return [
      { source: "/dashboard/admin", destination: "/admin", permanent: false },
      {
        source: "/dashboard/admin/login",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/dashboard/admin/users",
        destination: "/admin/users",
        permanent: false,
      },
      {
        source: "/dashboard/admin/pending",
        destination: "/admin",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
