// API service for Peyvandyar backend
import { getAuthToken } from "./auth";

const API_BASE_URL = "https://peyvandyar.amintvk.ir/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isAuthError: boolean = false
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
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // اگر response JSON نبود، از status text استفاده کن
        errorMessage = response.statusText || errorMessage;
      }
      
      // برای خطاهای احراز هویت، پیغام مناسب‌تر
      if (isAuthError) {
        errorMessage = "دسترسی غیرمجاز - لطفا مجددا وارد شوید";
      }
      
      throw new ApiError(errorMessage, response.status, isAuthError);
    }

    // چک کردن که response خالی نباشد
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
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
  copyProductFromBasalam: async (productId: string | number) => {
    return apiRequest<any>(`/product/${productId}/copy`, { method: "POST" });
  },
};

// User/Profile API
export const userApi = {
  /**
   * دریافت اطلاعات کاربر فعلی
   */
  getProfile: async () => {
    return apiRequest<any>("/me", { method: "GET" }); // طبق API-ENDPOINTS.json endpoint /api/me است
  },
  
  /**
   * دریافت اطلاعات کاربر (از global token)
   */
  getUserInfo: async () => {
    return apiRequest<any>("/user", { method: "GET" });
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

