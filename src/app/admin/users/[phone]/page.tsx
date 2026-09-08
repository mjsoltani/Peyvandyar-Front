"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminApi,
  type AdminUser,
  type SubscriptionStatus,
  type SubscriptionType,
} from "@/lib/api";
import {
  formatFaDateTime,
  SUBSCRIPTION_LABELS,
  SUBSCRIPTION_TYPES,
} from "@/lib/admin";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function StatusBadge({
  user,
  subscription,
}: {
  user: AdminUser | null;
  subscription: SubscriptionStatus | null;
}) {
  if (user && user.is_active === false) {
    return (
      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
        غیرفعال
      </span>
    );
  }
  if (subscription?.is_expired) {
    return (
      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
        منقضی
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">
      فعال
    </span>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ phone: string }>();
  const phone = decodeURIComponent(params.phone || "");

  const [user, setUser] = useState<AdminUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subType, setSubType] = useState<string>("monthly");
  const [expiresLocal, setExpiresLocal] = useState("");
  const [premiumDays, setPremiumDays] = useState(3);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await adminApi.getUser(phone);
      const nextUser = (response?.user ?? null) as AdminUser | null;
      const nextSub = (response?.subscription ?? null) as SubscriptionStatus | null;
      if (!nextUser) {
        setError(response?.error || "کاربر پیدا نشد");
        setUser(null);
        setSubscription(null);
        return;
      }
      setUser(nextUser);
      setSubscription(nextSub);
      setSubType(
        String(nextSub?.subscription_type || nextUser.subscription_type || "monthly")
      );
      setExpiresLocal(
        toDatetimeLocal(nextSub?.expires_at || nextUser.expires_at)
      );
    } catch (err: any) {
      setError(err?.message || "خطا در دریافت کاربر");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (ok: string) => {
    setSuccess(ok);
    setError("");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleToggleActive = async () => {
    if (!user) return;
    const next = !user.is_active;
    if (
      !next &&
      !confirm(`کاربر ${phone} غیرفعال شود؟`)
    ) {
      return;
    }
    try {
      setBusy(true);
      await adminApi.setActive(phone, next);
      flash(next ? "کاربر فعال شد" : "کاربر غیرفعال شد");
      await load();
    } catch (err: any) {
      setError(err?.message || "خطا در تغییر وضعیت");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (!subType && !expiresLocal) {
      setError("نوع اشتراک یا تاریخ انقضا را مشخص کنید");
      return;
    }
    try {
      setBusy(true);
      const body: { subscription_type?: string; expires_at?: string | null } = {};
      if (subType) body.subscription_type = subType;
      body.expires_at = fromDatetimeLocal(expiresLocal);
      const response: any = await adminApi.updateSubscription(phone, body);
      if (response?.subscription) setSubscription(response.subscription);
      flash("اشتراک ذخیره شد");
      await load();
    } catch (err: any) {
      setError(err?.message || "خطا در ذخیره اشتراک");
    } finally {
      setBusy(false);
    }
  };

  const handleExtend = async (
    subscriptionType: SubscriptionType,
    days?: number
  ) => {
    try {
      setBusy(true);
      await adminApi.extendSubscription({
        phoneNumber: phone,
        subscriptionType,
        days,
      });
      flash("تمدید انجام شد");
      await load();
    } catch (err: any) {
      setError(err?.message || "خطا در تمدید");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-4 text-sm"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به لیست
      </Link>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {!user ? (
        <p className="text-slate-500">کاربر پیدا نشد.</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-800" dir="ltr">
                    {phone}
                  </h1>
                  <StatusBadge user={user} subscription={subscription} />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {user.vendor_title || "بدون نام غرفه"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void load()}
                  className="px-3 py-2 border rounded-xl text-sm inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  تازه‌سازی
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleToggleActive()}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium",
                    user.is_active
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  )}
                >
                  {user.is_active ? "غیرفعال کردن" : "فعال کردن"}
                </button>
              </div>
            </div>

            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">شناسه</dt>
                <dd className="text-slate-800">{user.id}</dd>
              </div>
              <div>
                <dt className="text-slate-400">نقش</dt>
                <dd className="text-slate-800">{user.role || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">آیدی غرفه باسلام</dt>
                <dd className="text-slate-800" dir="ltr">
                  {user.basalam_vendor_id ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">توکن فعال</dt>
                <dd className="text-slate-800">
                  {Number(user.token_count || 0).toLocaleString("fa-IR")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">آخرین فعالیت</dt>
                <dd>{formatFaDateTime(user.last_activity_at)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">عضویت</dt>
                <dd>{formatFaDateTime(user.created_at)}</dd>
              </div>
            </dl>

            {subscription?.display && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm">
                <p className="font-medium text-slate-800">
                  {subscription.display.status_text}
                </p>
                <p className="text-slate-500 mt-1">
                  {subscription.display.remaining_text}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {user.id != null && (
                <Link
                  href={`/admin/tools/digikala-sync?user_id=${user.id}`}
                  className="text-orange-700 hover:underline"
                >
                  سینک دیجی‌کالا این کاربر
                </Link>
              )}
              {user.basalam_vendor_id != null && (
                <Link
                  href={`/admin/tools/archive-vendor?vendor_id=${user.basalam_vendor_id}`}
                  className="text-orange-700 hover:underline"
                >
                  آرشیو محصولات غرفه
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-800">تنظیم اشتراک / تاریخ</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">نوع</label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  {SUBSCRIPTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SUBSCRIPTION_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  تاریخ انقضا (خالی = بدون انقضا)
                </label>
                <input
                  type="datetime-local"
                  value={expiresLocal}
                  onChange={(e) => setExpiresLocal(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSaveSubscription()}
              className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              ذخیره اشتراک
            </button>
            <p className="text-xs text-slate-400">
              تاریخ در فرم میلادی است؛ در بقیه UI شمسی نمایش داده می‌شود.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-800 mb-3">تمدید نسبی از الان</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleExtend("trial")}
                className="px-3 py-2 border rounded-xl text-sm hover:border-orange-300"
              >
                +۳ روز آزمایشی
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleExtend("monthly")}
                className="px-3 py-2 border rounded-xl text-sm hover:border-orange-300"
              >
                +۳۰ روز ماهانه
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleExtend("biweekly")}
                className="px-3 py-2 border rounded-xl text-sm hover:border-orange-300"
              >
                +۱۵ روز دو هفته
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleExtend("free")}
                className="px-3 py-2 border rounded-xl text-sm hover:border-orange-300"
              >
                رایگان
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Premium (روز)
                </label>
                <input
                  type="number"
                  min={1}
                  value={premiumDays}
                  onChange={(e) => setPremiumDays(Number(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleExtend("premium", premiumDays)}
                className="px-3 py-2 bg-orange-500 text-white rounded-xl text-sm"
              >
                اعمال Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
