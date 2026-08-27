"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  DIGIKALA_IMPORT_JOB_STORAGE_KEY,
  ImportJobStatusBar,
  type ImportJobSummary,
} from "@/components/dashboard/import-job-status-bar";
import { DigikalaPriceMarkupSettings } from "@/components/dashboard/digikala-price-markup-settings";
import { digikalaApi, clampDigikalaMarkup } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Store,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_POLL_MS = 2500;
const PREVIEW_TIMEOUT_MS = 3 * 60 * 1000; // ۳ دقیقه

function formatToman(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("fa-IR") + " ت";
}

function unwrapJob(response: any) {
  return response?.job ?? response?.data?.job ?? response;
}

function normalizeIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));
}

function getItemId(item: any): number | null {
  const id = Number(
    item?.digikala_product_id ?? item?.id ?? item?.product_id ?? item?.dkp
  );
  return Number.isNaN(id) ? null : id;
}

export default function DigikalaSellerImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewLoadingMessage, setPreviewLoadingMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [infoBanner, setInfoBanner] = useState("");

  const [sellerMeta, setSellerMeta] = useState<{
    seller_code?: string;
    seller_url?: string;
    booth_total?: number;
    effective_limit?: number;
    requested_limit?: number;
    preview_request_capped?: boolean;
  } | null>(null);

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [showImportBar, setShowImportBar] = useState(false);
  const [importTerminal, setImportTerminal] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(0);
  const [appliedMarkup, setAppliedMarkup] = useState<number | null>(null);
  const appliedMarkupRef = useRef<number | null>(null);
  const previewPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewStartedAt = useRef<number>(0);

  const clearPreviewPoll = () => {
    if (previewPollRef.current) {
      clearTimeout(previewPollRef.current);
      previewPollRef.current = null;
    }
  };

  const persistImportJob = (jobId: string) => {
    try {
      localStorage.setItem(DIGIKALA_IMPORT_JOB_STORAGE_KEY, jobId);
    } catch {
      /* ignore */
    }
  };

  const clearPersistedImportJob = () => {
    try {
      localStorage.removeItem(DIGIKALA_IMPORT_JOB_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const openImportJobBar = (jobId: string) => {
    setImportJobId(jobId);
    setImportTerminal(false);
    setShowImportBar(true);
    persistImportJob(jobId);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DIGIKALA_IMPORT_JOB_STORAGE_KEY);
      if (saved) {
        setImportJobId(saved);
        setShowImportBar(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPreviewPoll();
    };
  }, []);

  const applyCompletedPreview = useCallback((results: any, meta?: any) => {
    const rows = Array.isArray(results?.preview) ? results.preview : [];
    const ids = normalizeIds(results?.product_ids);
    const fetched = Number(results?.fetched_count ?? ids.length);
    const previewCnt = Number(results?.preview_count ?? rows.length);
    const effective =
      Number(results?.effective_limit ?? meta?.effective_limit ?? 10000) || 10000;

    setPreviewRows(rows);
    setProductIds(ids);
    setSelectedIds(ids);
    setFetchedCount(fetched);
    setPreviewCount(previewCnt);

    const nearCap = fetched >= effective * 0.95;
    const readyMsg = nearCap
      ? `${effective.toLocaleString("fa-IR")} کالا آماده شد.`
      : `${fetched.toLocaleString("fa-IR")} کالا آماده شد.`;

    const displayNote =
      previewCnt < fetched
        ? ` نمایش ${previewCnt.toLocaleString("fa-IR")} کالا در لیست — برای ایمپورت از همهٔ idهای آماده‌شده استفاده می‌شود.`
        : "";

    setSuccess(readyMsg + displayNote);

    if (results?.summary || results?.message) {
      setInfoBanner(String(results.summary || results.message));
    }

    setSellerMeta((prev) => ({
      ...prev,
      seller_code: results?.seller_code || prev?.seller_code || meta?.seller_code,
      seller_url: results?.seller_url || prev?.seller_url || meta?.seller_url,
      booth_total: results?.booth_total ?? prev?.booth_total ?? meta?.booth_total,
      effective_limit: effective,
      requested_limit: results?.requested_limit ?? prev?.requested_limit ?? meta?.requested_limit,
      preview_request_capped:
        results?.preview_request_capped ??
        prev?.preview_request_capped ??
        meta?.preview_request_capped,
    }));
  }, []);

  const pollPreviewJob = useCallback(
    async (jobId: string, meta: any) => {
      clearPreviewPoll();

      const tick = async () => {
        if (Date.now() - previewStartedAt.current > PREVIEW_TIMEOUT_MS) {
          setIsPreviewing(false);
          setPreviewLoadingMessage("");
          setError("آماده‌سازی لیست طولانی شد. دوباره تلاش کنید.");
          return;
        }

        try {
          const response: any = await digikalaApi.getJobStatus(jobId);
          const job = unwrapJob(response);
          const status = String(job?.status || "").toLowerCase();

          if (status === "pending") {
            setPreviewLoadingMessage("در صف آماده‌سازی لیست غرفه…");
          } else if (status === "processing") {
            setPreviewLoadingMessage("در حال دریافت محصولات از دیجی‌کالا…");
          }

          if (status === "completed" || status === "success") {
            setIsPreviewing(false);
            setPreviewLoadingMessage("");
            applyCompletedPreview(job?.results || {}, meta);
            return;
          }

          if (status === "failed" || status === "error") {
            setIsPreviewing(false);
            setPreviewLoadingMessage("");
            setError(String(job?.error || job?.message || "آماده‌سازی لیست ناموفق بود"));
            return;
          }

          previewPollRef.current = setTimeout(tick, PREVIEW_POLL_MS);
        } catch (err: any) {
          setIsPreviewing(false);
          setPreviewLoadingMessage("");
          setError(err.message || "خطا در پیگیری وضعیت آماده‌سازی");
        }
      };

      await tick();
    },
    [applyCompletedPreview]
  );

  const startPreview = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) {
      setError("لطفا لینک غرفه دیجی‌کالا را وارد کنید");
      return;
    }
    if (!url.includes("digikala.com") || !url.includes("/seller/")) {
      setError("لینک معتبر غرفه وارد کنید (مثلاً /seller/DCVJG/)");
      return;
    }

    clearPreviewPoll();
    setIsPreviewing(true);
    setPreviewLoadingMessage("در حال آماده‌سازی لیست غرفه…");
    setError("");
    setSuccess("");
    setInfoBanner("");
    setPreviewRows([]);
    setProductIds([]);
    setSelectedIds([]);
    setFetchedCount(null);
    setPreviewCount(null);
    setSellerMeta(null);
    previewStartedAt.current = Date.now();

    try {
      const response: any = await digikalaApi.previewSeller({
        url: url.trim(),
        preview_limit: 15000,
        only_marketable: true,
      });

      const data = response.data ?? response;
      if (data.success === false) {
        setIsPreviewing(false);
        setPreviewLoadingMessage("");
        setError(data.message || data.error || "خطا در پیش‌نمایش غرفه");
        return;
      }

      const meta = {
        seller_code: data.seller_code,
        seller_url: data.seller_url,
        booth_total: data.booth_total,
        effective_limit: data.effective_limit,
        requested_limit: data.requested_limit,
        preview_request_capped: data.preview_request_capped,
      };
      setSellerMeta(meta);

      if (data.preview_request_capped && data.effective_limit) {
        setInfoBanner(
          `درخواست شما به سقف ${Number(data.effective_limit).toLocaleString("fa-IR")} کالا محدود شد.`
        );
      }

      const mode = String(data.mode || "").toLowerCase();
      const jobId = data.job_id || data.jobId;

      // مسیر async استاندارد
      if (mode === "async" || jobId) {
        if (!jobId) {
          setIsPreviewing(false);
          setPreviewLoadingMessage("");
          setError("پاسخ سرور ناقص است؛ دوباره تلاش کنید.");
          return;
        }
        await pollPreviewJob(String(jobId), meta);
        return;
      }

      // سازگاری با پاسخ sync قدیمی (اگر هنوز برگردد)
      setIsPreviewing(false);
      setPreviewLoadingMessage("");
      if (Array.isArray(data.preview) || Array.isArray(data.product_ids)) {
        applyCompletedPreview(data, meta);
      } else {
        setError("فرمت پاسخ پیش‌نمایش پشتیبانی نمی‌شود");
      }
    } catch (err: any) {
      setIsPreviewing(false);
      setPreviewLoadingMessage("");
      setError(err.message || "خطا در پیش‌نمایش غرفه");
    }
  };

  const toggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImportJobDone = useCallback((summary?: ImportJobSummary) => {
    clearPersistedImportJob();
    setImportTerminal(true);
    if (summary?.message && summary.successful_imports == null && summary.products_imported == null) {
      setError(summary.message);
      setSuccess("");
      setShowImportBar(true);
      return;
    }
    const ok = summary?.successful_imports ?? summary?.products_imported;
    const fail = summary?.failed_imports ?? summary?.products_failed;
    if (ok != null || fail != null) {
      const markup = appliedMarkupRef.current;
      setSuccess(
        `ایمپورت تمام شد${
          ok != null ? ` — ${Number(ok).toLocaleString("fa-IR")} موفق` : ""
        }${
          fail != null && Number(fail) > 0
            ? `، ${Number(fail).toLocaleString("fa-IR")} ناموفق`
            : ""
        }${
          markup != null
            ? markup === 0
              ? " — بدون مارک‌آپ قیمت"
              : ` — مارک‌آپ ${markup.toLocaleString("fa-IR")}٪`
            : ""
        }`
      );
      setError("");
      setShowImportBar(true);
    }
  }, []);

  const dismissImportBar = useCallback(() => {
    setShowImportBar(false);
    if (importTerminal) {
      setImportJobId(null);
      setImportTerminal(false);
    }
  }, [importTerminal]);

  const markupSuffix = (percent?: number | null) => {
    if (percent == null || Number.isNaN(Number(percent))) return "";
    const n = Number(percent);
    if (n === 0) return " — بدون مارک‌آپ قیمت";
    return ` — مارک‌آپ ${n.toLocaleString("fa-IR")}٪`;
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setError("حداقل یک محصول را انتخاب کنید");
      return;
    }
    if (importJobId && !importTerminal) {
      setError("یک ایمپورت در حال اجراست؛ نتیجه را از نوار پایین ببینید.");
      setShowImportBar(true);
      return;
    }

    const percent = clampDigikalaMarkup(Number(markupPercent));

    try {
      setIsImporting(true);
      setError("");
      setSuccess("");
      setAppliedMarkup(null);
      appliedMarkupRef.current = null;

      const response: any = await digikalaApi.importSeller({
        url: url.trim(),
        product_ids: selectedIds,
        skip_existing: true,
        only_marketable: true,
        upload_media: true,
        limit: 10000,
        price_markup_percent: percent,
      });

      const data = response.data ?? response;

      if (data.success === false) {
        setError(data.message || data.error || "خطا در ایمپورت");
        setIsImporting(false);
        return;
      }

      const responseMarkup = clampDigikalaMarkup(
        Number(
          data.price_markup_percent ??
            data.results?.price_markup_percent ??
            percent
        )
      );
      setAppliedMarkup(responseMarkup);
      appliedMarkupRef.current = responseMarkup;
      setMarkupPercent(responseMarkup);

      const returnedJobId = data.job_id || data.jobId;
      const mode = String(data.mode || "").toLowerCase();

      if (mode === "async" || returnedJobId) {
        if (!returnedJobId) {
          setError("پاسخ ایمپورت ناقص است");
          setIsImporting(false);
          return;
        }
        setIsImporting(false);
        setSuccess(
          `ایمپورت در پس‌زمینه شروع شد${markupSuffix(responseMarkup)}`
        );
        openImportJobBar(String(returnedJobId));
        return;
      }

      setSuccess(
        `ایمپورت انجام شد${
          data.imported != null || data.products_imported != null
            ? `: ${(data.imported ?? data.products_imported).toLocaleString("fa-IR")} محصول`
            : ""
        }${markupSuffix(responseMarkup)}`
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

  const hasCatalog = previewRows.length > 0 || productIds.length > 0;

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
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
                آماده‌سازی لیست غرفه، انتخاب محصولات و ایمپورت به باسلام
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => startPreview()}
                disabled={isPreviewing}
                className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-100 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تلاش مجدد
              </button>
            </div>
          )}

          {infoBanner && !error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              {infoBanner}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 space-y-1">
                <p>{success}</p>
                {appliedMarkup != null && appliedMarkup !== 0 && (
                  <p className="text-xs text-green-700">
                    قیمت باسلام = قیمت دیجی × (۱ + {appliedMarkup.toLocaleString("fa-IR")}٪)
                  </p>
                )}
                {!isImporting && !(importJobId && !importTerminal) && hasCatalog && (
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

          <div className="mb-4">
            <DigikalaPriceMarkupSettings
              value={markupPercent}
              onChange={setMarkupPercent}
              disabled={isPreviewing || isImporting}
            />
          </div>

          <form
            onSubmit={startPreview}
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
                  disabled={isPreviewing || isImporting}
                  className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 disabled:bg-slate-50"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPreviewing || isImporting}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {previewLoadingMessage || "در حال آماده‌سازی…"}
                </>
              ) : (
                "پیش‌نمایش کاتالوگ"
              )}
            </button>
          </form>

          {isPreviewing && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
              <p className="font-medium text-slate-800">
                {previewLoadingMessage || "در حال آماده‌سازی لیست غرفه…"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                این کار ممکن است کمی طول بکشد؛ لطفاً صفحه را نبندید.
              </p>
              {sellerMeta?.booth_total != null && (
                <p className="text-xs text-slate-400 mt-3">
                  کل غرفه روی دیجی‌کالا:{" "}
                  {Number(sellerMeta.booth_total).toLocaleString("fa-IR")} کالا
                  {sellerMeta.effective_limit != null &&
                    ` — سقف آماده‌سازی: ${Number(sellerMeta.effective_limit).toLocaleString("fa-IR")}`}
                </p>
              )}
            </div>
          )}

          {!isPreviewing && hasCatalog && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-slate-800">
                    {sellerMeta?.seller_code || sellerMeta?.seller_url || "کاتالوگ فروشنده"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    آماده‌شده: {(fetchedCount ?? productIds.length).toLocaleString("fa-IR")}
                    {previewCount != null &&
                      ` — نمایش: ${previewCount.toLocaleString("fa-IR")}`}
                    {sellerMeta?.booth_total != null &&
                      ` — کل غرفه: ${Number(sellerMeta.booth_total).toLocaleString("fa-IR")}`}
                    {" — "}انتخاب‌شده: {selectedIds.length.toLocaleString("fa-IR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(productIds)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:border-orange-300"
                  >
                    انتخاب همه آماده‌شده‌ها
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

              <div className="space-y-2 max-h-[480px] overflow-y-auto mb-4">
                {previewRows.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 text-center">
                    ردیف نمایشی موجود نیست، اما{" "}
                    {productIds.length.toLocaleString("fa-IR")} شناسه برای ایمپورت آماده است.
                  </p>
                ) : (
                  previewRows.map((item, idx) => {
                    const id = getItemId(item);
                    if (id == null) return null;
                    const title = item.title || item.name || `محصول ${id}`;
                    const image = item.image_url || item.image;
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
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {title}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                            <span dir="ltr">dkp-{id}</span>
                            {item.price_toman != null && (
                              <span>{formatToman(item.price_toman)}</span>
                            )}
                            {item.stock != null && (
                              <span>موجودی: {Number(item.stock).toLocaleString("fa-IR")}</span>
                            )}
                            {item.status && <span>{item.status}</span>}
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(ev) => ev.stopPropagation()}
                            className="text-xs text-orange-600 hover:underline"
                          >
                            دیجی‌کالا
                          </a>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {importJobId && !importTerminal && (
                <p className="mb-4 text-sm text-slate-500 flex flex-wrap items-center gap-2">
                  <span>
                    ایمپورت در پس‌زمینه در حال اجراست — می‌توانید صفحه را ترک کنید.
                  </span>
                  {!showImportBar && (
                    <button
                      type="button"
                      onClick={() => setShowImportBar(true)}
                      className="text-orange-600 underline font-medium"
                    >
                      نمایش پیشرفت
                    </button>
                  )}
                </p>
              )}

              <button
                onClick={handleImport}
                disabled={
                  isImporting ||
                  selectedIds.length === 0 ||
                  Boolean(importJobId && !importTerminal)
                }
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ارسال درخواست…
                  </>
                ) : importJobId && !importTerminal ? (
                  "ایمپورت در حال اجرا…"
                ) : (
                  `ایمپورت ${selectedIds.length.toLocaleString("fa-IR")} محصول`
                )}
              </button>
            </div>
          )}
        </motion.div>

        {importJobId && (
          <ImportJobStatusBar
            jobId={importJobId}
            onDone={handleImportJobDone}
            onDismiss={dismissImportBar}
            className={showImportBar ? undefined : "hidden"}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
