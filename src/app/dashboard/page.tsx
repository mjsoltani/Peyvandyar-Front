"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { productsApi } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Package, 
  FileText,
  BarChart3,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  editedProducts: number;
  pendingProducts: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    editedProducts: 0,
    pendingProducts: 0,
  });

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      // دریافت آمار از API
      // طبق API-ENDPOINTS.json باید از /api/products با per_page استفاده کنیم
      const response = await productsApi.getProducts({ page: 1, per_page: 1 });
      
      if (response.success) {
        // طبق API-ENDPOINTS.json ساختار response این است:
        // response.pagination.total برای تعداد کل
        const totalProducts = response.pagination?.total || response.data?.pagination?.total || 0;
        
        // TODO: باید endpoint های جداگانه برای stats اضافه بشه
        // فعلاً با مقادیر صفر نمایش می‌دیم
        setStats({
          totalProducts,
          activeProducts: 0, // باید از API گرفته بشه
          editedProducts: 0, // باید از API گرفته بشه
          pendingProducts: 0, // باید از API گرفته بشه
        });
      } else {
        throw new Error(response.message || "خطا در دریافت اطلاعات");
      }
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      setIsError(true);
      setErrorMessage(error.message || "خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const authToken = getAuthToken();
    
    if (!authToken) {
      router.push("/");
      return;
    }
    
    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Welcome Section */}
          <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">خوش آمدید به پیوندیار!</h1>
            <p className="text-orange-100">
              از اینجا می‌توانید محصولات فروشگاه باسلام خود را مدیریت کنید.
            </p>
          </div>

          {/* Error Message */}
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-red-800 font-medium">خطا در دریافت اطلاعات</p>
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تلاش مجدد
              </button>
            </motion.div>
          )}

          {/* Quick Actions */}
          <h2 className="text-xl font-bold text-slate-800 mb-4">دسترسی سریع</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/dashboard/products">
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
            </Link>

            <Link href="/dashboard/bulk-edit">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">ویرایش انبوه</h3>
                <p className="text-sm text-slate-500">ویرایش بیش از ۱۵۰۰ محصول همزمان</p>
              </motion.div>
            </Link>

            <Link href="/dashboard/reports">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">گزارش‌ها</h3>
                <p className="text-sm text-slate-500">مشاهده آمار و گزارش تغییرات</p>
              </motion.div>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "کل محصولات", value: stats.totalProducts, icon: Package },
              { label: "آماده ویرایش", value: stats.activeProducts, icon: FileText },
              { label: "ویرایش شده", value: stats.editedProducts, icon: ImageIcon },
              { label: "در انتظار", value: stats.pendingProducts, icon: BarChart3 },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-slate-800">
                    {new Intl.NumberFormat("fa-IR").format(stat.value)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
