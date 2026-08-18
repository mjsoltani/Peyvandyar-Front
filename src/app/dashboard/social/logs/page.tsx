"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  socialApi,
  SOCIAL_PLATFORM_LABELS,
  SocialPlatform,
  ApiError,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  History,
  ArrowRight,
  AlertCircle,
  Loader2,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function isNotConfigured(err: unknown) {
  if (err instanceof ApiError) {
    return (
      err.code === "NOT_CONFIGURED" ||
      err.statusCode === 404 ||
      /NOT_CONFIGURED|هنوز اتصال|تنظیم نشده/i.test(err.message)
    );
  }
  return false;
}

function platformLabel(platform?: string) {
  if (!platform) return "—";
  return SOCIAL_PLATFORM_LABELS[platform as SocialPlatform] || platform;
}

function extractLogs(response: any): any[] {
  const data = response?.data ?? response;
  if (Array.isArray(data?.logs)) return data.logs;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function extractSummary(response: any): any {
  return response?.data ?? response ?? {};
}

export default function SocialLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"" | "success" | "failed">("");
  const [platformFilter, setPlatformFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setNotConfigured(false);

      const [logsRes, summaryRes] = await Promise.all([
        socialApi.getLogs({
          page: 1,
          limit: 20,
          status: statusFilter || undefined,
          platform: platformFilter || undefined,
        }),
        socialApi.getSummary({ groupBy: "platform" }),
      ]);

      setLogs(extractLogs(logsRes));
      setSummary(extractSummary(summaryRes));
    } catch (err: any) {
      if (isNotConfigured(err)) {
        setNotConfigured(true);
        setLogs([]);
        setSummary(null);
      } else {
        setError(err.message || "خطا در دریافت لاگ‌ها");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const total = summary?.total ?? summary?.total_publishes ?? summary?.count;
  const successCount = summary?.success ?? summary?.successful ?? summary?.success_count;
  const failedCount = summary?.failed ?? summary?.failure_count;
  const groups = Array.isArray(summary?.groups)
    ? summary.groups
    : Array.isArray(summary?.items)
      ? summary.items
      : Array.isArray(summary?.by_platform)
        ? summary.by_platform
        : [];

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/social")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به شبکه‌های اجتماعی
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">تاریخچه</h1>
              <p className="text-sm text-slate-500">لاگ‌ها و خلاصه گزارش انتشار</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {notConfigured && (
            <div className="mb-4 p-6 bg-white border border-slate-200 rounded-xl text-center">
              <Share2 className="w-10 h-10 text-orange-400 mx-auto mb-3" />
              <p className="text-slate-800 font-medium mb-2">هنوز اتصال سوشیال تنظیم نشده</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/social/settings")}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold"
              >
                رفتن به تنظیمات
              </button>
            </div>
          )}

          {!notConfigured && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "کل انتشار", value: total },
                  { label: "موفق", value: successCount },
                  { label: "ناموفق", value: failedCount },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {card.value != null ? Number(card.value).toLocaleString("fa-IR") : "—"}
                    </p>
                  </div>
                ))}
              </div>

              {groups.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                  <h2 className="font-bold text-slate-800 mb-3">بر اساس پلتفرم</h2>
                  <div className="space-y-2">
                    {groups.map((g: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2"
                      >
                        <span>{platformLabel(g.platform || g.key || g.name)}</span>
                        <span className="text-slate-600">
                          {g.total ?? g.count ?? g.success ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "" | "success" | "failed")
                  }
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="success">موفق</option>
                  <option value="failed">ناموفق</option>
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">همه پلتفرم‌ها</option>
                  {Object.entries(SOCIAL_PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={load}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-orange-300"
                >
                  بروزرسانی
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                  <div className="p-12 flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال بارگذاری...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">لاگی یافت نشد.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-slate-600">
                          <th className="text-right p-3 font-medium">زمان</th>
                          <th className="text-right p-3 font-medium">پلتفرم</th>
                          <th className="text-right p-3 font-medium">وضعیت</th>
                          <th className="text-right p-3 font-medium">پیام</th>
                          <th className="text-right p-3 font-medium">مدت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, idx) => {
                          const ok =
                            log.status === "success" ||
                            log.success === true ||
                            log.status === "ok";
                          const when =
                            log.created_at ||
                            log.createdAt ||
                            log.timestamp ||
                            log.time;
                          return (
                            <tr key={log.id ?? idx} className="border-b border-slate-100">
                              <td className="p-3 whitespace-nowrap text-slate-600">
                                {when
                                  ? new Date(when).toLocaleString("fa-IR")
                                  : "—"}
                              </td>
                              <td className="p-3">
                                {platformLabel(log.platform)}
                              </td>
                              <td className="p-3">
                                <span
                                  className={cn(
                                    "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                                    ok
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  )}
                                >
                                  {ok ? "موفق" : "ناموفق"}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 max-w-[240px] truncate">
                                {log.error || log.message || log.reason || "—"}
                              </td>
                              <td className="p-3 text-slate-500 whitespace-nowrap">
                                {log.duration_ms != null
                                  ? `${log.duration_ms}ms`
                                  : log.duration || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
