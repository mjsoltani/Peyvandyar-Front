"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function DigikalaProductImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [stock, setStock] = useState("1");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<any>(null);

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

  const previewTitle =
    preview?.title ||
    preview?.name ||
    preview?.mapped?.title ||
    preview?.product?.title ||
    "پیش‌نمایش محصول";

  const previewImage =
    preview?.image ||
    preview?.photo ||
    preview?.images?.[0] ||
    preview?.mapped?.image;

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
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
              className="mt-6 bg-white rounded-xl border border-slate-200 p-6"
            >
              <h2 className="font-bold text-slate-800 mb-4">پیش‌نمایش</h2>
              <div className="flex gap-4 items-start">
                {previewImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={typeof previewImage === "string" ? previewImage : previewImage.url}
                    alt={previewTitle}
                    className="w-24 h-24 object-cover rounded-lg border border-slate-100"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 mb-2">{previewTitle}</p>
                  <pre className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 overflow-auto max-h-48" dir="ltr">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
              </div>

              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
            </motion.div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
