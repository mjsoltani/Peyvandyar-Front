"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { mixinApi, MixinProduct } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Package,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

function isNoConnectionError(message: string) {
  return /No active Mixin connection/i.test(message);
}

function extractProducts(response: any): MixinProduct[] {
  const data = response?.data ?? response;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function productImage(product: MixinProduct): string | null {
  if (typeof product.image === "string") return product.image;
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      return String((first as { url: string }).url);
    }
  }
  return null;
}

function formatToman(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("fa-IR") + " ت";
}

export default function MixinCatalogPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [products, setProducts] = useState<MixinProduct[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [shopUrl, setShopUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const [importing, setImporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await mixinApi.getProducts({
        page,
        page_size: 25,
        search: search || undefined,
      });
      const data = response.data ?? response;
      if (data.success === false) {
        throw new Error(data.error || data.message || "خطا در دریافت محصولات");
      }
      setProducts(extractProducts(response));
      setHasNext(Boolean(data.pagination?.has_next));
      setShopUrl(data.shop_url || "");
    } catch (err: any) {
      const msg = err.message || "خطا در دریافت کاتالوگ Mixin";
      if (isNoConnectionError(msg) || err.statusCode === 400) {
        setError("ابتدا فروشگاه Mixin را متصل کنید");
        setTimeout(() => {
          router.push("/dashboard/copy-product/mixin/connection");
        }, 1200);
      } else {
        setError(msg);
      }
      setProducts([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const response: any = await mixinApi.getJobStatus(jobId);
        if (cancelled) return;
        const job = response.job ?? response.data?.job ?? response;
        const status = String(job.status || "").toLowerCase();
        setJobStatus(status);
        setJobProgress(
          job.progress != null
            ? String(job.progress)
            : job.current_product
              ? `محصول فعلی: ${job.current_product}`
              : null
        );

        if (status === "completed" || status === "success") {
          const results = job.results || {};
          setSuccess(
            `ایمپورت تمام شد: ${results.products_imported ?? 0} موفق، ${results.products_failed ?? 0} ناموفق`
          );
          setImporting(false);
          setJobId(null);
          return;
        }
        if (status === "failed" || status === "error") {
          setError(String(job.error || "ایمپورت ناموفق بود"));
          setImporting(false);
          setJobId(null);
          return;
        }
        setTimeout(poll, 2500);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "خطا در پیگیری وضعیت ایمپورت");
          setImporting(false);
          setJobId(null);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const toggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handlePreview = async (productId: number) => {
    try {
      setPreviewingId(productId);
      setError("");
      setSuccess("");
      setPreview(null);
      const response: any = await mixinApi.previewProduct({
        product_id: productId,
        upload_media: false,
      });
      const data = response.data ?? response;
      if (data.success === false) {
        setError(data.error || data.message || "خطا در پیش‌نمایش");
        return;
      }
      setPreview(data);
    } catch (err: any) {
      if (isNoConnectionError(err.message || "")) {
        router.push("/dashboard/copy-product/mixin/connection");
        return;
      }
      setError(err.message || "خطا در پیش‌نمایش");
    } finally {
      setPreviewingId(null);
    }
  };

  const handlePublish = async () => {
    const productId = Number(
      preview?.source?.product_id ?? preview?.basalam_payload?.id
    );
    if (!productId) {
      setError("شناسه محصول برای انتشار مشخص نیست");
      return;
    }

    try {
      setPublishingId(productId);
      setError("");
      setSuccess("");
      const response: any = await mixinApi.publishProduct({
        product_id: productId,
        upload_media: true,
      });
      const data = response.data ?? response;
      if (data.success === false) {
        setError(data.error || data.message || "خطا در انتشار");
        return;
      }
      const basalamId = data.product_id || data.product?.id;
      setSuccess(
        basalamId
          ? `محصول در باسلام منتشر شد (شناسه: ${basalamId})`
          : "محصول با موفقیت منتشر شد"
      );
      setPreview(null);
    } catch (err: any) {
      setError(err.message || "خطا در انتشار محصول");
    } finally {
      setPublishingId(null);
    }
  };

  const handleImportSelected = async () => {
    if (selectedIds.length === 0) {
      setError("حداقل یک محصول را انتخاب کنید");
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");
      setJobId(null);
      setJobStatus(null);
      setJobProgress(null);

      const response: any = await mixinApi.importCatalog({
        product_ids: selectedIds,
        skip_existing: true,
        upload_media: true,
      });
      const data = response.data ?? response;
      const mode = data.mode;

      if (data.success === false) {
        setError(data.error || data.message || "خطا در ایمپورت");
        setImporting(false);
        return;
      }

      if (mode === "import" && (data.products_imported === 0 || data.products_requested === 0)) {
        setSuccess(data.message || "چیزی برای ایمپورت نبود");
        setImporting(false);
        return;
      }

      if (mode === "import_queued" || data.job_id || data.jobId) {
        const id = String(data.job_id || data.jobId);
        setJobId(id);
        setSuccess(data.message || "ایمپورت در صف قرار گرفت");
        return;
      }

      // sync / sync_fallback
      setSuccess(
        `ایمپورت انجام شد: ${data.products_imported ?? 0} موفق، ${data.products_failed ?? 0} ناموفق`
      );
      setImporting(false);
    } catch (err: any) {
      if (isNoConnectionError(err.message || "")) {
        router.push("/dashboard/copy-product/mixin/connection");
      } else {
        setError(err.message || "خطا در ایمپورت");
      }
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <button
            onClick={() => router.push("/dashboard/copy-product/mixin")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">کاتالوگ Mixin</h1>
                <p className="text-sm text-slate-500" dir="ltr">
                  {shopUrl || "محصولات فروشگاه متصل"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/copy-product/mixin/connection")}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:border-orange-300"
            >
              مدیریت اتصال
            </button>
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
                    وضعیت جاب: {jobStatus}
                    {jobProgress ? ` — ${jobProgress}` : ""}
                  </p>
                )}
                {!jobId && (
                  <button
                    onClick={() => router.push("/dashboard/copy-product/mixin/links")}
                    className="underline font-medium"
                  >
                    مشاهده لینک‌ها
                  </button>
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSearch}
            className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در کاتالوگ Mixin"
                className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium"
            >
              جستجو
            </button>
          </form>

          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              انتخاب‌شده: {selectedIds.length}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(products.map((p) => p.id))}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200"
              >
                انتخاب صفحه
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200"
              >
                حذف انتخاب
              </button>
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={importing || selectedIds.length === 0}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال ایمپورت...
                  </>
                ) : (
                  `ایمپورت ${selectedIds.length || ""} محصول`
                )}
              </button>
            </div>
          </div>

          {jobId && (
            <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
              ایمپورت در صف/پردازش...
              {jobProgress && <span className="mr-2">({jobProgress})</span>}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال بارگذاری...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                محصولی یافت نشد.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {products.map((product) => {
                  const img = productImage(product);
                  const checked = selectedIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "p-4 flex flex-wrap gap-4 items-center",
                        checked && "bg-orange-50/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId(product.id)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={product.name || ""}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100" />
                      )}
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-medium text-slate-800">{product.name || `محصول ${product.id}`}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                          <span>{formatToman(product.price)}</span>
                          <span>موجودی: {product.stock ?? "—"}</span>
                          {product.has_variants && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              واریانت
                            </span>
                          )}
                          {product.available === false && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                              ناموجود
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreview(product.id)}
                        disabled={previewingId === product.id || importing}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:border-orange-300 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {previewingId === product.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : null}
                        پیش‌نمایش
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40"
            >
              صفحه قبل
            </button>
            <span className="text-sm text-slate-500">صفحه {page}</span>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40"
            >
              صفحه بعد
            </button>
          </div>

          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-xl border border-slate-200 p-6"
            >
              <h2 className="font-bold text-slate-800 mb-3">پیش‌نمایش</h2>
              <p className="text-slate-800 font-medium mb-1">
                {preview.source?.name || preview.basalam_payload?.name || "محصول"}
              </p>
              <p className="text-sm text-slate-500 mb-3">
                قیمت: {formatToman(preview.pricing?.mixin_price_toman)} — موجودی:{" "}
                {preview.source?.stock ?? preview.basalam_payload?.stock ?? "—"}
              </p>
              <pre
                className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 overflow-auto max-h-48 mb-4"
                dir="ltr"
              >
                {JSON.stringify(preview, null, 2)}
              </pre>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishingId != null}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl inline-flex items-center justify-center gap-2"
              >
                {publishingId != null ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال انتشار...
                  </>
                ) : (
                  "تأیید و انتشار در باسلام"
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
