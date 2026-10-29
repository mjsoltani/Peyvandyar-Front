"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  woocommerceApi,
  type WooAttribute,
  type WooCategory,
  type WooConnection,
  type WooProduct,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Globe,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AttributeDraft = WooAttribute & { value: string };

function unwrap(response: any) {
  return response?.data ?? response;
}

function formatToman(value?: number | null) {
  if (value == null) return "—";
  return `${Number(value).toLocaleString("fa-IR")} تومان`;
}

export default function WooCommerceImportPage() {
  const router = useRouter();
  const [connection, setConnection] = useState<WooConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [shopUrl, setShopUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(true);

  const [categoryQuery, setCategoryQuery] = useState("");
  const [categories, setCategories] = useState<WooCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [attributes, setAttributes] = useState<AttributeDraft[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [status, setStatus] = useState(2976);
  const [preparationDays, setPreparationDays] = useState(2);
  const [packageWeight, setPackageWeight] = useState(600);
  const [defaultStock, setDefaultStock] = useState(5);

  const [products, setProducts] = useState<WooProduct[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [importing, setImporting] = useState(false);
  const [jobProgress, setJobProgress] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = unwrap(await woocommerceApi.getConnection());
        if (cancelled) return;
        setConnected(Boolean(data.connected));
        setConnection(data.connection ?? null);
        if (data.connection?.shop_url) setShopUrl(String(data.connection.shop_url));
        if (data.connection && data.connection.vendor_active === false) {
          setError("غرفه باسلام غیرفعال است. بعد از فعال شدن غرفه دوباره ایمپورت کنید.");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "";
          if (message && !/No active WooCommerce connection/i.test(message)) {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) setLoadingConnection(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = categoryQuery.trim();
    if (!connected || query.length < 2) {
      setCategories([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = unwrap(await woocommerceApi.searchCategories(query));
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setCategories([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [categoryQuery, connected]);

  async function connectShop(event: React.FormEvent) {
    event.preventDefault();
    if (!shopUrl.trim()) {
      setError("آدرس فروشگاه را وارد کنید");
      return;
    }
    setConnecting(true);
    setError("");
    setNotice("");
    try {
      const data = unwrap(
        await woocommerceApi.connect({
          shop_url: shopUrl.trim(),
        })
      );
      if (data.success === false) {
        setError(data.error || "اتصال ناموفق بود");
        return;
      }
      setConnected(true);
      setConnection(data.connection ?? null);
      setNotice(data.message || "اتصال فروشگاه ذخیره شد");
      if (data.connection?.vendor_active === false) {
        setError("غرفه باسلام غیرفعال است. بعد از فعال شدن غرفه دوباره ایمپورت کنید.");
      }
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : "اتصال ناموفق بود");
    } finally {
      setConnecting(false);
    }
  }

  async function chooseCategory(category: WooCategory) {
    setCategoryId(String(category.id));
    setCategoryQuery(category.path);
    setCategories([]);
    setLoadingAttributes(true);
    setError("");
    try {
      const data = unwrap(await woocommerceApi.getAttributes(category.id));
      const fields: WooAttribute[] = Array.isArray(data.attributes) ? data.attributes : [];
      setAttributes(fields.map((field) => ({ ...field, value: "" })));
    } catch (err) {
      setAttributes([]);
      setError(err instanceof Error ? err.message : "خواندن ویژگی‌های دسته ناموفق بود");
    } finally {
      setLoadingAttributes(false);
    }
  }

  async function loadCatalog(nextPage: number) {
    setLoadingCatalog(true);
    setError("");
    try {
      const data = unwrap(await woocommerceApi.getProducts({ page: nextPage, page_size: 20 }));
      setProducts(Array.isArray(data.products) ? data.products : []);
      setPage(Number(data.page) || nextPage);
      setTotal(Number(data.total) || 0);
      setTotalPages(Math.max(1, Number(data.total_pages) || 1));
      setSelected([]);
    } catch (err) {
      setProducts([]);
      setError(err instanceof Error ? err.message : "خواندن کاتالوگ ناموفق بود");
    } finally {
      setLoadingCatalog(false);
    }
  }

  function productAttributes() {
    const result: { attribute_id: number; value?: string; selected_values?: number[] }[] = [];
    for (const field of attributes) {
      if (!field.value) continue;
      if ((field.options || []).length > 0) {
        result.push({ attribute_id: field.id, selected_values: [Number(field.value)] });
      } else {
        result.push({ attribute_id: field.id, value: field.value });
      }
    }
    return result;
  }

  async function runImport(scope: "selected" | "all") {
    setError("");
    setNotice("");
    const missing = attributes.filter((field) => field.required && !field.value);
    if (!Number(categoryId)) {
      setError("دسته‌بندی باسلام را انتخاب کنید");
      return;
    }
    if (missing.length > 0) {
      setError(`ویژگی اجباری خالی است: ${missing.map((field) => field.title).join("، ")}`);
      return;
    }
    if (connection?.vendor_active === false) {
      setError("غرفه باسلام غیرفعال است. بعد از فعال شدن غرفه دوباره ایمپورت کنید.");
      return;
    }
    if (scope === "selected" && selected.length === 0) return;

    setImporting(true);
    setJobProgress("");
    try {
      const data = unwrap(
        await woocommerceApi.importCatalog({
          product_ids: scope === "selected" ? selected : undefined,
          category_id: Number(categoryId),
          status,
          preparation_days: preparationDays,
          package_weight: packageWeight,
          default_stock: defaultStock,
          product_attribute: productAttributes(),
        })
      );
      if (data.mode === "import_queued" && data.job_id) {
        await pollJob(String(data.job_id));
        return;
      }
      setNotice(
        data.message ||
          `${Number(data.products_imported || 0).toLocaleString("fa-IR")} محصول ساخته شد، ${Number(data.products_failed || 0).toLocaleString("fa-IR")} ناموفق`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "ایمپورت ناموفق بود");
    } finally {
      setImporting(false);
      setJobProgress("");
    }
  }

  async function pollJob(jobId: string) {
    for (let attempt = 0; attempt < 600; attempt += 1) {
      const response: any = await woocommerceApi.getJobStatus(jobId);
      const job = response.job ?? response.data?.job ?? response;
      const jobStatus = String(job.status || "").toLowerCase();
      setJobProgress(
        job.progress
          ? `${job.progress}${job.current_product ? ` — ${job.current_product}` : ""}`
          : job.current_product || "در حال انتقال"
      );
      if (jobStatus === "completed" || jobStatus === "success") {
        const results = job.results || {};
        setNotice(
          `${Number(results.products_imported || 0).toLocaleString("fa-IR")} محصول ساخته شد، ${Number(results.products_failed || 0).toLocaleString("fa-IR")} ناموفق`
        );
        return;
      }
      if (jobStatus === "failed") {
        throw new Error(job.error || "انتقال ناموفق بود");
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    throw new Error("زمان انتظار برای انتقال تمام شد");
  }

  const allPageSelected =
    products.length > 0 && products.every((product) => selected.includes(product.id));
  const selectedCategory = categories.find((category) => String(category.id) === categoryId);

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/copy-product")}
            className="mb-6 flex items-center gap-2 text-slate-500 transition-colors hover:text-orange-500"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به کپی محصول
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Globe className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ایمپورت ووکامرس به باسلام</h1>
              <p className="text-sm text-slate-500">
                کاتالوگ و ساخت محصول از بک‌اند پیوندیار می‌آید. توکن باسلام در این صفحه وارد نمی‌شود.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-800">اتصال فروشگاه</h2>
            {loadingConnection ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال خواندن اتصال
              </p>
            ) : (
              <form onSubmit={connectShop} className="space-y-4">
                <label className="block text-sm text-slate-600">
                  آدرس فروشگاه ووکامرس
                  <input
                    value={shopUrl}
                    onChange={(event) => setShopUrl(event.target.value)}
                    placeholder="https://example.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
                    dir="ltr"
                  />
                </label>
                <div>
                  <button
                    type="submit"
                    disabled={connecting}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {connecting ? "در حال ذخیره..." : "ذخیره اتصال"}
                  </button>
                  {connected && connection?.shop_url && (
                    <p className="mt-3 text-sm text-slate-600">
                      وصل به {connection.shop_url}
                      {connection.vendor_title ? ` — غرفه ${connection.vendor_title}` : ""}
                      {connection.currency_code ? ` — ${connection.currency_code}` : ""}
                    </p>
                  )}
                </div>
              </form>
            )}
          </section>

          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-800">انتشار در باسلام</h2>
            <label className="block text-sm text-slate-600">
              جستجوی دسته‌بندی
              <input
                value={categoryQuery}
                onChange={(event) => setCategoryQuery(event.target.value)}
                placeholder="حداقل دو حرف، مثلاً جوش"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
              />
            </label>
            {selectedCategory && <p className="mt-2 text-sm text-slate-600">{selectedCategory.path}</p>}
            {categoryId && !selectedCategory && (
              <p className="mt-2 text-sm text-slate-500">دسته انتخاب‌شده: {categoryId}</p>
            )}
            {categories.length > 0 && (
              <div className="mt-3 flex max-h-40 flex-col gap-1 overflow-y-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => chooseCategory(category)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-right text-sm hover:bg-orange-50",
                      String(category.id) === categoryId ? "bg-orange-50 text-orange-700" : "text-slate-700"
                    )}
                  >
                    {category.path}
                  </button>
                ))}
              </div>
            )}
            {loadingAttributes && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                ویژگی‌های دسته
              </p>
            )}
            {attributes.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {attributes.map((field) => (
                  <label key={field.id} className="block text-sm text-slate-600">
                    {field.title}
                    {field.unit ? ` (${field.unit})` : ""}
                    {field.required ? " *" : ""}
                    {(field.options || []).length > 0 ? (
                      <select
                        value={field.value}
                        onChange={(event) =>
                          setAttributes((prev) =>
                            prev.map((item) =>
                              item.id === field.id ? { ...item, value: event.target.value } : item
                            )
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <option value="">انتخاب کنید</option>
                        {(field.options || []).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={field.value}
                        onChange={(event) =>
                          setAttributes((prev) =>
                            prev.map((item) =>
                              item.id === field.id ? { ...item, value: event.target.value } : item
                            )
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block text-sm text-slate-600">
                وضعیت
                <select
                  value={status}
                  onChange={(event) => setStatus(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value={2976}>منتشر شده</option>
                  <option value={3790}>منتشر نشده</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                روز آماده‌سازی
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={preparationDays}
                  onChange={(event) => setPreparationDays(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm text-slate-600">
                وزن بسته‌بندی (گرم)
                <input
                  type="number"
                  min={1}
                  value={packageWeight}
                  onChange={(event) => setPackageWeight(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800">
                کاتالوگ{total > 0 ? ` (${total.toLocaleString("fa-IR")})` : ""}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadCatalog(1)}
                  disabled={!connected || loadingCatalog}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
                >
                  {loadingCatalog ? "در حال خواندن..." : "خواندن کاتالوگ"}
                </button>
                <button
                  type="button"
                  onClick={() => runImport("selected")}
                  disabled={importing || selected.length === 0}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  انتقال انتخاب‌شده‌ها
                </button>
                <button
                  type="button"
                  onClick={() => runImport("all")}
                  disabled={importing || !connected}
                  className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 disabled:opacity-60"
                >
                  انتقال همه
                </button>
              </div>
            </div>
            {jobProgress && <p className="mb-3 text-sm text-slate-600">{jobProgress}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={() =>
                          setSelected(allPageSelected ? [] : products.map((product) => product.id))
                        }
                      />
                    </th>
                    <th className="px-2 py-2 font-medium">محصول</th>
                    <th className="px-2 py-2 font-medium">قیمت</th>
                    <th className="px-2 py-2 font-medium">موجودی</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-50">
                      <td className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() =>
                            setSelected((current) =>
                              current.includes(product.id)
                                ? current.filter((id) => id !== product.id)
                                : [...current, product.id]
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-medium text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-400" dir="ltr">
                          {product.sku || product.id}
                        </div>
                      </td>
                      <td className="px-2 py-3">{formatToman(product.price_toman)}</td>
                      <td className="px-2 py-3">{product.in_stock ? "موجود" : "ناموجود"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {products.length === 0 && !loadingCatalog && (
              <p className="py-8 text-center text-sm text-slate-500">کاتالوگ بعد از اتصال از بک‌اند خوانده می‌شود.</p>
            )}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <button
                  type="button"
                  disabled={page <= 1 || loadingCatalog}
                  onClick={() => loadCatalog(page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                >
                  صفحه قبل
                </button>
                <span>
                  {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loadingCatalog}
                  onClick={() => loadCatalog(page + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                >
                  صفحه بعد
                </button>
              </div>
            )}
          </section>
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
