"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, removeAuthToken, BASALAM_SSO_URL } from "@/lib/auth";
import { motion } from "framer-motion";
import { LogOut, Package, Settings, User } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const authToken = getAuthToken();
    
    if (!authToken) {
      // اگر توکن نداریم، به صفحه لاگین ریدایرکت کن
      router.push("/");
      return;
    }
    
    setToken(authToken);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <svg
                viewBox="0 0 120 80"
                className="w-10 h-7"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="headerChain1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff5722" />
                    <stop offset="100%" stopColor="#ff7043" />
                  </linearGradient>
                  <linearGradient id="headerChain2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ff7043" />
                    <stop offset="100%" stopColor="#ff5722" />
                  </linearGradient>
                </defs>
                <ellipse
                  cx="38" cy="40" rx="22" ry="14"
                  fill="none" stroke="url(#headerChain1)" strokeWidth="10"
                  strokeLinecap="round" transform="rotate(-35 38 40)"
                />
                <ellipse
                  cx="82" cy="40" rx="22" ry="14"
                  fill="none" stroke="url(#headerChain2)" strokeWidth="10"
                  strokeLinecap="round" transform="rotate(35 82 40)"
                />
              </svg>
              <span className="font-bold text-xl text-slate-800">پیوندیار</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">خوش آمدید به پیوندیار!</h1>
            <p className="text-orange-100">
              از اینجا می‌توانید محصولات فروشگاه باسلام خود را مدیریت کنید.
            </p>
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-bold text-slate-800 mb-4">دسترسی سریع</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">مدیریت محصولات</h3>
              <p className="text-sm text-slate-500">ویرایش انبوه محصولات فروشگاه</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">پروفایل</h3>
              <p className="text-sm text-slate-500">مشاهده اطلاعات حساب کاربری</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">تنظیمات</h3>
              <p className="text-sm text-slate-500">پیکربندی حساب و اتصال</p>
            </motion.div>
          </div>

          {/* Token Info (for debugging - can be removed in production) */}
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-2">توکن احراز هویت (برای تست):</p>
            <code className="text-xs bg-white p-2 rounded block overflow-x-auto text-slate-600">
              {token ? `${token.substring(0, 50)}...` : "توکن یافت نشد"}
            </code>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

