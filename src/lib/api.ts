// API service for Peyvandyar backend
import { getAuthToken } from "./auth";

const API_BASE_URL = "https://peyvandyar.amintvk.ir/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  user?: any; // برخی APIها مستقیماً user را در root برمی‌گردانند
  message?: string;
  error?: string;
  pagination?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    page?: number;
    total_page?: number;
    total_count?: number;
    result_count?: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isAuthError: boolean = false,
    public isSubscriptionExpired: boolean = false,
    public code?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // چک کردن که در client-side هستیم
  if (typeof window === "undefined") {
    throw new ApiError("API requests can only be made from client-side");
  }

  const token = getAuthToken();
  
  if (!token) {
    throw new ApiError("Authentication required", 401, true);
  }

  // ساخت headers با merge صحیح
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "X-Encrypted-Token": token,
  };

  // Merge کردن headers به صورت صحیح
  const headers = new Headers(defaultHeaders);
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers.set(key, value);
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, String(value));
        }
      });
    }
  }

  try {
    // ساخت URL کامل
    const url = `${API_BASE_URL}${endpoint}`;
    
    // ساخت options برای fetch
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      method: options.method || "GET",
    };

    // اگر body وجود دارد و string نیست، stringify کن
    if (fetchOptions.body && typeof fetchOptions.body !== "string") {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      const isAuthError = response.status === 401 || response.status === 403;
      let isSubscriptionExpired = false;
      let errorCode: string | undefined;
      let retryAfter: number | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.reason || errorMessage;
        errorCode = errorData.code;
        retryAfter = errorData.retryAfter;

        // چک کردن subscription expired
        if (errorData.error === "subscription_expired") {
          isSubscriptionExpired = true;
          errorMessage = errorData.message || "اشتراک شما به پایان رسیده است. لطفا برای ادامه استفاده اشتراک تهیه کنید.";
        }
      } catch {
        // اگر response JSON نبود، از status text استفاده کن
        errorMessage = response.statusText || errorMessage;
      }

      // برای خطاهای احراز هویت، پیغام مناسب‌تر
      if (isAuthError && !isSubscriptionExpired) {
        errorMessage = "دسترسی غیرمجاز - لطفا مجددا وارد شوید";
      }

      throw new ApiError(errorMessage, response.status, isAuthError, isSubscriptionExpired, errorCode, retryAfter);
    }

    // چک کردن که response خالی نباشد
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      // چک کردن subscription expired در successful response
      if (data.success === false && data.error === "subscription_expired") {
        const errorMessage = data.message || "اشتراک شما به پایان رسیده است. لطفا برای ادامه استفاده اشتراک تهیه کنید.";
        throw new ApiError(errorMessage, 200, false, true);
      }
      
      return data;
    } else {
      // اگر JSON نبود، متن خام را برگردان
      const text = await response.text();
      return { success: true, data: text as any };
    }
  } catch (error) {
    // لاگ کردن خطا - فقط در client-side
    // حذف استفاده از process.env برای جلوگیری از مشکل در build time
    if (typeof window !== "undefined") {
      try {
        // فقط در browser لاگ کن (در production هم می‌توانیم لاگ کنیم)
        console.error("API request failed:", {
          endpoint,
          error: error instanceof Error ? error.message : String(error),
        });
      } catch {
        // اگر console.error خطا داد، نادیده بگیر
      }
    }
    throw error;
  }
}

// Helper function برای تبدیل قیمت از تومان به ریال (برای ارسال به API)
const convertPriceToRial = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => convertPriceToRial(item));
  }
  
  if (data && typeof data === 'object') {
    const converted = { ...data };
    
    // تبدیل فیلدهای قیمت از تومان به ریال (ضرب در 10)
    if ('price' in converted && typeof converted.price === 'number') {
      converted.price = converted.price * 10;
    }
    if ('primary_price' in converted && typeof converted.primary_price === 'number') {
      converted.primary_price = converted.primary_price * 10;
    }
    
    // اگر products یک آرایه است، هر محصول را تبدیل کن
    if ('products' in converted && Array.isArray(converted.products)) {
      converted.products = converted.products.map((product: any) => {
        const productCopy = { ...product };
        if ('price' in productCopy && typeof productCopy.price === 'number') {
          productCopy.price = productCopy.price * 10;
        }
        if ('primary_price' in productCopy && typeof productCopy.primary_price === 'number') {
          productCopy.primary_price = productCopy.primary_price * 10;
        }
        // اگر variants وجود دارد
        if ('variants' in productCopy && Array.isArray(productCopy.variants)) {
          productCopy.variants = productCopy.variants.map((variant: any) => {
            const variantCopy = { ...variant };
            if ('price' in variantCopy && typeof variantCopy.price === 'number') {
              variantCopy.price = variantCopy.price * 10;
            }
            if ('primary_price' in variantCopy && typeof variantCopy.primary_price === 'number') {
              variantCopy.primary_price = variantCopy.primary_price * 10;
            }
            return variantCopy;
          });
        }
        return productCopy;
      });
    }
    
    return converted;
  }
  
  return data;
};

// Products API
export const productsApi = {
  /**
   * دریافت لیست محصولات
   */
  getProducts: async (params?: {
    page?: number;
    per_page?: number;
    limit?: number; // برای backward compatibility
    search?: string;
    status?: "all" | "active" | "inactive";
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    // استفاده از per_page به جای limit (طبق API-ENDPOINTS.json)
    const perPage = params?.per_page || params?.limit;
    if (perPage) queryParams.append("per_page", perPage.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }

    const query = queryParams.toString();
    return apiRequest<any>(
      `/products${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  /**
   * جستجوی محصولات با endpoint جدید (POST /products/search)
   */
  searchProducts: async (params: {
    q: string;
    vendorIdentifier: string;
    rows?: number;
    start?: number;
    slug?: string;
    freeShipping?: number;
    sameCity?: number;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    vendorScore?: number;
  }) => {
    return apiRequest<any>("/products/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * دریافت یک محصول خاص
   */
  getProduct: async (id: number) => {
    return apiRequest<any>(`/products/${id}`, { method: "GET" });
  },

  /**
   * ویرایش محصول
   */
  updateProduct: async (id: number, data: any) => {
    // تبدیل قیمت از تومان به ریال قبل از ارسال
    const convertedData = convertPriceToRial(data);
    return apiRequest<any>(`/products/${id}`, {
      method: "PATCH", // طبق API-ENDPOINTS.json باید PATCH باشد
      body: JSON.stringify(convertedData),
    });
  },

  /**
   * ویرایش انبوه محصولات
   */
  bulkUpdateProducts: async (products: Array<{ id: number; [key: string]: any }>) => {
    // تبدیل قیمت از تومان به ریال قبل از ارسال
    const convertedProducts = convertPriceToRial({ products });
    // طبق API-ENDPOINTS.json باید آرایه products ارسال شود
    return apiRequest<any>("/products/batch-update", {
      method: "PATCH", // طبق API-ENDPOINTS.json باید PATCH باشد
      body: JSON.stringify(convertedProducts),
    });
  },

  /**
   * حذف محصول
   */
  deleteProduct: async (id: number) => {
    return apiRequest<any>(`/products/${id}`, { method: "DELETE" });
  },

  /**
   * کپی محصول
   */
  copyProduct: async (id: number) => {
    return apiRequest<any>(`/products/${id}/copy`, { method: "POST" });
  },

  /**
   * دریافت اطلاعات محصول از باسلام (برای پیش‌نمایش)
   */
  getProductFromBasalam: async (productId: string | number) => {
    return apiRequest<any>(`/product/${productId}`, { method: "GET" });
  },

  /**
   * کپی محصول از باسلام (بعد از تایید کاربر)
   */
  copyProductFromBasalam: async (productId: string | number, productData?: any) => {
    // اگر productData ارسال شده، آن را در body قرار بده
    const body = productData ? JSON.stringify({ product_data: productData }) : undefined;
    return apiRequest<any>(`/product/${productId}/copy`, { 
      method: "POST",
      body
    });
  },

  /**
   * کپی همه محصولات یک وندور مبدأ به یک وندور مقصد
   * POST /api/products/copy-vendor-products
   * توکن‌ها hashed token هستند (نه JWT خام). برای تعداد زیاد محصول
   * ممکن است پردازش async شود و jobId برگردد — با syncBoothsApi.getJobStatus پیگیری شود.
   */
  copyVendorProducts: async (params: {
    sourceVendorToken: string;
    sourceVendorId: string;
    targetVendorToken: string;
    targetVendorId: string;
    maxProducts?: number; // پیش‌فرض 100، حداکثر 1000
  }) => {
    const response = await apiRequest<any>("/products/copy-vendor-products", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return response as {
      success: boolean;
      jobId?: string;
      message?: string;
      error?: string;
      [key: string]: unknown;
    };
  },

  /**
   * کپی لیست انتخابی از محصولات به یک وندور مقصد
   * POST /api/products/copy-selected
   * پردازش سینک است (نه job) — برای تعداد زیاد محصول ممکن است request طول بکشد.
   */
  copySelectedProducts: async (params: {
    productIds: string[];
    targetVendorId: string;
    targetVendorToken: string;
  }) => {
    const response = await apiRequest<any>("/products/copy-selected", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return response as {
      success: boolean;
      message?: string;
      target_vendor_id?: string;
      total_products_requested?: number;
      products_copied?: number;
      products_failed?: number;
      results?: Array<{
        original_product_id: string;
        new_product_id: number;
        success: boolean;
        name?: string;
      }>;
      summary?: {
        success_rate: string;
        successful_copies: number;
        failed_copies: number;
      };
      error?: string;
    };
  },

  /**
   * آپلود تصویر محصول
   */
  uploadProductImage: async (file: File) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new ApiError("Authentication required", 401, true);
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/products/upload-image`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'X-Encrypted-Token': token,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `خطا در آپلود تصویر: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(errorMessage, response.status);
    }

    const data = await response.json();
    return data;
  },

  /**
   * ایجاد محصول جدید
   */
  createProduct: async (productData: {
    name: string;
    category_id: number;
    photo: number;
    primary_price: number;
    stock: number;
    photos?: number[];
    brief?: string;
    description?: string;
    preparation_days?: number;
    weight?: number;
    package_weight?: number;
    sku?: string;
    is_wholesale?: boolean;
  }) => {
    // تبدیل قیمت از تومان به ریال
    const dataToSend = {
      ...productData,
      primary_price: productData.primary_price * 10,
    };

    return apiRequest<any>('/products', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  },
};

// User/Profile API
export const userApi = {
  /**
   * دریافت اطلاعات کاربر فعلی
   */
  getProfile: async () => {
    return apiRequest<any>("/me", { method: "GET" });
  },
  
  /**
   * دریافت اطلاعات کاربر (از global token)
   */
  getUserInfo: async () => {
    return apiRequest<any>("/user", { method: "GET" });
  },

  /**
   * دریافت vendor_identifier فروشگاه
   * GET /api/vendor-id
   */
  getVendorId: async () => {
    return apiRequest<any>("/vendor-id", { method: "GET" });
  },
};

// Currency API
export const currencyApi = {
  /**
   * دریافت نرخ دلار روز
   */
  getUsdRate: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/currency/usd`);
      if (!response.ok) {
        throw new Error("Failed to fetch USD rate");
      }
      const data = await response.json();
      // استخراج قیمت از response
      return { 
        success: data.success !== false, 
        rate: data.price || null,
        title: data.title || "دلار",
        change: data.change || 0,
        changePercent: data.changePercent || 0
      };
    } catch (error) {
      console.error("Error fetching USD rate:", error);
      return { success: false, rate: null };
    }
  },
};

// Admin API (نیاز به admin authentication)
export const adminApi = {
  /**
   * دریافت لیست تمام کاربران
   * GET /api/admin/users
   */
  getUsers: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    const response = await apiRequest<any>(
      `/admin/users${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
    
    // تبدیل response format برای سازگاری
    const responseData = response as any;
    if (response.success && responseData.users) {
      return {
        success: true,
        data: {
          data: responseData.users
        },
        pagination: {
          current_page: params?.page || 1,
          per_page: params?.per_page || 50,
          total: responseData.count || 0,
          last_page: Math.ceil((responseData.count || 0) / (params?.per_page || 50))
        }
      };
    }
    return response;
  },

  /**
   * دریافت اطلاعات کاربر خاص
   * GET /api/admin/users/{phone_number}
   */
  getUserByPhone: async (phoneNumber: string) => {
    return apiRequest<any>(
      `/admin/users/${encodeURIComponent(phoneNumber)}`,
      { method: "GET" }
    );
  },

  /**
   * تغییر وضعیت کاربر
   * PATCH /api/admin/users/update-status
   */
  updateUserStatus: async (phoneNumber: string, status: string) => {
    return apiRequest<any>(
      `/admin/users/update-status`,
      {
        method: "PATCH",
        body: JSON.stringify({ phone_number: phoneNumber, status }),
      }
    );
  },

  /**
   * فعال کردن کاربر
   * POST /api/admin/users/activate
   */
  activateUser: async (phoneNumber: string) => {
    return apiRequest<any>(
      `/admin/users/activate`,
      {
        method: "POST",
        body: JSON.stringify({ phone_number: phoneNumber }),
      }
    );
  },

  /**
   * غیرفعال کردن کاربر
   * POST /api/admin/users/deactivate
   */
  deactivateUser: async (phoneNumber: string) => {
    return apiRequest<any>(
      `/admin/users/deactivate`,
      {
        method: "POST",
        body: JSON.stringify({ phone_number: phoneNumber }),
      }
    );
  },

  /**
   * دریافت توکن‌های در انتظار تایید
   */
  getPendingTokens: async () => {
    const response = await fetch(`${API_BASE_URL}/tokens/pending`);
    if (!response.ok) {
      throw new Error("Failed to fetch pending tokens");
    }
    return response.json();
  },

  /**
   * تایید توکن
   */
  approveToken: async (tokenId: number, approvedBy: string) => {
    const response = await fetch(`${API_BASE_URL}/tokens/${tokenId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ approved_by: approvedBy }),
    });
    if (!response.ok) {
      throw new Error("Failed to approve token");
    }
    return response.json();
  },

  /**
   * رد کردن توکن
   */
  rejectToken: async (tokenId: number) => {
    const response = await fetch(`${API_BASE_URL}/tokens/${tokenId}/reject`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to reject token");
    }
    return response.json();
  },

  /**
   * ذخیره توکن به صورت دستی
   */
  setToken: async (token: string, username: string) => {
    const response = await fetch(`${API_BASE_URL}/token/set`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, username }),
    });
    if (!response.ok) {
      throw new Error("Failed to set token");
    }
    return response.json();
  },

  /**
   * دریافت اطلاعات توکن
   */
  getTokenInfo: async (username: string) => {
    const response = await fetch(
      `${API_BASE_URL}/token/info?username=${encodeURIComponent(username)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch token info");
    }
    return response.json();
  },

  /**
   * حذف توکن کاربر
   */
  deleteToken: async (username: string) => {
    const response = await fetch(`${API_BASE_URL}/token/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      throw new Error("Failed to delete token");
    }
    return response.json();
  },

  /**
   * دریافت توکن decrypt شده کاربر
   */
  getAuthToken: async (username: string) => {
    const response = await fetch(
      `${API_BASE_URL}/auth/token?username=${encodeURIComponent(username)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch auth token");
    }
    return response.json();
  },
};

// Payment API
export const paymentApi = {
  /**
   * پلن‌های اشتراک موجود
   */
  plans: {
    monthly: {
      id: "monthly" as const,
      name: "اشتراک ماهانه",
      price: 300000, // تومان
      duration: 30, // روز
      description: "دسترسی کامل به تمام امکانات برای 30 روز",
    },
    biweekly: {
      id: "biweekly" as const,
      name: "اشتراک دو هفته‌ای",
      price: 200000, // تومان
      duration: 15, // روز
      description: "دسترسی کامل به تمام امکانات برای 15 روز",
    },
  },

  /**
   * ایجاد پیش‌تراکنش پرداخت
   * POST /api/payment/create
   */
  createPayment: async (params: {
    plan_id: "monthly" | "biweekly"; // شناسه پلن
    callback_url?: string; // آدرس callback (اختیاری - بکند default داره)
  }) => {
    // استفاده از callback URL بکند
    const callbackUrl = params.callback_url || 'https://peyvandyar.amintvk.ir/api/payment/callback';

    // بکند مستقیم فیلدها رو برمی‌گردونه (بدون data wrapper)
    const response = await apiRequest<any>("/payment/create", {
      method: "POST",
      body: JSON.stringify({
        plan_id: params.plan_id,
        callback_url: callbackUrl,
      }),
    });
    
    // Response structure: {success, hash_id, pay_url, reference_id, expired_at, plan_id, amount, total_amount}
    return response as {
      success: boolean;
      hash_id?: string;
      pay_url?: string;
      reference_id?: string;
      expired_at?: string;
      plan_id?: string;
      amount?: number;
      total_amount?: number;
      error?: string;
      message?: string;
    };
  },

  /**
   * بررسی وضعیت تراکنش
   * GET /api/payment/status/{hash_id}
   */
  getPaymentStatus: async (hashId: string) => {
    const response = await apiRequest<any>(`/payment/status/${hashId}`, {
      method: "GET",
    });
    
    // Response structure: {success, status, hash_id, amount?, reference_id?, message?}
    return response as {
      success: boolean;
      status?: "success" | "failed" | "pending" | "unverified";
      hash_id?: string;
      amount?: number;
      reference_id?: string;
      message?: string;
      error?: string;
    };
  },

  /**
   * تایید نهایی پرداخت (verify)
   * GET /api/payment/verify?hash_id={hash_id}
   */
  verifyPayment: async (hashId: string) => {
    const response = await apiRequest<any>(`/payment/verify?hash_id=${hashId}`, {
      method: "GET",
    });

    // Response structure: {success, status, hash_id, amount, total_amount, paid_at}
    return response as {
      success: boolean;
      status?: "success" | "failed" | "pending";
      hash_id?: string;
      amount?: number;
      total_amount?: number;
      paid_at?: string;
      message?: string;
      error?: string;
    };
  },
};

// Sync Booths API — اتصال غرفه فرزند با شماره تلفن و سینک محصولات (EMJ-24)
export interface ChildVendorInfo {
  vendor_id: string;
  vendor_title: string;
  vendor_identifier?: string;
  username?: string;
}

export interface SyncStatistics {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  success_rate: string;
  last_sync_at: string | null;
  synced_products_count: number;
  last_24h?: {
    total_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
  };
}

export interface RecentSyncActivity {
  product_name: string;
  status: string;
  error_message: string | null;
  created_at: string;
  time_ago: string;
}

export interface ChildStore {
  relation_id: number;
  child_vendor_id: string;
  child_vendor_info?: ChildVendorInfo;
  sync_rules?: Record<string, unknown>;
  status: string;
  created_at: string;
  relationship_age_days: number;
  sync_statistics?: SyncStatistics;
  recent_sync_activity?: RecentSyncActivity[];
  sync_health?: {
    status: string;
    last_activity: string;
  };
}

export const syncBoothsApi = {
  /**
   * شروع اتصال غرفه فرزند — ارسال کد تایید به شماره تلفن
   * POST /api/sync-booths/initiate
   */
  initiate: async (phoneNumber: string) => {
    const response = await apiRequest<any>("/sync-booths/initiate", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
    return response as { success: boolean; maskedPhone?: string; error?: string };
  },

  /**
   * تایید کد و اتصال غرفه به‌عنوان فرزند
   * POST /api/sync-booths/confirm
   */
  confirm: async (phoneNumber: string, code: string) => {
    const response = await apiRequest<any>("/sync-booths/confirm", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, code }),
    });
    return response as {
      success: boolean;
      relationId?: number;
      childVendor?: { vendorId: string; title: string };
      initialSyncJobId?: string;
      error?: string;
    };
  },

  /**
   * لیست کامل غرفه‌های فرزند با آمار سینک
   * GET /api/parent-child/children/:parentVendorId
   */
  getChildren: async (parentVendorId: number | string) => {
    const response = await apiRequest<any>(`/parent-child/children/${parentVendorId}`, {
      method: "GET",
    });
    return response as {
      success: boolean;
      parent_vendor_id?: string;
      parent_vendor_info?: ChildVendorInfo;
      children?: ChildStore[];
      overall_statistics?: Record<string, unknown>;
      error?: string;
    };
  },

  /**
   * وضعیت سریع سینک
   * GET /api/parent-child/status/:parentVendorId
   */
  getStatus: async (parentVendorId: number | string) => {
    return apiRequest<any>(`/parent-child/status/${parentVendorId}`, {
      method: "GET",
    });
  },

  /**
   * فعالیت اخیر سینک با آمار کامل
   * GET /api/parent-child/activity/:parentVendorId?hours=24&limit=100
   */
  getActivity: async (
    parentVendorId: number | string,
    params?: { hours?: number; limit?: number }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.hours) queryParams.append("hours", params.hours.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const query = queryParams.toString();
    return apiRequest<any>(
      `/parent-child/activity/${parentVendorId}${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  /**
   * لاگ‌های زنده سینک (۲۰ مورد آخر)
   * GET /api/parent-child/live-logs/:parentVendorId
   */
  getLiveLogs: async (parentVendorId: number | string) => {
    return apiRequest<any>(`/parent-child/live-logs/${parentVendorId}`, {
      method: "GET",
    });
  },

  /**
   * حذف یک غرفه فرزند
   * DELETE /api/parent-child/remove-child/:relationId
   */
  removeChild: async (relationId: number) => {
    return apiRequest<any>(`/parent-child/remove-child/${relationId}`, {
      method: "DELETE",
    });
  },

  /**
   * پیگیری وضعیت job های async (کپی اولیه محصولات)
   * GET /api/jobs/:jobId/status
   */
  getJobStatus: async (jobId: string) => {
    const response = await apiRequest<any>(`/jobs/${jobId}/status`, {
      method: "GET",
    });
    return response as {
      success?: boolean;
      status?: string;
      progress?: number;
      [key: string]: unknown;
    };
  },
};

