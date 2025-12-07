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
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id?: number;
  phone_number: string;
  username?: string;
  vendor_title?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actioningPhone, setActioningPhone] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchQuery || undefined,
      });
      
      if (response.success && response.data) {
        const usersData = response.data?.data || [];
        const total = response.pagination?.total || 0;
        setUsers(usersData);
        setFilteredUsers(usersData);
        setTotalUsers(total);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("خطا در دریافت لیست کاربران");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUser = async (phoneNumber: string) => {
    if (!confirm(`آیا از فعال کردن کاربر "${phoneNumber}" اطمینان دارید؟`)) {
      return;
    }

    try {
      setActioningPhone(phoneNumber);
      await adminApi.activateUser(phoneNumber);
      setSuccessMessage(`کاربر "${phoneNumber}" با موفقیت فعال شد`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (error) {
      console.error("Error activating user:", error);
      setErrorMessage("خطا در فعال کردن کاربر");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setActioningPhone(null);
    }
  };

  const handleDeactivateUser = async (phoneNumber: string) => {
    if (!confirm(`آیا از غیرفعال کردن کاربر "${phoneNumber}" اطمینان دارید؟`)) {
      return;
    }

    try {
      setActioningPhone(phoneNumber);
      await adminApi.deactivateUser(phoneNumber);
      setSuccessMessage(`کاربر "${phoneNumber}" با موفقیت غیرفعال شد`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      setErrorMessage("خطا در غیرفعال کردن کاربر");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setActioningPhone(null);
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
                    {new Intl.NumberFormat("fa-IR").format(totalUsers)} کاربر
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchUsers()}
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
                  placeholder="جستجو بر اساس شماره تلفن یا نام..."
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
                          شماره تلفن
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          نام کاربری
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          وضعیت
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          تاریخ ایجاد
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.phone_number}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800 dir-ltr">
                              {user.phone_number}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-700">
                              {user.username || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                                user.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              {user.status === "active" ? "فعال" : "غیرفعال"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {formatDate(user.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {user.status === "active" ? (
                                <button
                                  onClick={() => handleDeactivateUser(user.phone_number)}
                                  disabled={actioningPhone === user.phone_number}
                                  className={cn(
                                    "px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm",
                                    actioningPhone === user.phone_number
                                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                      : "bg-red-50 text-red-600 hover:bg-red-100"
                                  )}
                                >
                                  {actioningPhone === user.phone_number ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Lock className="w-4 h-4" />
                                  )}
                                  غیرفعال
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateUser(user.phone_number)}
                                  disabled={actioningPhone === user.phone_number}
                                  className={cn(
                                    "px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm",
                                    actioningPhone === user.phone_number
                                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                      : "bg-green-50 text-green-600 hover:bg-green-100"
                                  )}
                                >
                                  {actioningPhone === user.phone_number ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Unlock className="w-4 h-4" />
                                  )}
                                  فعال
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalUsers > itemsPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    نمایش {new Intl.NumberFormat("fa-IR").format(((currentPage - 1) * itemsPerPage) + 1)} تا{" "}
                    {new Intl.NumberFormat("fa-IR").format(Math.min(currentPage * itemsPerPage, totalUsers))} از{" "}
                    {new Intl.NumberFormat("fa-IR").format(totalUsers)} کاربر
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      قبلی
                    </button>
                    <span className="px-3 py-2 text-sm text-slate-600">
                      صفحه {new Intl.NumberFormat("fa-IR").format(currentPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage * itemsPerPage >= totalUsers}
                      className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </DashboardLayout>
    </AdminGuard>
  );
}
