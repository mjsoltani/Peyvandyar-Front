"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { productsApi, userApi } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Search,
  Filter,
  Edit,
  Trash2,
  Upload,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Package,
  Image as ImageIcon,
  DollarSign,
  FileText,
  AlertCircle,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ApiSectionWrapper } from "@/components/dashboard/api-error-boundary";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  photo?: string;
  category: string;
  status: "active" | "inactive";
  lastModified: string;
  sku?: string;
  unitType?: string;
  preparationDay?: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [vendorIdentifier, setVendorIdentifier] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [totalProducts, setTotalProducts] = useState(0);
  const [showAddProductHelp, setShowAddProductHelp] = useState(false);
  
  const itemsPerPage = 10;

  // Debounce برای جستجو (500ms تاخیر)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      let response;

      // اگر جستجو داریم و vendorIdentifier موجوده، از endpoint جدید استفاده کن
      if (debouncedSearch && vendorIdentifier) {
        response = await productsApi.searchProducts({
          q: debouncedSearch,
          vendorIdentifier,
          rows: itemsPerPage,
          start: (currentPage - 1) * itemsPerPage,
        });

        if (response.success) {
          const rawProducts = response.data?.products || [];
          const total = response.total || 0;

          const mappedProducts = rawProducts.map((p: any) => ({
            id: p.id,
            name: p.title || "بدون نام",
            price: p.price ? Math.round(p.price / 10) : 0,
            stock: p.inventory || 0,
            photo: p.photo?.md || p.photo?.sm || p.photo?.xs,
            category: p.unit_type?.name || "بدون دسته",
            status: p.status?.name === "در دسترس" ? "active" : "inactive",
            lastModified: p.published || "نامشخص",
            sku: p.sku,
            unitType: p.unit_type?.name,
            preparationDay: p.preparation_day,
          }));

          setProducts(mappedProducts);
          setTotalProducts(total);
          return;
        }
      }

      // حالت عادی (بدون سرچ یا بدون vendorIdentifier)
      response = await productsApi.getProducts({
        page: currentPage,
        per_page: itemsPerPage,
        search: debouncedSearch || undefined,
        status: filterStatus,
      });

      console.log("Products API Response:", response);

      if (response.success) {
        const productsData = response.data?.data || [];
        const total = response.pagination?.total_count || response.pagination?.total || 0;

        const getProductPhoto = (product: any): string | undefined => {
          if (product.photo) {
            return product.photo.md || product.photo.sm || product.photo.xs || product.photo.original || product.photo.lg;
          }
          return undefined;
        };

        const mappedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.title || "بدون نام",
          price: p.price ? Math.round(p.price / 10) : 0,
          stock: p.inventory || 0,
          photo: getProductPhoto(p),
          category: p.unit_type?.name || "بدون دسته",
          status: p.status?.name === "در دسترس" ? "active" : "inactive",
          lastModified: p.published || "نامشخص",
          sku: p.sku,
          unitType: p.unit_type?.name,
          preparationDay: p.preparation_day,
        }));

        setProducts(mappedProducts);
        setTotalProducts(total);
      } else {
        throw new Error(response.message || response.error || "خطا در دریافت محصولات");
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
    // دریافت vendor identifier یک بار
    userApi.getVendorId().then((res) => {
      if (res.success && res.vendor_identifier) {
        setVendorIdentifier(res.vendor_identifier);
      }
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearch, filterStatus, vendorIdentifier]);

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleBulkEdit = async () => {
    if (selectedProducts.length === 0) return;
    
    // رفتن به صفحه ویرایش انبوه
    router.push("/dashboard/bulk-edit");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "نامشخص") return "نامشخص";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">مدیریت محصولات</h1>
            <p className="text-slate-500">
              مدیریت و ویرایش محصولات فروشگاه باسلام
            </p>
          </div>

          <ApiSectionWrapper
            error={isError ? new Error(errorMessage) : null}
            isLoading={isLoading && products.length === 0}
            onRetry={fetchProducts}
            errorTitle="خطا در دریافت محصولات"
          >

          {/* Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو در محصولات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as any);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">همه محصولات</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => router.push("/dashboard/copy-product")}
                    onMouseEnter={() => setShowAddProductHelp(true)}
                    onMouseLeave={() => setShowAddProductHelp(false)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">افزودن محصول</span>
                  </button>
                  
                  {/* Help Tooltip */}
                  {showAddProductHelp && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 text-white rounded-lg p-3 text-sm z-50 shadow-lg"
                    >
                      <div className="flex gap-2">
                        <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-400" />
                        <div>
                          <p className="font-medium mb-1">کپی محصول از غرفه‌های دیگر</p>
                          <p className="text-slate-300 text-xs">
                            این دکمه برای کپی محصولات از فروشگاه‌های دیگری که شما دسترسی ندارید استفاده می‌شود. می‌توانید لینک محصول را وارد کنید و آن را به فروشگاه خود اضافه کنید.
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-full left-4 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                    </motion.div>
                  )}
                </div>
                
                {selectedProducts.length > 0 && (
                  <button 
                    onClick={handleBulkEdit}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش ({selectedProducts.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center"
                        disabled={products.length === 0}
                      >
                        {products.length > 0 && selectedProducts.length === products.length ? (
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
                      دسته‌بندی
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      آخرین تغییر
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto"
                        />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
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
                          "hover:bg-slate-50 transition-colors",
                          selectedProducts.includes(product.id) && "bg-orange-50"
                        )}
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleProductSelection(product.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedProducts.includes(product.id) ? (
                              <CheckSquare className="w-5 h-5 text-orange-500" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.photo ? (
                                <img 
                                  src={product.photo} 
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    // اگر تصویر لود نشد، fallback به icon
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.fallback-icon')) {
                                      const icon = document.createElement('div');
                                      icon.className = 'fallback-icon';
                                      icon.innerHTML = '<svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                      parent.appendChild(icon);
                                    }
                                  }}
                                  loading="lazy"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{product.name}</div>
                              <div className="text-xs text-slate-500">ID: {product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-slate-800">
                            <DollarSign className="w-4 h-4 text-orange-500" />
                            {formatPrice(product.price)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            product.stock > 0 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          )}>
                            {product.stock > 0 ? `${product.stock} عدد` : "ناموجود"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 text-sm">
                          {product.category}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            product.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                          )}>
                            {product.status === "active" ? "فعال" : "غیرفعال"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 text-sm">
                          {formatDate(product.lastModified)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalProducts)} از {totalProducts} محصول
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm",
                          currentPage === page
                            ? "bg-orange-500 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          </ApiSectionWrapper>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {[
              { 
                label: "کل محصولات", 
                value: totalProducts, 
                icon: Package, 
                color: "orange" 
              },
              { 
                label: "محصولات فعال", 
                value: products.filter(p => p.status === "active").length, 
                icon: CheckSquare, 
                color: "green" 
              },
              { 
                label: "موجود در انبار", 
                value: products.filter(p => p.stock > 0).length, 
                icon: FileText, 
                color: "blue" 
              },
              { 
                label: "انتخاب شده", 
                value: selectedProducts.length, 
                icon: CheckSquare, 
                color: "orange" 
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn(
                    "w-6 h-6",
                    stat.color === "orange" && "text-orange-500",
                    stat.color === "green" && "text-green-500",
                    stat.color === "blue" && "text-blue-500"
                  )} />
                  <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                </div>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
