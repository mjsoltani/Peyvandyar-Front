"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { productsApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Link as LinkIcon,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * استخراج product_id از URL های مختلف باسلام
 * مثال‌ها:
 * - https://basalam.com/helmet/product/11347802
 * - https://basalam.com/p/22303639?utm_source=share
 * - https://basalam.com/product/12345
 */
function extractProductId(url: string): string | null {
  try {
    // حذف فضاهای خالی
    url = url.trim();
    
    // الگوهای مختلف URL باسلام
    const patterns = [
      /basalam\.com\/p\/(\d+)/,                    // /p/22303639
      /basalam\.com\/[^/]+\/product\/(\d+)/,       // /helmet/product/11347802
      /basalam\.com\/product\/(\d+)/,              // /product/12345
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting product ID:", error);
    return null;
  }
}

export default function BasalamCopyPage() {
  const router = useRouter();
  const [productUrl, setProductUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [extractedProductId, setExtractedProductId] = useState<string | null>(null);

  // مرحله 1: دریافت اطلاعات محصول
  const handleFetchProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productUrl.trim()) {
      setError("لطفا لینک محصول را وارد کنید");
      return;
    }

    // بررسی فرمت URL
    if (!productUrl.includes("basalam.com")) {
      setError("لینک وارد شده معتبر نیست. لطفا لینک باسلام را وارد کنید");
      return;
    }

    // استخراج product_id از URL
    const productId = extractProductId(productUrl);
    
    if (!productId) {
      setError("شناسه محصول در لینک یافت نشد. لطفا لینک معتبر وارد کنید");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setProductData(null);
      setSuccess(false);

      // دریافت اطلاعات محصول از API
      const response = await productsApi.getProductFromBasalam(productId);
      
      if (response.success && response.data) {
        setProductData(response.data);
        setExtractedProductId(productId);
      } else {
        setError(response.message || "محصول یافت نشد");
      }
    } catch (err: any) {
      console.error("Error fetching product:", err);
      setError(err.message || "خطا در دریافت اطلاعات محصول");
    } finally {
      setIsLoading(false);
    }
  };

  // مرحله 2: کپی محصول بعد از تایید
  const handleConfirmCopy = async () => {
    if (!extractedProductId) return;

    try {
      setIsCopying(true);
      setError("");

      // کپی محصول
      const response = await productsApi.copyProductFromBasalam(extractedProductId);
      
      if (response.success) {
        setSuccess(true);
        setProductUrl("");
        setProductData(null);
        setExtractedProductId(null);
        
        // پاک کردن پیغام موفقیت بعد از 5 ثانیه
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.message || "خطا در کپی محصول");
      }
    } catch (err: any) {
      console.error("Error copying product:", err);
      setError(err.message || "خطا در کپی محصول");
    } finally {
      setIsCopying(false);
    }
  };

  // لغو و بازگشت به فرم
  const handleCancel = () => {
    setProductData(null);
    setExtractedProductId(null);
    setError("");
  };

  const formatPrice = (price: number) => {
    // تبدیل از ریال به تومان
    const priceInToman = Math.floor(price / 10);
    return new Intl.NumberFormat("fa-IR").format(priceInToman);
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            بازگشت
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                کپی از باسلام
              </h1>
              <p className="text-slate-500">
                لینک محصول باسلام را وارد کنید
              </p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-green-800 font-medium">
                    محصول با موفقیت کپی شد!
                  </p>
                  <p className="text-green-600 text-sm">
                    محصول به فروشگاه شما اضافه شد
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-800">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Form - مرحله 1: دریافت اطلاعات */}
          {!productData && (
            <form onSubmit={handleFetchProduct} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700 mb-2 block">
                  لینک محصول باسلام
                </span>
                <div className="relative">
                  <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={productUrl}
                    onChange={(e) => {
                      setProductUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://basalam.com/product/..."
                    className="w-full pr-11 pl-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading || !productUrl.trim()}
                className={cn(
                  "w-full px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                  isLoading || !productUrl.trim()
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-l from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال دریافت اطلاعات...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    دریافت اطلاعات محصول
                  </>
                )}
              </button>
            </form>
          )}

          {/* Product Preview - مرحله 2: نمایش و تایید */}
          {productData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6"
            >
              {/* Header */}
              <div className="bg-gradient-to-l from-orange-500 to-orange-600 p-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  پیش‌نمایش محصول
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Images Gallery */}
                {(productData.photo || (productData.photos && productData.photos.length > 0)) && (
                  <div>
                    <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-500" />
                      تصاویر محصول
                      {productData.photos && ` (${(productData.photos.length || 0) + 1} تصویر)`}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Main Image */}
                      {productData.photo && (
                        <div className="relative group">
                          <img
                            src={productData.photo.md || productData.photo.sm || productData.photo.original}
                            alt={productData.title}
                            className="w-full aspect-square object-cover rounded-xl border-2 border-orange-300 shadow-md"
                          />
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            اصلی
                          </div>
                        </div>
                      )}
                      
                      {/* Additional Photos */}
                      {productData.photos && productData.photos.map((photo: any, idx: number) => (
                        <div key={photo.id || idx} className="relative group">
                          <img
                            src={photo.md || photo.sm || photo.original}
                            alt={`${productData.title} - تصویر ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-xl border-2 border-slate-200 hover:border-orange-300 transition-colors shadow-md"
                          />
                          <div className="absolute top-2 right-2 bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-500 font-medium">عنوان:</span>
                    <span className="text-slate-800 font-medium text-right max-w-md">
                      {productData.title || "بدون عنوان"}
                    </span>
                  </div>

                  {productData.primary_price !== undefined && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">قیمت پایه:</span>
                      <span className="text-orange-600 font-bold text-lg">
                        {formatPrice(productData.primary_price)} تومان
                      </span>
                    </div>
                  )}

                  {productData.price !== undefined && productData.price !== productData.primary_price && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">قیمت فروش:</span>
                      <span className="text-green-600 font-bold text-lg">
                        {formatPrice(productData.price)} تومان
                      </span>
                    </div>
                  )}

                  {productData.inventory !== undefined && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">موجودی:</span>
                      <span className={cn(
                        "font-medium",
                        productData.inventory > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {new Intl.NumberFormat("fa-IR").format(productData.inventory)}
                        {productData.unit_type?.name && ` ${productData.unit_type.name}`}
                      </span>
                    </div>
                  )}

                  {productData.unit_quantity && productData.unit_type?.name && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">مقدار:</span>
                      <span className="text-slate-800 font-medium">
                        {new Intl.NumberFormat("fa-IR").format(productData.unit_quantity)} {productData.unit_type.name}
                      </span>
                    </div>
                  )}

                  {productData.status?.name && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">وضعیت:</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        productData.status.name === "در دسترس"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      )}>
                        {productData.status.name}
                      </span>
                    </div>
                  )}

                  {productData.category?.title && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">دسته‌بندی:</span>
                      <span className="text-slate-800 font-medium text-right max-w-md">
                        {productData.category.title}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">شناسه محصول:</span>
                    <span className="text-slate-800 font-mono font-bold">
                      {extractedProductId}
                    </span>
                  </div>
                </div>

                {/* Variants Section */}
                {productData.variants && productData.variants.length > 0 && (
                  <div className="pt-4 border-t-2 border-slate-200">
                    <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-500" />
                      تنوع‌های محصول ({productData.variants.length} مورد)
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {productData.variants.map((variant: any, idx: number) => (
                        <motion.div
                          key={variant.id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gradient-to-l from-slate-50 to-white rounded-lg p-4 border border-slate-200 hover:border-orange-300 transition-colors"
                        >
                          {/* Variant Properties */}
                          {variant.properties && variant.properties.length > 0 && (
                            <div className="mb-3 pb-3 border-b border-slate-200">
                              <div className="flex flex-wrap gap-2">
                                {variant.properties.map((prop: any, propIdx: number) => (
                                  <span
                                    key={propIdx}
                                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                                  >
                                    {prop.value?.title || prop.value?.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Variant Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {variant.primary_price !== undefined && (
                              <div>
                                <span className="text-slate-500">قیمت پایه:</span>
                                <span className="text-slate-800 font-bold mr-2">
                                  {formatPrice(variant.primary_price)}
                                </span>
                              </div>
                            )}
                            {variant.price !== undefined && variant.price !== variant.primary_price && (
                              <div>
                                <span className="text-slate-500">قیمت فروش:</span>
                                <span className="text-green-600 font-bold mr-2">
                                  {formatPrice(variant.price)}
                                </span>
                              </div>
                            )}
                            {variant.stock !== undefined && (
                              <div>
                                <span className="text-slate-500">موجودی:</span>
                                <span className={cn(
                                  "font-medium mr-2",
                                  variant.stock > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {new Intl.NumberFormat("fa-IR").format(variant.stock)}
                                </span>
                              </div>
                            )}
                            {variant.sku && (
                              <div>
                                <span className="text-slate-500">SKU:</span>
                                <span className="text-slate-800 font-medium mr-2">
                                  {variant.sku}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-2 text-base">خلاصه کپی محصول:</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          محصول: <span className="font-medium">{productData.title}</span>
                        </li>
                        {productData.variants && productData.variants.length > 0 && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            تعداد تنوع: <span className="font-medium">{productData.variants.length} مورد</span>
                          </li>
                        )}
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          این محصول با تمام تنوع‌ها به فروشگاه شما کپی خواهد شد
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
                  <button
                    onClick={handleCancel}
                    disabled={isCopying}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    لغو
                  </button>
                  <button
                    onClick={handleConfirmCopy}
                    disabled={isCopying}
                    className="flex-1 px-6 py-3 bg-gradient-to-l from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold shadow-lg"
                  >
                    {isCopying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        در حال کپی...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        تایید و کپی محصول
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          {!productData && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">نحوه استفاده:</p>
                  <ol className="list-decimal list-inside space-y-1 mr-2">
                    <li>به سایت باسلام بروید</li>
                    <li>محصول مورد نظر را پیدا کنید</li>
                    <li>لینک محصول را کپی کنید</li>
                    <li>لینک را در کادر بالا وارد کنید</li>
                    <li>اطلاعات محصول را بررسی کنید</li>
                    <li>روی "تایید و کپی محصول" کلیک کنید</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Examples */}
          {!productData && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-600 mb-3 font-medium">مثال‌های لینک معتبر:</p>
              <div className="space-y-2">
                <code className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 block" dir="ltr">
                  https://basalam.com/helmet/product/11347802
                </code>
                <code className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 block" dir="ltr">
                  https://basalam.com/p/22303639?utm_source=share
                </code>
                <code className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 block" dir="ltr">
                  https://basalam.com/product/12345
                </code>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
