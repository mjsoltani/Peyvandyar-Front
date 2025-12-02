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

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // چک کردن که در client-side هستیم
  if (typeof window === "undefined") {
    throw new Error("API requests can only be made from client-side");
  }

  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
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
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // اگر response JSON نبود، از status text استفاده کن
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
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
    return apiRequest<any>(`/products/${id}`, {
      method: "PATCH", // طبق API-ENDPOINTS.json باید PATCH باشد
      body: JSON.stringify(data),
    });
  },

  /**
   * ویرایش انبوه محصولات
   */
  bulkUpdateProducts: async (products: Array<{ id: number; [key: string]: any }>) => {
    // طبق API-ENDPOINTS.json باید آرایه products ارسال شود
    return apiRequest<any>("/products/batch-update", {
      method: "PATCH", // طبق API-ENDPOINTS.json باید PATCH باشد
      body: JSON.stringify({
        products,
      }),
    });
  },

  /**
   * حذف محصول
   */
  deleteProduct: async (id: number) => {
    return apiRequest<any>(`/products/${id}`, { method: "DELETE" });
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

