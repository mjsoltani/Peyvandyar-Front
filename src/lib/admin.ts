// Admin authentication and authorization
import { userApi } from "./api";

// Feature flag برای migration به backend roles
const USE_BACKEND_ROLES = false; // وقتی backend آماده شد → true

// Temporary admin credentials (تا زمانی که backend role-based auth رو پیاده کنه)
const TEMP_ADMINS = [
  { username: "Mohammad Javad", password: "p3yv@ndy@r" },
  { username: "Amin", password: "p3yv@ndy@r" },
];

const ADMIN_SESSION_KEY = "peyvandyar_admin_session";

export interface AdminAuth {
  isAuthenticated: boolean;
  username: string;
  authMethod: "local" | "backend";
}

export interface AdminSession {
  username: string;
  loginTime: number;
  expiresAt: number;
}

/**
 * Login admin با username و password (موقت)
 */
export function loginAdmin(username: string, password: string): boolean {
  const admin = TEMP_ADMINS.find(
    (a) => a.username === username && a.password === password
  );

  if (!admin) {
    return false;
  }

  // ذخیره session (7 روز اعتبار)
  const session: AdminSession = {
    username: admin.username,
    loginTime: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  return true;
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

/**
 * دریافت session admin از localStorage
 */
export function getLocalAdminSession(): AdminSession | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionStr) return null;

    const session: AdminSession = JSON.parse(sessionStr);

    // چک کردن انقضا
    if (Date.now() > session.expiresAt) {
      logoutAdmin();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * چک کردن authentication admin
 */
export async function checkAdminAuth(): Promise<AdminAuth> {
  if (USE_BACKEND_ROLES) {
    // Backend role check (آینده)
    try {
      const userResponse = await userApi.getProfile();
      if (userResponse.success && (userResponse as any).user) {
        const user = (userResponse as any).user;
        // فرض می‌کنیم backend یه فیلد role اضافه می‌کنه
        const isAdmin = user.role === "admin";
        return {
          isAuthenticated: isAdmin,
          username: user.username || "",
          authMethod: "backend",
        };
      }
    } catch {
      return {
        isAuthenticated: false,
        username: "",
        authMethod: "backend",
      };
    }
  }

  // Local auth check (فعلی)
  const localAdmin = getLocalAdminSession();
  return {
    isAuthenticated: !!localAdmin,
    username: localAdmin?.username || "",
    authMethod: "local",
  };
}

/**
 * چک سریع admin بودن (بدون async)
 */
export function isAdminLoggedIn(): boolean {
  if (USE_BACKEND_ROLES) {
    // در حالت backend باید از checkAdminAuth استفاده بشه
    return false;
  }
  return !!getLocalAdminSession();
}
