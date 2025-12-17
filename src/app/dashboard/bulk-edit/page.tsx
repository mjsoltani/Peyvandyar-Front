"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  description?: string;
}

export default function BulkEditPage() {
  const router = useRouter();
  const tableEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
    description: undefined,
  });

  const fetchProducts = async (append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);
      setErrorMessage("");

      const response = await productsApi.getProducts({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchQuery || undefined,
      });

      if (response.success && response.data) {
        const productsData = response.data?.data || [];
        const total = response.pagination?.total || response.data?.pagination?.total || 0;
        const totalPage = response.pagination?.total_page || response.data?.pagination?.total_page || 0;

        // تبدیل ساختار API به ساختار مورد نیاز کامپوننت
        const mappedProducts = productsData.map((p: any) => {
          // قیمت از API به ریال میاد، باید به تومان تبدیلش کنیم
          const priceInRial = p.price || p.primary_price || 0;
          const priceInToman = Math.round(priceInRial / 10);
          
          return {
            id: p.id,
            name: p.title || p.name || "بدون نام",
            price: priceInToman, // قیمت به تومان
            stock: p.inventory || p.stock || 0,
            image: p.photo?.sm || p.photo?.xs || p.photo?.md || p.image || p.primary_image,
            category: p.category?.title || p.unit_type?.name || p.category || "بدون دسته",
            status: p.status?.name === "در دسترس" ? "active" : "inactive",
            variant: p.variant || [], // ذخیره variant برای استفاده بعدی
          };
        });

        // اگر append باشه، محصولات جدید رو به لیست اضافه کن
        if (append) {
          setProducts(prev => [...prev, ...mappedProducts]);
        } else {
          setProducts(mappedProducts);
        }
        setTotalProducts(total);
        setTotalPages(totalPage);
      } else {
        throw new Error(response.message || "خطا در دریافت محصولات");
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setIsError(true);
      setErrorMessage(error.message || "خطا در ارتباط با سرور");
      if (!append) {
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const authToken = getAuthToken();

    if (!authToken) {
      router.push("/");
      return;
    }

    // اگر صفحه 1 هست یا search تغییر کرده، از اول لود کن
    if (currentPage === 1) {
      fetchProducts(false);
    } else {
      // اگر صفحه بعدی هست، append کن
      fetchProducts(true);
    }
  }, [currentPage]);

  // وقتی search تغییر کرد، صفحه رو ریست کن
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
  }, [searchQuery]);

  // Infinite scroll - وقتی کاربر به پایین رسید
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isLoading) {
          // چک کن که صفحه فعلی از total_page کمتر است
          if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (tableEndRef.current) {
      observer.observe(tableEndRef.current);
    }

    return () => {
      if (tableEndRef.current) {
        observer.unobserve(tableEndRef.current);
      }
    };
  }, [isLoadingMore, isLoading, currentPage, totalPages]);

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
    if (bulkForm.description) {
      updateData.description = bulkForm.description;
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
        
        const hasVariants = product && (product as any).variant && (product as any).variant.length > 0;
        
        // اگر محصول variant داره
        if (hasVariants) {
          // فقط variants رو آپدیت کن (طبق schema)
          updatePayload.variants = (product as any).variant.map((v: any) => {
            const variantUpdate: any = { id: v.id };
            
            // اگر قیمت تغییر کرد
            if (updateData.price !== undefined) {
              let variantPrice = updateData.price;
              
              // استخراج قیمت فعلی variant (primary_price یا price) - قیمت به تومان است
              const currentPrice = v.primary_price ? Math.round(v.primary_price / 10) : (v.price ? Math.round(v.price / 10) : 0);
              
              if (bulkForm.priceType === "percent" && currentPrice > 0) {
                variantPrice = Math.round(currentPrice * (1 + updateData.price / 100));
              }
              
              // convertPriceToRial سر ارسال خودش ضرب در 10 میکند، پس فقط تومان ارسال کن
              variantUpdate.primary_price = variantPrice;
            }
            
            // اگر موجودی تغییر کرد
            if (updateData.stock !== undefined) {
              variantUpdate.stock = updateData.stock;
            }
            
            return variantUpdate;
          });
        } else {
          // اگر محصول variant نداره، primary_price و stock محصول اصلی رو آپدیت کن
          
          // محاسبه قیمت براساس نوع (ثابت یا درصدی)
          if (updateData.price !== undefined) {
            let newPrice = updateData.price;
            
            if (bulkForm.priceType === "percent" && product) {
              // محاسبه قیمت جدید براساس درصد
              const percentChange = updateData.price;
              newPrice = Math.round(product.price * (1 + percentChange / 100));
            }
            
            // convertPriceToRial سر ارسال خودش ضرب در 10 میکند، پس فقط تومان ارسال کن
            updatePayload.primary_price = newPrice;
          }
          
          if (updateData.stock !== undefined) {
            updatePayload.stock = updateData.stock;
          }

          if (updateData.description !== undefined) {
            updatePayload.description = updateData.description;
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
          priceType: "fixed",
          stock: undefined,
          status: undefined,
          category: undefined,
          description: undefined,
        });
        // ریست کردن لیست و رفرش از صفحه 1
        setCurrentPage(1);
        setProducts([]);
        await fetchProducts(false);
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
    // قیمت به تومان است، فقط فرمت کن
    return new Intl.NumberFormat("fa-IR").format(Math.round(price)) + " تومان";
  };

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
                  onClick={() => fetchProducts(false)}
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
              <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
                    <label htmlFor="price-input" className="block text-sm font-medium text-slate-700 mb-2">
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
                      id="price-input"
                      type="text"
                      inputMode="numeric"
                      placeholder={
                        bulkForm.priceType === "percent"
                          ? "مثال: 10 (افزایش 10%) یا -10 (کاهش 10%)"
                          : "مثال: 13000 (نمایش: 130000 تومان)"
                      }
                      value={bulkForm.price !== undefined ? bulkForm.price : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // فقط اعداد و منفی رو قبول کن
                        if (val === "" || val === "-" || /^-?\d+$/.test(val)) {
                          setBulkForm({
                            ...bulkForm,
                            price: val ? Number(val) : undefined,
                          });
                        }
                      }}
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
                    <label htmlFor="stock-input" className="block text-sm font-medium text-slate-700 mb-2">
                      موجودی جدید
                    </label>
                    <input
                      id="stock-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="مثال: 100"
                      value={bulkForm.stock !== undefined ? bulkForm.stock : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // فقط اعداد مثبت رو قبول کن
                        if (val === "" || /^\d+$/.test(val)) {
                          setBulkForm({
                            ...bulkForm,
                            stock: val ? Number(val) : undefined,
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      خالی بگذارید تا تغییر نکند
                    </p>
                  </div>

                  {/* وضعیت */}
                  <div>
                    <label htmlFor="status-select" className="block text-sm font-medium text-slate-700 mb-2">
                      وضعیت
                    </label>
                    <select
                      id="status-select"
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
                    <label htmlFor="category-input" className="block text-sm font-medium text-slate-700 mb-2">
                      دسته‌بندی
                    </label>
                    <input
                      id="category-input"
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

                  {/* توضیحات */}
                  <div>
                    <label htmlFor="description-input" className="block text-sm font-medium text-slate-700 mb-2">
                      توضیحات
                    </label>
                    <textarea
                      id="description-input"
                      placeholder="توضیحات محصول"
                      value={bulkForm.description || ""}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          description: e.target.value || undefined,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
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

                {/* Load More / Info */}
                <div className="px-4 py-4 border-t border-slate-200 flex flex-col items-center gap-4">
                  <div className="text-sm text-slate-600">
                    نمایش {new Intl.NumberFormat("fa-IR").format(products.length)} از{" "}
                    {new Intl.NumberFormat("fa-IR").format(totalProducts)} محصول
                    {totalPages > 0 && (
                      <span className="mr-2">
                        (صفحه {new Intl.NumberFormat("fa-IR").format(currentPage)} از{" "}
                        {new Intl.NumberFormat("fa-IR").format(totalPages)})
                      </span>
                    )}
                  </div>
                  
                  {currentPage < totalPages && (
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={isLoadingMore}
                      className={cn(
                        "px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2",
                        isLoadingMore
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      )}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>در حال بارگذاری...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          <span>بارگذاری بیشتر</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Infinite scroll trigger */}
                  <div ref={tableEndRef} className="h-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

