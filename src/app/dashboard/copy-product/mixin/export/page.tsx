"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  mixinApi,
  MixinConnection,
  MixinExportLink,
  MixinExportSummary,
  MixinExportSyncMode,
  ApiError,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  Upload,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JOB_STORAGE_KEY = "mixin_export_job_id";
const POLL_MS = 2500;

function isNoConnectionError(message: string) {
  return /No active Mixin connection/i.test(message);
}

function formatToman(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("fa-IR") + " ت";
}

function formatRelative(dateStr?: string | null) {
  if (!dateStr) return "هنوز همگام نشده";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

function actionLabel(action?: string) {
  switch (action) {
    case "created":
      return "در میکسین ساخته شد";
    case "updated":
      return "به‌روزرسانی شد";
    case "linked_existing":
      return "محصول از قبل در میکسین بود و وصل شد";
    case "skipped":
      return "رد شد";
    case "failed":
      return "خطا";
    default:
      return action || "—";
  }
}

function skippedReasonLabel(reason?: string) {
  switch (reason) {
    case "imported_from_mixin":
      return "این محصول خودش از میکسین آمده؛ برای جلوگیری از چرخه منتقل نمی‌شود";
    case "not_your_product":
      return "محصول متعلق به غرفه شما نیست";
    case "not_linked":
      return "هنوز به میکسین منتقل نشده";
    default:
      return reason || "";
  }
}

function summarizeInline(summary?: MixinExportSummary) {
  if (!summary) return "عملیات تمام شد";
  const parts = [
    `کل: ${(summary.total ?? 0).toLocaleString("fa-IR")}`,
    `ساخته: ${(summary.created ?? 0).toLocaleString("fa-IR")}`,
    `به‌روز: ${(summary.updated ?? 0).toLocaleString("fa-IR")}`,
    `وصل‌شده: ${(summary.linked_existing ?? 0).toLocaleString("fa-IR")}`,
    `ردشده: ${(summary.skipped ?? 0).toLocaleString("fa-IR")}`,
    `ناموفق: ${(summary.failed ?? 0).toLocaleString("fa-IR")}`,
  ];
  return parts.join(" · ");
}

type JobUi = {
  id: string;
  status: string;
  done?: number;
  total?: number;
  percent?: number;
  currentProduct?: string;
  summary?: MixinExportSummary;
  error?: string;
};

export default function MixinExportPage() {
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<MixinConnection | null>(null);
  const [links, setLinks] = useState<MixinExportLink[]>([]);
  const [linksTotal, setLinksTotal] = useState(0);
  const [withErrors, setWithErrors] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [syncMode, setSyncMode] = useState<MixinExportSyncMode>("stock_price");
  const [includeImages, setIncludeImages] = useState(true);
  const [job, setJob] = useState<JobUi | null>(null);
  const [lastInlineItems, setLastInlineItems] = useState<any[]>([]);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 6000);
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadLinks = useCallback(async () => {
    const response: any = await mixinApi.getExportLinks({ limit: 100, offset: 0 });
    const data = response?.data ?? response;
    setLinks(Array.isArray(data?.links) ? data.links : []);
    setLinksTotal(Number(data?.total ?? 0));
    setWithErrors(Number(data?.with_errors ?? 0));
  }, []);

  const loadConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await mixinApi.getConnection();
      const data = response?.data ?? response;
      const conn = data.connection ?? null;
      if (!conn && data.connected === false) {
        setError("ابتدا فروشگاه Mixin را متصل کنید");
        setTimeout(() => {
          router.push("/dashboard/copy-product/mixin/connection");
        }, 1000);
        return;
      }
      setConnection(conn);
      setAutoSync(Boolean(conn?.export_auto_sync));
      setCategoryId(
        conn?.export_category_id != null ? String(conn.export_category_id) : ""
      );
      await loadLinks();
    } catch (err: any) {
      const msg = err.message || "خطا در دریافت وضعیت";
      if (isNoConnectionError(msg) || err.statusCode === 404) {
        setError("ابتدا فروشگاه Mixin را متصل کنید");
        setTimeout(() => {
          router.push("/dashboard/copy-product/mixin/connection");
        }, 1000);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [loadLinks, router]);

  const handleJobFinished = useCallback(
    async (finished: JobUi) => {
      stopPolling();
      try {
        localStorage.removeItem(JOB_STORAGE_KEY);
      } catch {
        /* ignore */
      }

      if (finished.status === "failed") {
        showToast("err", finished.error || "انتقال ناموفق بود");
        return;
      }

      const summary = finished.summary;
      if (summary?.aborted) {
        showToast(
          "err",
          summary.abort_reason ||
            "انتقال وسط کار قطع شد. کلید API میکسین را بررسی کنید (باید دسترسی نوشتن داشته باشد)."
        );
      } else {
        showToast("ok", summarizeInline(summary));
      }
      try {
        await loadLinks();
      } catch {
        /* ignore */
      }
    },
    [loadLinks, stopPolling]
  );

  const pollJob = useCallback(
    async (jobId: string) => {
      try {
        const response: any = await mixinApi.getJobStatus(jobId);
        const raw = response?.job ?? response?.data?.job ?? response?.data ?? response;
        const status = String(raw?.status || "").toLowerCase();
        const results = raw?.results ?? {};
        const summary = (results?.summary ?? raw?.summary) as
          | MixinExportSummary
          | undefined;

        const next: JobUi = {
          id: jobId,
          status,
          done:
            typeof raw?.progress_done === "number"
              ? raw.progress_done
              : undefined,
          total:
            typeof raw?.progress_total === "number"
              ? raw.progress_total
              : undefined,
          percent:
            typeof raw?.progress_percent === "number"
              ? raw.progress_percent
              : undefined,
          currentProduct: raw?.current_product
            ? String(raw.current_product)
            : undefined,
          summary,
          error: raw?.error ? String(raw.error) : undefined,
        };

        if (
          (next.done == null || next.total == null) &&
          typeof raw?.progress === "string" &&
          raw.progress.includes("/")
        ) {
          const [d, t] = raw.progress.split("/").map(Number);
          if (!Number.isNaN(d) && !Number.isNaN(t)) {
            next.done = d;
            next.total = t;
            if (next.percent == null && t > 0) next.percent = (d / t) * 100;
          }
        }

        setJob(next);

        if (status === "completed" || status === "failed") {
          if (Array.isArray(results?.items)) {
            setLastInlineItems(results.items);
          }
          await handleJobFinished(next);
          setJob((prev) =>
            prev && (status === "completed" || status === "failed") ? null : prev
          );
        }
      } catch (err: any) {
        showToast("err", err.message || "خطا در دریافت وضعیت job");
        stopPolling();
      }
    },
    [handleJobFinished, stopPolling]
  );

  const startPolling = useCallback(
    (jobId: string) => {
      try {
        localStorage.setItem(JOB_STORAGE_KEY, jobId);
      } catch {
        /* ignore */
      }
      setJob({ id: jobId, status: "pending" });
      stopPolling();
      void pollJob(jobId);
      pollRef.current = setInterval(() => {
        void pollJob(jobId);
      }, POLL_MS);
    },
    [pollJob, stopPolling]
  );

  useEffect(() => {
    void loadConnection();
    return () => stopPolling();
  }, [loadConnection, stopPolling]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(JOB_STORAGE_KEY);
      if (saved) startPolling(saved);
    } catch {
      /* ignore */
    }
    // فقط یک‌بار هنگام mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportResult = async (response: any, kind: "export" | "sync") => {
    const data = response?.data ?? response;
    if (data.success === false) {
      showToast("err", data.error || data.message || "عملیات ناموفق بود");
      return;
    }

    if (data.mode === "queued" && data.job_id) {
      showToast(
        "ok",
        data.message ||
          (kind === "export"
            ? "انتقال در صف قرار گرفت"
            : "همگام‌سازی در صف قرار گرفت")
      );
      startPolling(String(data.job_id));
      return;
    }

    // inline
    setLastInlineItems(Array.isArray(data.items) ? data.items : []);
    if (data.summary?.aborted) {
      showToast(
        "err",
        data.summary.abort_reason ||
          "عملیات قطع شد. کلید API میکسین را بررسی کنید."
      );
    } else {
      showToast("ok", summarizeInline(data.summary));
    }
    await loadLinks();
  };

  const handleExportAll = async () => {
    const ok = window.confirm(
      "همه محصولات غرفه باسلام به فروشگاه میکسین منتقل می‌شوند. این کار ممکن است چند دقیقه طول بکشد. ادامه می‌دهید؟"
    );
    if (!ok) return;

    try {
      setExporting(true);
      setError("");
      const body: {
        include_images: boolean;
        category_id?: number;
      } = { include_images: includeImages };
      const cat = categoryId.trim();
      if (cat && !Number.isNaN(Number(cat))) {
        body.category_id = Number(cat);
      }
      const response = await mixinApi.exportProducts(body);
      await handleExportResult(response, "export");
    } catch (err: any) {
      const msg = err.message || "خطا در انتقال";
      if (isNoConnectionError(msg)) {
        showToast("err", "ابتدا فروشگاه Mixin را متصل کنید");
        router.push("/dashboard/copy-product/mixin/connection");
      } else if (
        err instanceof ApiError &&
        err.statusCode === 401 &&
        /کلید|api.?key|اجازه|نوشتن/i.test(msg)
      ) {
        showToast(
          "err",
          msg.includes("اجازه")
            ? msg
            : "کلید API میکسین نامعتبر است یا اجازه ساخت محصول ندارد. کلید جدید با دسترسی نوشتن بسازید."
        );
      } else {
        showToast("err", msg);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleSync = async () => {
    if (linksTotal === 0) {
      showToast(
        "err",
        "هنوز محصولی منتقل نشده. اول «انتقال همه‌ی محصولات به میکسین» را بزنید."
      );
      return;
    }
    const ok = window.confirm(
      syncMode === "full"
        ? "نام، توضیحات، قیمت و موجودی همه محصولات لینک‌شده روی میکسین به‌روز می‌شود. ادامه می‌دهید؟"
        : "قیمت و موجودی همه محصولات لینک‌شده روی میکسین به‌روز می‌شود. ادامه می‌دهید؟"
    );
    if (!ok) return;

    try {
      setSyncing(true);
      const response = await mixinApi.exportSync({ mode: syncMode });
      await handleExportResult(response, "sync");
    } catch (err: any) {
      showToast("err", err.message || "خطا در همگام‌سازی");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const body: { auto_sync: boolean; category_id: number | null } = {
        auto_sync: autoSync,
        category_id: categoryId.trim()
          ? Number(categoryId.trim())
          : null,
      };
      if (body.category_id != null && Number.isNaN(body.category_id)) {
        showToast("err", "شناسه دسته‌بندی معتبر نیست");
        return;
      }
      const response: any = await mixinApi.updateExportSettings(body);
      const data = response?.data ?? response;
      if (data.success === false) {
        showToast("err", data.error || data.message || "ذخیره تنظیمات ناموفق بود");
        if (autoSync) setAutoSync(false);
        return;
      }
      const conn = data.connection ?? connection;
      setConnection(conn);
      setAutoSync(Boolean(conn?.export_auto_sync));
      setCategoryId(
        conn?.export_category_id != null ? String(conn.export_category_id) : ""
      );
      if (autoSync && linksTotal === 0) {
        showToast(
          "ok",
          "سینک خودکار روشن شد. برای اثرگذاری، اول یک‌بار انتقال اولیه را انجام دهید."
        );
      } else {
        showToast("ok", "تنظیمات ذخیره شد");
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 502) {
        setAutoSync(false);
        showToast(
          "err",
          err.message ||
            "ثبت وب‌هوک باسلام ناموفق بود؛ سینک خودکار فعال نشد"
        );
      } else {
        showToast("err", err.message || "خطا در ذخیره تنظیمات");
        setAutoSync(Boolean(connection?.export_auto_sync));
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const shopUrl = connection?.shop_url
    ? String(connection.shop_url).replace(/\/$/, "")
    : "";

  const progressPercent =
    job?.percent != null
      ? Math.min(100, Math.max(0, job.percent))
      : job?.done != null && job?.total
        ? Math.min(100, Math.round((job.done / job.total) * 100))
        : null;

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/copy-product/mixin")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800">
                    انتقال به میکسین
                  </h1>
                  {withErrors > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {withErrors.toLocaleString("fa-IR")} خطا
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  محصولات غرفه باسلام را به فروشگاه میکسین بفرستید و همگام نگه دارید
                </p>
              </div>
            </div>
            {connection?.shop_url && (
              <p className="text-xs text-slate-500" dir="ltr">
                {connection.shop_name || connection.shop_url}
              </p>
            )}
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

          {job && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-orange-800 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {job.status === "pending"
                    ? "در صف…"
                    : job.status === "processing"
                      ? "در حال انتقال…"
                      : job.status}
                  {job.done != null && job.total != null && (
                    <span>
                      {job.done.toLocaleString("fa-IR")} /{" "}
                      {job.total.toLocaleString("fa-IR")}
                    </span>
                  )}
                </div>
                {progressPercent != null && (
                  <span className="text-orange-700 text-xs">
                    {Math.round(progressPercent).toLocaleString("fa-IR")}٪
                  </span>
                )}
              </div>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${progressPercent ?? 8}%` }}
                />
              </div>
              {job.currentProduct && (
                <p className="text-xs text-orange-700" dir="ltr">
                  product: {job.currentProduct}
                </p>
              )}
              <p className="text-xs text-slate-500">
                می‌توانید صفحه را ببندید؛ با برگشتن پیشرفت ادامه پیدا می‌کند.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال بارگذاری…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h2 className="font-bold text-slate-800">عملیات</h2>
                <p className="text-sm text-slate-500">
                  کلید API میکسین باید دسترسی نوشتن (ساخت و ویرایش محصول) داشته باشد.
                  انتقال تکراری امن است؛ محصولات قبلی فقط به‌روز می‌شوند.
                </p>

                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  آپلود عکس‌ها همراه انتقال
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportAll}
                    disabled={exporting || Boolean(job)}
                    className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl flex items-center gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    انتقال همه‌ی محصولات به میکسین
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={syncMode}
                      onChange={(e) =>
                        setSyncMode(e.target.value as MixinExportSyncMode)
                      }
                      className="px-3 py-3 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                      <option value="stock_price">فقط قیمت و موجودی</option>
                      <option value="full">کامل (نام و توضیح هم)</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing || Boolean(job)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold rounded-xl flex items-center gap-2"
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      به‌روزرسانی قیمت و موجودی
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-slate-800">تنظیمات</h2>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">همگام‌سازی خودکار</span>
                    <br />
                    <span className="text-slate-500">
                      با روشن کردن، تغییرات باسلام (قیمت، موجودی، …) روی میکسین اعمال
                      می‌شود. فقط روی محصولاتی که حداقل یک‌بار منتقل شده‌اند کار می‌کند.
                    </span>
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    شناسه دسته‌بندی پیش‌فرض میکسین (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="مثلاً 45 — خالی = پاک کردن"
                    className="w-full max-w-xs px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    dir="ltr"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:border-orange-300 text-slate-800 font-medium rounded-xl disabled:opacity-50"
                >
                  {savingSettings ? "در حال ذخیره…" : "ذخیره تنظیمات"}
                </button>
              </div>

              {/* Last batch items (inline / job results sample) */}
              {lastInlineItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <h2 className="font-bold text-slate-800">نتیجه آخرین عملیات</h2>
                  <ul className="space-y-2 text-sm">
                    {lastInlineItems.slice(0, 20).map((item, idx) => (
                      <li
                        key={`${item.basalam_product_id}-${idx}`}
                        className="flex flex-wrap gap-2 items-center text-slate-700"
                      >
                        <span className="font-medium" dir="ltr">
                          {item.basalam_product_id}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span>{actionLabel(item.action)}</span>
                        {item.action === "skipped" && item.reason && (
                          <span className="text-amber-700 text-xs">
                            ({skippedReasonLabel(item.reason)})
                          </span>
                        )}
                        {item.action === "failed" && item.error && (
                          <span className="text-red-600 text-xs">
                            ({item.error})
                          </span>
                        )}
                        {typeof item.unmatched_variants === "number" &&
                          item.unmatched_variants > 0 && (
                            <span className="text-amber-600 text-xs">
                              {item.unmatched_variants.toLocaleString("fa-IR")} تنوع
                              بدون معادل
                            </span>
                          )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Links table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-800">
                      محصولات منتقل‌شده
                    </h2>
                    <p className="text-xs text-slate-500">
                      {linksTotal.toLocaleString("fa-IR")} مورد · قیمت به تومان
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadLinks()}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"
                    title="بازنشانی"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {links.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    هنوز محصولی منتقل نشده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-right">
                          <th className="px-4 py-3 font-medium">عنوان</th>
                          <th className="px-4 py-3 font-medium">قیمت میکسین</th>
                          <th className="px-4 py-3 font-medium">موجودی</th>
                          <th className="px-4 py-3 font-medium">وضعیت</th>
                          <th className="px-4 py-3 font-medium">آخرین همگام‌سازی</th>
                          <th className="px-4 py-3 font-medium">لینک</th>
                        </tr>
                      </thead>
                      <tbody>
                        {links.map((link) => {
                          const hasErr = Boolean(link.last_error);
                          return (
                            <tr
                              key={link.id}
                              title={
                                hasErr
                                  ? String(link.last_error)
                                  : undefined
                              }
                              className={cn(
                                "border-t border-slate-100",
                                hasErr ? "bg-red-50/80" : "hover:bg-slate-50/80"
                              )}
                            >
                              <td className="px-4 py-3 text-slate-800 max-w-[220px]">
                                <div className="truncate font-medium">
                                  {link.basalam_title || "—"}
                                </div>
                                {hasErr && (
                                  <div className="text-xs text-red-600 mt-1 truncate">
                                    {link.last_error}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {formatToman(link.last_price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {link.last_stock != null
                                  ? Number(link.last_stock).toLocaleString("fa-IR")
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {link.last_available == null
                                  ? "—"
                                  : link.last_available
                                    ? "موجود"
                                    : "ناموجود"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                {formatRelative(link.last_synced_at)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {link.basalam_product_id && (
                                    <a
                                      href={`https://basalam.com/p/${link.basalam_product_id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-orange-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      باسلام
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {shopUrl && link.mixin_product_id && (
                                    <a
                                      href={`${shopUrl}/product/${link.mixin_product_id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-slate-600 hover:underline inline-flex items-center gap-1"
                                      dir="ltr"
                                    >
                                      Mixin
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
