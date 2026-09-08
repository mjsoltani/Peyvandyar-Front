"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminUser } from "@/lib/api";
import { formatFaDateTime, SUBSCRIPTION_LABELS } from "@/lib/admin";
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PER_PAGE = 30;

function StatusBadge({ user }: { user: AdminUser }) {
  const expired =
    Boolean(user.expires_at) && new Date(String(user.expires_at)).getTime() < Date.now();
  if (!user.is_active) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
        غیرفعال
      </span>
    );
  }
  if (expired) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
        منقضی
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">
      فعال
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, isActive, subscriptionType]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await adminApi.listUsers({
        page,
        per_page: PER_PAGE,
        q: debouncedQ || undefined,
        is_active: isActive === "" ? undefined : isActive === "true",
        subscription_type: subscriptionType || undefined,
      });
      const list = Array.isArray(response?.users) ? response.users : [];
      const pagination = response?.pagination || {};
      setUsers(list);
      setTotal(Number(pagination.total ?? list.length) || 0);
      setTotalPages(
        Number(pagination.total_pages ?? pagination.last_page ?? 1) || 1
      );
    } catch (err: any) {
      setError(err?.message || "خطا در دریافت لیست کاربران");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, isActive, subscriptionType]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">کاربران</h1>
            <p className="text-sm text-slate-500">
              {total.toLocaleString("fa-IR")} کاربر
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          بروزرسانی
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو: تلفن، نام، غرفه، آیدی"
            className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <select
          value={isActive}
          onChange={(e) => setIsActive(e.target.value as typeof isActive)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <select
          value={subscriptionType}
          onChange={(e) => setSubscriptionType(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
        >
          <option value="">همه اشتراک‌ها</option>
          {Object.entries(SUBSCRIPTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            کاربری یافت نشد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">تلفن</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">غرفه</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">اشتراک</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">آخرین فعالیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const phone = String(user.phone_number || "");
                  return (
                    <tr key={user.id ?? phone} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${encodeURIComponent(phone)}`}
                          className="font-medium text-orange-700 hover:underline"
                          dir="ltr"
                        >
                          {phone || "—"}
                        </Link>
                        {user.role === "superadmin" && (
                          <span className="mr-2 text-[11px] text-slate-400">superadmin</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          {user.vendor_title || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {SUBSCRIPTION_LABELS[String(user.subscription_type)] ||
                          user.subscription_type ||
                          "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge user={user} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatFaDateTime(user.last_activity_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
