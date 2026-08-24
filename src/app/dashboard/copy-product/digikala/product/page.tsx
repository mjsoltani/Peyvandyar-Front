"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { digikalaApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Package,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Link as LinkIcon,
  Tag,
  Star,
  Store,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatToman(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("fa-IR") + " تومان";
}

function getPreviewImages(preview: any): string[] {
  const uploaded = preview?.media?.uploaded_photos;
  if (Array.isArray(uploaded) && uploaded.length > 0) {
    return uploaded
      .map((p: any) => p?.urls?.primary || p?.source_url)
      .filter(Boolean);
  }
  const urls = preview?.source?.image_urls;
  if (Array.isArray(urls)) return urls.filter(Boolean);
  return [];
}

export default function DigikalaProductImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [stock, setStock] = useState("1");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("لطفا لینک محصول دیجی‌کالا را وارد کنید");
      return;
    }
    if (!url.includes("digikala.com") && !/dkp-\d+/i.test(url)) {
      setError("لینک معتبر دیجی‌کالا وارد کنید (مثلاً /product/dkp-...)");
      return;
    }

    try {
      setIsPreviewing(true);
      setError("");
      setSuccess("");
      setPreview(null);
      setActiveImage(0);
      setShowFullDescription(false);

      const response = await digikalaApi.previewProduct({
        url: url.trim(),
        stock: Number(stock) || 1,
        upload_media: true,
      });

      if ((response as any).success === false) {
        setError((response as any).message || (response as any).error || "خطا در پیش‌نمایش");
        return;
      }

      setPreview(response.data ?? response);
    } catch (err: any) {
      setError(err.message || "خطا در پیش‌نمایش محصول");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setError("");
      setSuccess("");

      const response = await digikalaApi.publishProduct({
        url: url.trim(),
        stock: Number(stock) || 1,
        upload_media: true,
      });

      if ((response as any).success === false) {
        setError((response as any).message || (response as any).error || "خطا در انتشار محصول");
        return;
      }

      const productId =
        (response as any).product_id ||
        (response as any).data?.product_id ||
        (response as any).data?.id;

      setSuccess(
        productId
          ? `محصول با موفقیت در غرفه ساخته شد (شناسه: ${productId})`
          : "محصول با موفقیت در غرفه ساخته و لینک ذخیره شد"
      );
      setPreview(null);
      setUrl("");
    } catch (err: any) {
      setError(err.message || "خطا در انتشار محصول");
    } finally {
      setIsPublishing(false);
    }
  };

  const images = useMemo(() => (preview ? getPreviewImages(preview) : []), [preview]);
  const title =
    preview?.basalam_payload?.name ||
    preview?.source?.title_fa ||
    "پیش‌نمایش محصول";
  const brand = preview?.source?.brand?.title_fa;
  const categoryTitle =
    preview?.category_mapping?.title || preview?.source?.category?.title_fa;
  const categoryPath = preview?.category_mapping?.path;
  const pricing = preview?.pricing;
  const colors = preview?.source?.colors || [];
  const variants = preview?.basalam_payload?.variants || [];
  const selectedVariant = preview?.selected_variant;
  const rating = preview?.source?.rating;
  const brief = preview?.basalam_payload?.brief;
  const description = preview?.basalam_payload?.description;
  const notes = Array.isArray(preview?.notes) ? preview.notes : [];

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
              <Package className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ایمپورت تک‌محصول</h1>
              <p className="text-sm text-slate-500">
                پیش‌نمایش و انتشار محصول دیجی‌کالا در غرفه باسلام
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
              <div className="text-sm text-green-800">
                <p>{success}</p>
                <button
                  onClick={() => router.push("/dashboard/copy-product/digikala/links")}
                  className="mt-2 text-green-700 underline font-medium"
                >
                  مشاهده لیست محصولات دیجی‌کالا
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handlePreview}
            className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                لینک محصول دیجی‌کالا
              </label>
              <div className="relative">
                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.digikala.com/product/dkp-8500838/"
                  className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                موجودی اولیه
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={isPreviewing}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال پیش‌نمایش...
                </>
              ) : (
                "پیش‌نمایش"
              )}
            </button>
          </form>

          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-800">پیش‌نمایش محصول</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  هنوز منتشر نشده
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
                {/* Gallery */}
                <div>
                  <div className="aspect-square rounded-xl border border-slate-100 bg-slate-50 overflow-hidden mb-3">
                    {images[activeImage] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={images[activeImage]}
                        alt={title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.slice(0, 8).map((img, idx) => (
                        <button
                          key={img + idx}
                          type="button"
                          onClick={() => setActiveImage(idx)}
                          className={cn(
                            "w-14 h-14 rounded-lg border overflow-hidden flex-shrink-0",
                            activeImage === idx
                              ? "border-orange-400 ring-2 ring-orange-200"
                              : "border-slate-200"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4 min-w-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-relaxed">
                      {title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {brand && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50">
                          <Tag className="w-3.5 h-3.5" />
                          {brand}
                        </span>
                      )}
                      {preview?.source?.product_id && (
                        <span className="px-2 py-1 rounded-lg bg-slate-50" dir="ltr">
                          dkp-{preview.source.product_id}
                        </span>
                      )}
                      {rating?.rate != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {(Number(rating.rate) / 20).toFixed(1)}
                          {rating.count != null && (
                            <span className="text-amber-600/80">
                              ({Number(rating.count).toLocaleString("fa-IR")} نظر)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="rounded-xl bg-orange-50/70 border border-orange-100 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">قیمت در باسلام</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatToman(pricing?.basalam_primary_price_toman)}
                        </p>
                      </div>
                      {pricing?.digikala_rrp_toman != null &&
                        pricing.digikala_rrp_toman !== pricing.basalam_primary_price_toman && (
                          <p className="text-sm text-slate-400 line-through pb-0.5">
                            {formatToman(pricing.digikala_rrp_toman)}
                          </p>
                        )}
                      {pricing?.discount_percent != null && pricing.discount_percent > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          {Number(pricing.discount_percent).toLocaleString("fa-IR")}٪ تخفیف
                        </span>
                      )}
                    </div>
                    {pricing?.digikala_selling_toman != null && (
                      <p className="text-xs text-slate-500 mt-2">
                        قیمت فروش دیجی‌کالا: {formatToman(pricing.digikala_selling_toman)}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  {(categoryTitle || categoryPath) && (
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-xs text-slate-500 mb-1">دسته‌بندی باسلام</p>
                      <p className="font-medium text-slate-800">{categoryTitle}</p>
                      {categoryPath && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {categoryPath}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Colors / variants */}
                  {colors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">رنگ‌ها</p>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color: any) => (
                          <span
                            key={color.id || color.title}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700"
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-slate-300"
                              style={{ backgroundColor: color.hex_code || "#ccc" }}
                            />
                            {color.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {variants.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        واریانت‌ها ({variants.length.toLocaleString("fa-IR")})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variants.slice(0, 8).map((variant: any, idx: number) => {
                          const label =
                            variant?.properties
                              ?.map((p: any) => p.value)
                              .filter(Boolean)
                              .join(" / ") || `واریانت ${idx + 1}`;
                          return (
                            <span
                              key={idx}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                            >
                              {label}
                            </span>
                          );
                        })}
                        {variants.length > 8 && (
                          <span className="px-2.5 py-1.5 text-xs text-slate-500">
                            +{(variants.length - 8).toLocaleString("fa-IR")} مورد دیگر
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected variant */}
                  {selectedVariant && (
                    <div className="rounded-xl border border-slate-100 p-3 text-sm text-slate-600 space-y-1">
                      <p className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-orange-500" />
                        وریانت انتخاب‌شده
                      </p>
                      {selectedVariant.color && <p>رنگ: {selectedVariant.color}</p>}
                      {selectedVariant.warranty && <p>گارانتی: {selectedVariant.warranty}</p>}
                      {selectedVariant.seller && <p>فروشنده: {selectedVariant.seller}</p>}
                    </div>
                  )}

                  {/* Brief / description */}
                  {(brief || description) && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">توضیحات</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {showFullDescription
                          ? description || brief
                          : (brief || description || "").slice(0, 220) +
                            ((brief || description || "").length > 220 ? "…" : "")}
                      </p>
                      {(description || brief || "").length > 220 && (
                        <button
                          type="button"
                          onClick={() => setShowFullDescription((v) => !v)}
                          className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          {showFullDescription ? "نمایش کمتر" : "نمایش بیشتر"}
                        </button>
                      )}
                    </div>
                  )}

                  {notes.length > 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        نکات
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-500 list-disc pr-4">
                        {notes.slice(0, 4).map((note: string, idx: number) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال انتشار...
                    </>
                  ) : (
                    "تأیید و انتشار در غرفه"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
