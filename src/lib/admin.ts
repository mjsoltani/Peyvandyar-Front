import { userApi, ApiError } from "./api";

export type SuperAdminUser = {
  id?: number;
  phone_number?: string;
  role?: string;
  is_active?: boolean;
  vendor_id?: number | string;
  vendor_title?: string;
  [key: string]: unknown;
};

export type SuperAdminGate =
  | { status: "unauthenticated" }
  | { status: "inactive"; user?: SuperAdminUser }
  | { status: "forbidden" }
  | { status: "ok"; user: SuperAdminUser };

export function unwrapUserStatus(response: unknown): SuperAdminUser | null {
  const data = response as Record<string, unknown> | null;
  const user =
    (data?.user as SuperAdminUser | undefined) ??
    ((data?.data as Record<string, unknown> | undefined)?.user as
      | SuperAdminUser
      | undefined);
  return user ?? null;
}

export async function checkSuperAdmin(): Promise<SuperAdminGate> {
  try {
    const response = await userApi.getStatus();
    const user = unwrapUserStatus(response);
    if (!user) return { status: "forbidden" };
    if (user.is_active === false) return { status: "inactive", user };
    if (user.role !== "superadmin") return { status: "forbidden" };
    return { status: "ok", user };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.statusCode === 403) return { status: "forbidden" };
      if (err.statusCode === 401 || err.isAuthError) {
        return { status: "unauthenticated" };
      }
    }
    return { status: "unauthenticated" };
  }
}

export function formatFaDateTime(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const SUBSCRIPTION_LABELS: Record<string, string> = {
  trial: "آزمایشی",
  free: "رایگان",
  monthly: "ماهانه",
  biweekly: "دو هفته‌ای",
  premium: "ویژه",
};

export const SUBSCRIPTION_TYPES = [
  "trial",
  "free",
  "monthly",
  "biweekly",
  "premium",
] as const;
