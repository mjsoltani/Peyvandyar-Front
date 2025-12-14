"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import {
  Copy,
  Send,
  ShoppingBag,
  FileSpreadsheet,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
  isActive: boolean;
  comingSoon: boolean;
  route?: string;
}

export default function CopyProductPage() {
  const router = useRouter();

  const copyMethods: CopyMethod[] = [
    {
      id: "telegram",
      title: "اضافه کردن از طریق تلگرام",
      description: "کپی محصول با ارسال لینک در تلگرام",
      icon: Send,
      isActive: false,
      comingSoon: true,
    },
    {
      id: "basalam",
      title: "اضافه کردن از طریق باسلام",
      description: "کپی محصول با استفاده از لینک باسلام",
      icon: ShoppingBag,
      isActive: true,
      comingSoon: false,
      route: "/dashboard/copy-product/basalam",
    },
    {
      id: "mixi",
      title: "اضافه کردن از طریق میکسین",
      description: "کپی محصول از پلتفرم میکسین",
      icon: Copy,
      isActive: false,
      comingSoon: true,
    },
    {
      id: "excel",
      title: "اضافه کردن از طریق اکسل",
      description: "آپلود فایل اکسل برای کپی دسته‌ای",
      icon: FileSpreadsheet,
      isActive: false,
      comingSoon: true,
    },
  ];

  const handleMethodClick = (method: CopyMethod) => {
    if (method.isActive && method.route) {
      router.push(method.route);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Copy className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">کپی محصول</h1>
              <p className="text-sm text-slate-500">
                کپی محصول از غرفه ای که بهش دسترسی ندارید !
              </p>
            </div>
          </div>

          {/* Copy Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {copyMethods.map((method, idx) => (
              <motion.button
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleMethodClick(method)}
                disabled={!method.isActive}
                whileHover={method.isActive ? { scale: 1.02 } : {}}
                whileTap={method.isActive ? { scale: 0.98 } : {}}
                className={cn(
                  "relative p-6 rounded-xl border-2 transition-all text-right",
                  method.isActive
                    ? "bg-white border-slate-200 hover:border-orange-300 hover:shadow-lg cursor-pointer"
                    : "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
                )}
              >
                {/* Coming Soon Badge */}
                {method.comingSoon && (
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      به زودی
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                    method.isActive
                      ? "bg-orange-100"
                      : "bg-slate-200"
                  )}>
                    <method.icon className={cn(
                      "w-7 h-7",
                      method.isActive ? "text-orange-500" : "text-slate-400"
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={cn(
                      "text-lg font-bold mb-2",
                      method.isActive ? "text-slate-800" : "text-slate-500"
                    )}>
                      {method.title}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      method.isActive ? "text-slate-600" : "text-slate-400"
                    )}>
                      {method.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {method.isActive && (
                    <ArrowRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
