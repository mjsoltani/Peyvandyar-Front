"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { productsApi, userApi } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Package, 
  FileText,
  Copy,
  Image as ImageIcon,
  User,
  Store,
  BarChart3
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ApiSectionWrapper } from "@/components/dashboard/api-error-boundary";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  editedProducts: number;
  pendingProducts: number;
}

interface UserInfo {
  username: string;
  basalam_user_id: number;
  basalam_vendor_id: number;
  vendor_title: string;
  last_used_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // جداسازی state برای هر بخش
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    editedProducts: 0,
    pendingProducts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<Error | null>(null);

  const fetchUserInfo = async () => {
    try {
      setUserLoading(true);
      setUserError(null);
      
      const userResponse = await userApi.getProfile();
      
      if (userResponse.success && (userResponse as any).user) {
        const user = (userResponse as any).user;
        setUserInfo({
          username: user.username || "",
          basalam_user_id: user.basalam_user_id || 0,
          basalam_vendor_id: user.basalam_vendor_id || 0,
          vendor_title: user.vendor_title || "",
          last_used_at: user.last_used_at || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching user info:", error);
      setUserError(error);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const productsResponse = await productsApi.getProducts({ page: 1, per_page: 100 });
      
      if (!productsResponse.success) {
        throw new Error(productsResponse.message || "خطا در دریافت اطلاعات");
      }
      
      const totalProducts = productsResponse.pagination?.total || 0;
      const productsData = productsResponse.data?.data || [];
      
      // محاسبه محصولات آماده ویرایش (status "در دسترس")
      const activeProducts = productsData.filter((p: any) => 
        p.status?.name === "در دسترس"
      ).length;
      
      // اگر تعداد کل بیشتر از 100 است، محاسبه تقریبی
      const activeProductsCount = totalProducts > 100
        ? Math.round((activeProducts / productsData.length) * totalProducts)
        : activeProducts;
      
      setStats({
        totalProducts,
        activeProducts: activeProductsCount,
        editedProducts: 0,
        pendingProducts: 0,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      setStatsError(error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const authToken = getAuthToken();
    
    if (!authToken) {
      router.push("/");
      return;
    }
    
    // دریافت اطلاعات به صورت مستقل
    fetchUserInfo();
    fetchStats();
  }, [router]);

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
          <ApiSectionWrapper
            error={userError}
            isLoading={userLoading}
            onRetry={fetchUserInfo}
            errorTitle="خطا در دریافت اطلاعات کاربر"
            compact={true}
            loadingComponent={
              <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8">
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full"
                  />
                </div>
              </div>
            }
          >
            <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    خوش آمدید {userInfo?.username ? `${userInfo.username}` : "به پیوندیار"}!
                  </h1>
                  {userInfo?.vendor_title && (
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-5 h-5 text-orange-100" />
                      <p className="text-lg font-medium text-orange-50">
                        {userInfo.vendor_title}
                      </p>
                    </div>
                  )}
                  <p className="text-orange-100">
                    از اینجا می‌توانید محصولات فروشگاه باسلام خود را مدیریت کنید.
                  </p>
                </div>
                {userInfo && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-100">شناسه فروشگاه</p>
                        <p className="text-lg font-bold">{userInfo.basalam_vendor_id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ApiSectionWrapper>

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

            <Link href="/dashboard/copy-product">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Copy className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">کپی محصول</h3>
                <p className="text-sm text-slate-500">کپی سریع محصولات موجود</p>
              </motion.div>
            </Link>
          </div>

          {/* Stats Cards */}
          <ApiSectionWrapper
            error={statsError}
            isLoading={statsLoading}
            onRetry={fetchStats}
            errorTitle="خطا در دریافت آمار محصولات"
            compact={true}
          >
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
          </ApiSectionWrapper>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
