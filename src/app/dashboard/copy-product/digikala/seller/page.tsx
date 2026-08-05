"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { digikalaApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Store,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getPreviewItems(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.preview)) return data.preview;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data?.preview)) return data.data.preview;
  return [];
}

function getProductIds(data: any): number[] {
  const raw =
    data?.product_ids ||
    data?.data?.product_ids ||
    getPreviewItems(data).map((p) => p.id || p.product_id || p.dkp);
  return (raw || [])
    .map((id: any) => Number(id))
    .filter((id: number) => !Number.isNaN(id));
}

export default function DigikalaSellerImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sellerData, setSellerData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  const previewItems = useMemo(() => getPreviewItems(sellerData), [sellerData]);
  const allIds = useMemo(() => getProductIds(sellerData), [sellerData]);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const status = await digikalaApi.getJobStatus(jobId);
        if (cancelled) return;

        setJobStatus(String(status.status || ""));
        if (typeof status.progress === "number") {
          setJobProgress(status.progress);
        }

        const normalized = String(status.status || "").toLowerCase();
        if (normalized === "completed" || normalized === "success") {
          setSuccess("ایمپورت با موفقیت تمام شد");
          setIsImporting(false);
          setJobId(null);
          return;
        }
        if (normalized === "failed" || normalized === "error") {
          setError(
            String(status.error || status.message || "ایمپورت ناموفق بود")
          );
          setIsImporting(false);
          setJobId(null);
          return;
        }

        setTimeout(poll, 2000);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "خطا در پیگیری وضعیت ایمپورت");
          setIsImporting(false);
          setJobId(null);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("لطفا لینک غرفه دیجی‌کالا را وارد کنید");
      return;
    }
    if (!url.includes("digikala.com") || !url.includes("/seller/")) {
      setError("لینک معتبر غرفه وارد کنید (مثلاً /seller/DCVJG/)");
      return;
    }

    try {
      setIsPreviewing(true);
      setError("");
      setSuccess("");
      setSellerData(null);
      setSelectedIds([]);

      const response = await digikalaApi.previewSeller({
        url: url.trim(),
        preview_limit: 40,
        only_marketable: true,
      });

      if ((response as any).success === false) {
        setError((response as any).message || (response as any).error || "خطا در پیش‌نمایش غرفه");
        return;
      }

      const data = response.data ?? response;
      setSellerData(data);
      const ids = getProductIds(data);
      setSelectedIds(ids);
    } catch (err: any) {
      setError(err.message || "خطا در پیش‌نمایش غرفه");
    } finally {
      setIsPreviewing(false);
    }
  };

  const toggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setError("حداقل یک محصول را انتخاب کنید");
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      setSuccess("");
      setJobId(null);
      setJobProgress(null);
      setJobStatus(null);

      const response = await digikalaApi.importSeller({
        url: url.trim(),
        product_ids: selectedIds,
        skip_existing: true,
        only_marketable: true,
        upload_media: true,
      });

      const data: any = response.data ?? response;

      if (data.success === false) {
        setError(data.message || data.error || "خطا در ایمپورت");
        setIsImporting(false);
        return;
      }

      const returnedJobId = data.job_id || data.jobId;
      if (returnedJobId) {
        setJobId(String(returnedJobId));
        setSuccess("ایمپورت شروع شد؛ در حال پیگیری وضعیت...");
        return;
      }

      setSuccess(
        `ایمپورت انجام شد${data.imported != null ? `: ${data.imported} محصول` : ""}`
      );
      setIsImporting(false);
    } catch (err: any) {
      const msg = err.message || "خطا در ایمپورت";
      if (err.statusCode === 404 || /No Digikala products left/i.test(msg)) {
        setError("چیزی برای ایمپورت نمانده؛ احتمالاً همه قبلاً لینک شده‌اند");
      } else {
        setError(msg);
      }
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/copy-product/digikala")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ایمپورت از غرفه seller</h1>
              <p className="text-sm text-slate-500">
                پیش‌نمایش کاتالوگ، انتخاب محصولات و ایمپورت به باسلام
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 space-y-1">
                <p>{success}</p>
                {jobStatus && (
                  <p>
                    وضعیت: {jobStatus}
                    {jobProgress != null ? ` — ${jobProgress}%` : ""}
                  </p>
                )}
                {!jobId && (
                  <button
                    onClick={() => router.push("/dashboard/copy-product/digikala/links")}
                    className="underline font-medium"
                  >
                    مشاهده لیست محصولات دیجی‌کالا
                  </button>
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={handlePreview}
            className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                لینک غرفه دیجی‌کالا
              </label>
              <div className="relative">
                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.digikala.com/seller/DCVJG/"
                  className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPreviewing}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال دریافت کاتالوگ...
                </>
              ) : (
                "پیش‌نمایش کاتالوگ"
              )}
            </button>
          </form>

          {sellerData && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-slate-800">
                    {sellerData.seller_code || sellerData.seller_url || "کاتالوگ فروشنده"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    تعداد پیدا‌شده: {sellerData.product_count ?? allIds.length} — انتخاب‌شده:{" "}
                    {selectedIds.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(allIds)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:border-orange-300"
                  >
                    انتخاب همه
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:border-orange-300"
                  >
                    حذف انتخاب
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto mb-4">
                {(previewItems.length > 0 ? previewItems : allIds.map((id) => ({ id }))).map(
                  (item: any, idx: number) => {
                    const id = Number(item.id || item.product_id || item.dkp || allIds[idx]);
                    if (Number.isNaN(id)) return null;
                    const title = item.title || item.name || `محصول ${id}`;
                    const checked = selectedIds.includes(id);
                    return (
                      <label
                        key={`${id}-${idx}`}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                          checked
                            ? "border-orange-300 bg-orange-50"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(id)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
                          <p className="text-xs text-slate-500" dir="ltr">
                            dkp-{id}
                          </p>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>

              {jobId && (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                  در حال ایمپورت async...
                  {jobProgress != null && (
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, jobProgress))}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={isImporting || selectedIds.length === 0}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ایمپورت...
                  </>
                ) : (
                  `ایمپورت ${selectedIds.length} محصول`
                )}
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
