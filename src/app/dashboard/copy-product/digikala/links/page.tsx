"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { digikalaApi, DigikalaLink, DigikalaSyncFields } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Link2,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SyncFieldsUi = "price" | "stock" | "all";

function formatPrice(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  // قیمت API معمولاً ریال است → نمایش تومان
  const toman = Math.round(Number(value) / 10);
  return toman.toLocaleString("fa-IR") + " ت";
}

function formatRelative(dateStr?: string | null) {
  if (!dateStr) return "هنوز سینک نشده";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

function extractLinks(response: any): DigikalaLink[] {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.links)) return data.links;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function syncToastMessage(result: any, mode: "one" | "all") {
  if (mode === "all" || result?.mode === "batch") {
    const updated = result?.updated ?? 0;
    const unchanged = result?.unchanged ?? 0;
    const failed = result?.failed ?? 0;
    return `سینک تمام شد: ${updated} به‌روز شد، ${unchanged} بدون تغییر، ${failed} ناموفق`;
  }

  if (result?.basalam_updated) {
    const parts: string[] = [];
    if (result.price_changed) parts.push("قیمت");
    if (result.stock_changed) parts.push("موجودی");
    return parts.length
      ? `به‌روزرسانی شد (${parts.join(" و ")})`
      : "به‌روزرسانی شد";
  }

  return "قبلاً به‌روز بود؛ تغییری لازم نبود";
}

export default function DigikalaLinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<DigikalaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [fields, setFields] = useState<SyncFieldsUi>("all");
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingOne, setSyncingOne] = useState<number | null>(null);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await digikalaApi.getLinks({ limit: 100, offset: 0 });
      setLinks(extractLinks(response));
    } catch (err: any) {
      setError(err.message || "خطا در دریافت لیست لینک‌ها");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const warnMissingSellerCode = (link: DigikalaLink) => {
    if ((fields === "stock" || fields === "all") && !link.digikala_seller_code) {
      return window.confirm(
        "کد فروشنده دیجی‌کالا برای این لینک خالی است؛ سینک موجودی ممکن است ناموفق شود. ادامه می‌دهید؟"
      );
    }
    return true;
  };

  const handleSyncOne = async (link: DigikalaLink) => {
    if (!warnMissingSellerCode(link)) return;

    try {
      setSyncingOne(link.id);
      const response = await digikalaApi.sync({
        link_id: link.id,
        fields: fields as DigikalaSyncFields,
      });
      const data: any = response.data ?? response;
      if (data.success === false) {
        showToast("err", data.error || data.message || "خطا در سینک");
      } else {
        showToast("ok", syncToastMessage(data, "one"));
      }
      await loadLinks();
    } catch (err: any) {
      showToast("err", err.message || "خطا در سینک");
      await loadLinks();
    } finally {
      setSyncingOne(null);
    }
  };

  const handleSyncAll = async () => {
    const ok = window.confirm(
      "قیمت/موجودی همه محصولات لینک‌شده از دیجی‌کالا روی غرفه باسلام به‌روز می‌شود. ادامه می‌دهید؟"
    );
    if (!ok) return;

    try {
      setSyncingAll(true);
      const response = await digikalaApi.sync({ fields });
      const data: any = response.data ?? response;
      if (data.success === false) {
        showToast("err", data.error || data.message || "خطا در سینک همه");
      } else {
        showToast("ok", syncToastMessage(data, "all"));
      }
      await loadLinks();
    } catch (err: any) {
      showToast("err", err.message || "خطا در سینک همه");
      await loadLinks();
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/copy-product/digikala")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">محصولات دیجی‌کالا</h1>
                <p className="text-sm text-slate-500">
                  لینک‌های ایمپورت‌شده و سینک قیمت / موجودی
                </p>
              </div>
            </div>
          </div>

          {toast && (
            <div
              className={cn(
                "mb-4 p-4 rounded-xl border text-sm",
                toast.type === "ok"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              )}
            >
              {toast.text}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-600">نوع سینک:</span>
              {(
                [
                  { id: "price", label: "قیمت" },
                  { id: "stock", label: "موجودی" },
                  { id: "all", label: "قیمت + موجودی" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFields(opt.id)}
                  disabled={syncingAll || syncingOne != null}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    fields === opt.id
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadLinks}
                disabled={loading || syncingAll}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-orange-300 disabled:opacity-50"
              >
                بروزرسانی لیست
              </button>
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={syncingAll || syncingOne != null || links.length === 0}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-bold flex items-center gap-2"
              >
                {syncingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال سینک همه...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    سینک همه
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال بارگذاری...
              </div>
            ) : links.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                هنوز محصولی از دیجی‌کالا ایمپورت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-600">
                      <th className="text-right p-3 font-medium">عنوان</th>
                      <th className="text-right p-3 font-medium">قیمت DK</th>
                      <th className="text-right p-3 font-medium">قیمت باسلام</th>
                      <th className="text-right p-3 font-medium">موجودی DK</th>
                      <th className="text-right p-3 font-medium">موجودی باسلام</th>
                      <th className="text-right p-3 font-medium">آخرین سینک</th>
                      <th className="text-right p-3 font-medium">وضعیت</th>
                      <th className="text-right p-3 font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => {
                      const title =
                        link.digikala_title ||
                        link.external_title ||
                        `لینک #${link.id}`;
                      const isRowSyncing = syncingOne === link.id;
                      return (
                        <tr
                          key={link.id}
                          className="border-b border-slate-100 hover:bg-slate-50/80"
                        >
                          <td className="p-3">
                            <div className="font-medium text-slate-800 max-w-[220px] truncate">
                              {title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {link.source_url && (
                                <a
                                  href={link.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-orange-600 hover:underline inline-flex items-center gap-1"
                                >
                                  دیجی‌کالا
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {link.basalam_product_id != null && (
                                <span className="text-xs text-slate-400" dir="ltr">
                                  BS:{String(link.basalam_product_id)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {formatPrice(link.last_digikala_price)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {formatPrice(link.last_basalam_price)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {link.last_digikala_stock ?? "—"}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {link.last_basalam_stock ?? "—"}
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-500">
                            {formatRelative(link.last_synced_at)}
                          </td>
                          <td className="p-3">
                            {link.last_error ? (
                              <span
                                className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
                                title={link.last_error}
                              >
                                خطای سینک
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                سالم
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleSyncOne(link)}
                              disabled={syncingAll || syncingOne != null}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-300 text-sm font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              {isRowSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              سینک
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
