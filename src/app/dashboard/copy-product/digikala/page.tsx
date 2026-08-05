"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import {
  Package,
  Store,
  Link2,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  {
    id: "product",
    title: "ایمپورت تک‌محصول",
    description: "با لینک محصول دیجی‌کالا پیش‌نمایش بگیرید و در غرفه باسلام منتشر کنید",
    icon: Package,
    route: "/dashboard/copy-product/digikala/product",
  },
  {
    id: "seller",
    title: "ایمپورت از غرفه seller",
    description: "کاتالوگ فروشنده دیجی‌کالا را ببینید، انتخاب کنید و ایمپورت کنید",
    icon: Store,
    route: "/dashboard/copy-product/digikala/seller",
  },
  {
    id: "links",
    title: "محصولات دیجی‌کالا و سینک",
    description: "لیست لینک‌های ایمپورت‌شده و سینک قیمت/موجودی از دیجی‌کالا",
    icon: Link2,
    route: "/dashboard/copy-product/digikala/links",
  },
];

export default function DigikalaHubPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/copy-product")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به کپی محصول
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">دیجی‌کالا</h1>
              <p className="text-sm text-slate-500">
                ایمپورت محصول به باسلام و سینک قیمت و موجودی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
