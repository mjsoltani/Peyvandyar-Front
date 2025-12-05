"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/dashboard/admin/admin-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { adminApi } from "@/lib/api";
import { getLocalAdminSession } from "@/lib/admin";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  User,
  Store,
} from "lucide-react";

interface PendingToken {
  id: number;
  username: string;
  basalam_user_id?: number;
  basalam_vendor_id?: number;
  vendor_title?: string;
  created_at?: string;
  status: string;
}

export default function AdminPendingPage() {
  const [tokens, setTokens] = useState<PendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTokenId, setProcessingTokenId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [adminUsername, setAdminUsername] = useState("");

  useEffect(() => {
    const session = getLocalAdminSession();
    if (session) {
      setAdminUsername(session.username);
    }
    fetchPendingTokens();
  }, []);

  const fetchPendingTokens = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getPendingTokens();
      setTokens(response.tokens || []);
    } catch (error) {
      console.error("Error fetching pending tokens:", error);
      setErrorMessage("خطا در دریافت توکن‌های در انتظار");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (tokenId: number, username: string) => {
    try {
      setProcessingTokenId(tokenId);
      await adminApi.approveToken(tokenId, adminUsername);
      setSuccessMessage(`توکن کاربر "${username}" تایید شد`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchPendingTokens();
    } catch (error) {
      console.error("Error approving token:", error);
      setErrorMessage("خطا در تایید توکن");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setProcessingTokenId(null);
    }
  };

  const handleReject = async (tokenId: number, username: string) => {
    if (!confirm(`آیا از رد توکن کاربر "${username}" اطمینان دارید؟`)) {
      return;
    }

    try {
      setProcessingTokenId(tokenId);
      await adminApi.rejectToken(tokenId);
      setSuccessMessage(`توکن کاربر "${username}" رد شد`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchPendingTokens();
    } catch (error) {
      console.error("Error rejecting token:", error);
      setErrorMessage("خطا در رد توکن");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setProcessingTokenId(null);
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
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    توکن‌های در انتظار
                  </h1>
                  <p className="text-sm text-slate-500">
                    {new Intl.NumberFormat("fa-IR").format(tokens.length)} توکن
                  </p>
                </div>
              </div>
              <button
                onClick={fetchPendingTokens}
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

            {/* Tokens List */}
            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
                />
              </div>
            ) : tokens.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">هیچ توکنی در انتظار تایید نیست</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tokens.map((token, index) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">
                              {token.username}
                            </h3>
                            {token.basalam_user_id && (
                              <p className="text-xs text-slate-500">
                                ID: {token.basalam_user_id}
                              </p>
                            )}
                          </div>
                        </div>

                        {token.vendor_title && (
                          <div className="flex items-center gap-2 mb-2">
                            <Store className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {token.vendor_title}
                            </span>
                            {token.basalam_vendor_id && (
                              <span className="text-xs text-slate-400">
                                (ID: {token.basalam_vendor_id})
                              </span>
                            )}
                          </div>
                        )}

                        {token.created_at && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-4 h-4" />
                            {formatDate(token.created_at)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(token.id, token.username)}
                          disabled={processingTokenId === token.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {processingTokenId === token.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          تایید
                        </button>

                        <button
                          onClick={() => handleReject(token.id, token.username)}
                          disabled={processingTokenId === token.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          رد
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </DashboardLayout>
    </AdminGuard>
  );
}
