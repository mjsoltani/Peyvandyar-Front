"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard } from "@/components/dashboard/admin/admin-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { adminApi } from "@/lib/api";
import { getLocalAdminSession, logoutAdmin } from "@/lib/admin";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  Shield,
  Activity,
  LogOut,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  pendingTokens: number;
  activeUsers: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingTokens: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState("");

  useEffect(() => {
    const session = getLocalAdminSession();
    if (session) {
      setAdminUsername(session.username);
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, pendingResponse] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getPendingTokens(),
      ]);

      setStats({
        totalUsers: usersResponse.count || 0,
        pendingTokens: pendingResponse.count || 0,
        activeUsers: usersResponse.users?.filter((u: any) => u.token_count > 0).length || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    router.push("/dashboard/admin/login");
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8" />
                    <h1 className="text-2xl md:text-3xl font-bold">
                      پنل مدیریت
                    </h1>
                  </div>
                  <p className="text-orange-100">
                    خوش آمدید {adminUsername}، مدیریت کاربران و توکن‌ها
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 flex items-center gap-2 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">خروج</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold text-slate-800">
                    {isLoading ? "..." : new Intl.NumberFormat("fa-IR").format(stats.totalUsers)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">کل کاربران</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-orange-500" />
                  <span className="text-3xl font-bold text-slate-800">
                    {isLoading ? "..." : new Intl.NumberFormat("fa-IR").format(stats.pendingTokens)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">توکن‌های در انتظار</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold text-slate-800">
                    {isLoading ? "..." : new Intl.NumberFormat("fa-IR").format(stats.activeUsers)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">کاربران فعال</p>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-xl font-bold text-slate-800 mb-4">دسترسی سریع</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/admin/users">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">مدیریت کاربران</h3>
                  <p className="text-sm text-slate-500">
                    مشاهده و مدیریت تمام کاربران سیستم
                  </p>
                </motion.div>
              </Link>

              <Link href="/dashboard/admin/pending">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-6 border border-slate-200 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">توکن‌های در انتظار</h3>
                  <p className="text-sm text-slate-500">
                    تایید یا رد توکن‌های جدید
                  </p>
                  {stats.pendingTokens > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs font-medium">
                      <span>{new Intl.NumberFormat("fa-IR").format(stats.pendingTokens)}</span>
                      <span>در انتظار</span>
                    </div>
                  )}
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </main>
      </DashboardLayout>
    </AdminGuard>
  );
}
