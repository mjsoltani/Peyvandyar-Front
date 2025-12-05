"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { productsApi } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  CheckSquare,
  Square,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
  category: string;
  status: "active" | "inactive";
}

interface BulkEditForm {
  price?: number;
  priceType?: "fixed" | "percent"; // نوع تغییر قیمت
  stock?: number;
  status?: "active" | "inactive";
  category?: string;
}

export default function BulkEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const itemsPerPage = 100; // 100 محصول در هر صفحه

  // فرم ویرایش انبوه
  const [bulkForm, setBulkForm] = useState<BulkEditForm>({
    price: undefined,
    priceType: "fixed",
    stock: undefined,
    status: undefined,
    category: undefined,
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage("");

      const response = await productsApi.getProducts({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchQuery || undefined,
      });

      if (response.success && response.data) {
        // طبق API-ENDPOINTS.json ساختار response این است:
        // response.data.data (آرایه محصولات)
        // response.pagination.total (تعداد کل)
        const productsData = response.data?.data || [];
        const total = response.pagination?.total || response.data?.pagination?.total || 0;

        // تبدیل ساختار API به ساختار مورد نیاز کامپوننت
        const mappedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.title || p.name || "بدون نام",
          price: p.primary_price ? Math.round(p.primary_price / 10) : (p.price || 0), // تبدیل ریال به تومان
          stock: p.inventory || p.stock || 0,
          image: p.photo?.sm || p.photo?.xs || p.photo?.md || p.image || p.primary_image, // استخراج تصویر از photo object
          category: p.category?.title || p.unit_type?.name || p.category || "بدون دسته",
          status: p.status?.name === "در دسترس" ? "active" : "inactive",
          variants: p.variants || [], // ذخیره variants برای استفاده بعدی
        }));

        setProducts(mappedProducts);
        setTotalProducts(total);
      } else {
        throw new Error(response.message || "خطا در دریافت محصولات");
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setIsError(true);
      setErrorMessage(error.message || "خطا در ارتباط با سرور");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const authToken = getAuthToken();

    if (!authToken) {
      router.push("/");
      return;
    }

    fetchProducts();
  }, [router, currentPage, searchQuery]);

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      setSubmitError("لطفاً حداقل یک محصول را انتخاب کنید");
      return;
    }

    // فیلتر کردن فیلدهای خالی
    const updateData: BulkEditForm = {};
    if (bulkForm.price !== undefined && bulkForm.price !== null) {
      updateData.price = bulkForm.price;
    }
    if (bulkForm.stock !== undefined && bulkForm.stock !== null) {
      updateData.stock = bulkForm.stock;
    }
    if (bulkForm.status) {
      updateData.status = bulkForm.status;
    }
    if (bulkForm.category) {
      updateData.category = bulkForm.category;
    }

    if (Object.keys(updateData).length === 0) {
      setSubmitError("لطفاً حداقل یک فیلد را برای ویرایش وارد کنید");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // طبق Swagger schema باید آرایه products با ساختار خاص ارسال شود
      const productsToUpdate = selectedProducts.map((productId) => {
        const product = products.find((p) => p.id === productId);
        const updatePayload: any = { id: productId };
        
        const hasVariants = product && (product as any).variants && (product as any).variants.length > 0;
        
        // اگر محصول variants داره
        if (hasVariants) {
          // فقط variants رو آپدیت کن (طبق schema)
          updatePayload.variants = (product as any).variants.map((variant: any) => {
            const variantUpdate: any = { id: variant.id };
            
            // اگر قیمت تغییر کرد
            if (updateData.price !== undefined && variant.primary_price) {
              let variantPrice = updateData.price;
              
              if (bulkForm.priceType === "percent") {
                const variantPriceInToman = Math.round(variant.primary_price / 10);
                variantPrice = Math.round(variantPriceInToman * (1 + updateData.price / 100));
              }
              
              variantUpdate.primary_price = variantPrice * 10;
            }
            
            // اگر موجودی تغییر کرد
            if (updateData.stock !== undefined) {
              variantUpdate.stock = updateData.stock;
            }
            
            return variantUpdate;
          });
        } else {
          // اگر محصول variants نداره، primary_price و stock محصول اصلی رو آپدیت کن
          
          // محاسبه قیمت براساس نوع (ثابت یا درصدی)
          if (updateData.price !== undefined) {
            let newPrice = updateData.price;
            
            if (bulkForm.priceType === "percent" && product) {
              // محاسبه قیمت جدید براساس درصد
              const percentChange = updateData.price;
              newPrice = Math.round(product.price * (1 + percentChange / 100));
            }
            
            // تبدیل تومان به ریال (ضرب در 10)
            updatePayload.primary_price = newPrice * 10;
          }
          
          if (updateData.stock !== undefined) {
            updatePayload.stock = updateData.stock;
          }
        }
        
        return updatePayload;
      });

      const response = await productsApi.bulkUpdateProducts(productsToUpdate);

      if (response.success) {
        setSubmitSuccess(true);
        setSelectedProducts([]);
        setBulkForm({
          price: undefined,
          stock: undefined,
          status: undefined,
          category: undefined,
        });
        // رفرش لیست محصولات
        await fetchProducts();
        // پاک کردن پیام موفقیت بعد از 3 ثانیه
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        throw new Error(response.message || "خطا در ویرایش انبوه");
      }
    } catch (error: any) {
      console.error("Error in bulk update:", error);
      setSubmitError(error.message || "خطا در ویرایش انبوه محصولات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  if (isLoading && products.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">ویرایش انبوه محصولات</h1>
            <p className="text-slate-500">
              انتخاب و ویرایش همزمان چندین محصول
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-800 font-medium">
                ویرایش انبوه با موفقیت انجام شد
              </p>
            </motion.div>
          )}

          {/* Error Messages */}
          {(isError || submitError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">خطا</p>
                  <p className="text-red-600 text-sm">
                    {submitError || errorMessage || "خطا در ارتباط با سرور"}
                  </p>
                </div>
              </div>
              {isError && (
                <button
                  onClick={fetchProducts}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  تلاش مجدد
                </button>
              )}
              {submitError && (
                <button
                  onClick={() => setSubmitError(null)}
                  className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* فرم ویرایش انبوه */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-4">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  ویرایش انبوه
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  {selectedProducts.length > 0
                    ? `${selectedProducts.length} محصول انتخاب شده`
                    : "لطفاً محصولات را انتخاب کنید"}
                </p>

                <div className="space-y-4">
                  {/* قیمت */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      تغییر قیمت
                    </label>
                    
                    {/* انتخاب نوع تغییر */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setBulkForm({ ...bulkForm, priceType: "fixed" })}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          bulkForm.priceType === "fixed"
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        قیمت ثابت
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkForm({ ...bulkForm, priceType: "percent" })}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          bulkForm.priceType === "percent"
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        درصد تغییر
                      </button>
                    </div>
                    
                    <input
                      type="number"
                      placeholder={
                        bulkForm.priceType === "percent"
                          ? "مثال: 10 (افزایش 10%) یا -10 (کاهش 10%)"
                          : "مثال: 150000"
                      }
                      value={bulkForm.price || ""}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {bulkForm.priceType === "percent"
                        ? "عدد مثبت برای افزایش، منفی برای کاهش"
                        : "قیمت جدید به تومان"}
                    </p>
                  </div>

                  {/* موجودی */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      موجودی جدید
                    </label>
                    <input
                      type="number"
                      placeholder="مثال: 100"
                      value={bulkForm.stock || ""}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          stock: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      خالی بگذارید تا تغییر نکند
                    </p>
                  </div>

                  {/* وضعیت */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      وضعیت
                    </label>
                    <select
                      value={bulkForm.status || ""}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          status: e.target.value
                            ? (e.target.value as "active" | "inactive")
                            : undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">بدون تغییر</option>
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>

                  {/* دسته‌بندی */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      دسته‌بندی
                    </label>
                    <input
                      type="text"
                      placeholder="نام دسته‌بندی"
                      value={bulkForm.category || ""}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          category: e.target.value || undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      خالی بگذارید تا تغییر نکند
                    </p>
                  </div>

                  {/* دکمه ذخیره */}
                  <button
                    onClick={handleBulkUpdate}
                    disabled={
                      isSubmitting ||
                      selectedProducts.length === 0 ||
                      Object.values(bulkForm).every(
                        (v) => v === undefined || v === null || v === ""
                      )
                    }
                    className={cn(
                      "w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                      isSubmitting ||
                        selectedProducts.length === 0 ||
                        Object.values(bulkForm).every(
                          (v) => v === undefined || v === null || v === ""
                        )
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>ذخیره تغییرات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* لیست محصولات */}
            <div className="lg:col-span-2">
              {/* جستجو */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو در محصولات..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* جدول محصولات */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-right">
                          <button
                            onClick={toggleSelectAll}
                            disabled={products.length === 0}
                            className="flex items-center justify-center"
                          >
                            {products.length > 0 &&
                            selectedProducts.length === products.length ? (
                              <CheckSquare className="w-5 h-5 text-orange-500" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                          محصول
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                          قیمت
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                          موجودی
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                          وضعیت
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto"
                            />
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-12 text-center text-slate-500"
                          >
                            محصولی یافت نشد
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "hover:bg-slate-50 transition-colors cursor-pointer",
                              selectedProducts.includes(product.id) &&
                                "bg-orange-50"
                            )}
                            onClick={() => toggleProductSelection(product.id)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center">
                                {selectedProducts.includes(product.id) ? (
                                  <CheckSquare className="w-5 h-5 text-orange-500" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    ID: {product.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-800">
                              {formatPrice(product.price)}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  product.stock > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                )}
                              >
                                {product.stock > 0
                                  ? `${product.stock} عدد`
                                  : "ناموجود"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  product.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {product.status === "active" ? "فعال" : "غیرفعال"}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      نمایش {new Intl.NumberFormat("fa-IR").format(((currentPage - 1) * itemsPerPage) + 1)} تا{" "}
                      {new Intl.NumberFormat("fa-IR").format(Math.min(currentPage * itemsPerPage, totalProducts))} از{" "}
                      {new Intl.NumberFormat("fa-IR").format(totalProducts)} محصول
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {/* نمایش صفحه اول */}
                        {currentPage > 3 && (
                          <>
                            <button
                              onClick={() => setCurrentPage(1)}
                              className="px-3 py-1 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              ۱
                            </button>
                            {currentPage > 4 && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                          </>
                        )}
                        
                        {/* صفحات اطراف صفحه فعلی */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === currentPage ||
                            page === currentPage - 1 ||
                            page === currentPage + 1 ||
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          )
                          .map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "px-3 py-1 rounded-lg text-sm transition-colors",
                                currentPage === page
                                  ? "bg-orange-500 text-white font-bold"
                                  : "text-slate-600 hover:bg-slate-100"
                              )}
                            >
                              {new Intl.NumberFormat("fa-IR").format(page)}
                            </button>
                          ))}
                        
                        {/* نمایش صفحه آخر */}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="px-3 py-1 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              {new Intl.NumberFormat("fa-IR").format(totalPages)}
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

