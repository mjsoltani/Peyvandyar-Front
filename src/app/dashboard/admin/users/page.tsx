"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/dashboard/admin/admin-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { adminApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Users,
  Trash2,
  Search,
  RefreshCw,
  Store,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  basalam_user_id: number;
  basalam_vendor_id: number;
  vendor_title: string;
  token_count: number;
  last_used_at?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.vendor_title.toLowerCase().includes(query) ||
            user.basalam_vendor_id.toString().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getAllUsers();
      setUsers(response.users || []);
      setFilteredUsers(response.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("خطا در دریافت لیست کاربران");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteToken = async (username: string, userId: number) => {
    if (!confirm(`آیا از حذف توکن کاربر "${username}" اطمینان دارید؟`)) {
      return;
    }

    try {
      setDeletingUserId(userId);
      await adminApi.deleteToken(username);
      setSuccessMessage(`توکن کاربر "${username}" با موفقیت حذف شد`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting token:", error);
      setErrorMessage("خطا در حذف توکن");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "—";
    }
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    مدیریت کاربران
                  </h1>
                  <p className="text-sm text-slate-500">
                    {new Intl.NumberFormat("fa-IR").format(users.length)} کاربر
                  </p>
                </div>
              </div>
              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                بروزرسانی
              </button>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-800">{successMessage}</p>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-800">{errorMessage}</p>
              </motion.div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام، فروشگاه یا شناسه..."
                  className="w-full pr-11 pl-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
                  />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {searchQuery ? "کاربری یافت نشد" : "هیچ کاربری وجود ندارد"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          نام کاربری
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          فروشگاه
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          شناسه فروشگاه
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          تعداد توکن
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          آخرین استفاده
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">
                              {user.username}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {user.basalam_user_id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">
                                {user.vendor_title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-700">
                              {user.basalam_vendor_id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                                user.token_count > 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {user.token_count}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {formatDate(user.last_used_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteToken(user.username, user.id)}
                              disabled={deletingUserId === user.id || user.token_count === 0}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                              {deletingUserId === user.id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                                />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              حذف توکن
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </DashboardLayout>
    </AdminGuard>
  );
}
