"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import { Share2, Settings2, History } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  {
    id: "settings",
    title: "دیدن و تنظیمات",
    description: "وضعیت اتصال را ببینید و پلتفرم، توکن و کانال را تنظیم کنید",
    icon: Settings2,
    route: "/dashboard/social/settings",
  },
  {
    id: "logs",
    title: "تاریخچه",
    description: "لاگ انتشارها و گزارش موفق / ناموفق را مشاهده کنید",
    icon: History,
    route: "/dashboard/social/logs",
  },
];

export default function SocialHubPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">شبکه‌های اجتماعی</h1>
              <p className="text-sm text-slate-500">
                اتصال کانال و انتشار محصولات غرفه در ایتا، بله و سایر پلتفرم‌ها
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option, idx) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => router.push(option.route)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-6 rounded-xl border-2 bg-white border-slate-200",
                  "hover:border-orange-300 hover:shadow-lg transition-all text-right"
                )}
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <option.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {option.description}
                </p>
              </motion.button>
            ))}
          </div>

          <p className="mt-6 text-sm text-slate-500">
            برای انتشار یک محصول، از{" "}
            <button
              type="button"
              onClick={() => router.push("/dashboard/products")}
              className="text-orange-600 underline"
            >
              مدیریت محصولات
            </button>{" "}
            روی آیکون شبکه‌های اجتماعی هر ردیف کلیک کنید.
          </p>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
