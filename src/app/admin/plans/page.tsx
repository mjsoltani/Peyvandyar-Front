"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type CatalogPlan } from "@/lib/api";
import { formatFaDateTime } from "@/lib/admin";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Draft = {
  label: string;
  duration_days: string;
  amount_toman: string;
  is_active: boolean;
  sort_order: string;
};

function toDraft(plan: CatalogPlan): Draft {
  const toman =
    plan.amount_toman ?? (plan.amount != null ? Math.round(plan.amount / 10) : 0);
  return {
    label: plan.label || "",
    duration_days: String(plan.duration_days ?? ""),
    amount_toman: String(toman),
    is_active: plan.is_active !== false,
    sort_order: String(plan.sort_order ?? 0),
  };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await adminApi.listPlans();
      const list = Array.isArray(response?.plans) ? response.plans : [];
      const sorted = [...list].sort(
        (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      );
      setPlans(sorted);
      const next: Record<string, Draft> = {};
      sorted.forEach((plan: CatalogPlan) => {
        next[plan.id] = toDraft(plan);
      });
      setDrafts(next);
    } catch (err: any) {
      setError(err?.message || "خطا در دریافت پلن‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchDraft = (id: string, partial: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? toDraft(plans.find((p) => p.id === id)!)), ...partial },
    }));
  };

  const handleSave = async (plan: CatalogPlan) => {
    const draft = drafts[plan.id];
    if (!draft) return;
    const duration = Number(draft.duration_days);
    const toman = Number(draft.amount_toman);
    const sortOrder = Number(draft.sort_order);
    if (!draft.label.trim()) {
      setError("عنوان خالی است");
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("مدت باید عدد بزرگ‌تر از صفر باشد");
      return;
    }
    if (!Number.isFinite(toman) || toman <= 0) {
      setError("مبلغ تومان باید عدد بزرگ‌تر از صفر باشد");
      return;
    }
    try {
      setSavingId(plan.id);
      setError("");
      setSuccess("");
      await adminApi.updatePlan(plan.id, {
        label: draft.label.trim(),
        duration_days: duration,
        amount: Math.round(toman * 10),
        is_active: draft.is_active,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      });
      setSuccess(`پلن ${plan.id} ذخیره شد`);
      await load();
    } catch (err: any) {
      setError(err?.message || "خطا در ذخیره پلن");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">پلن‌های اشتراک</h1>
            <p className="text-sm text-slate-500">
              مبلغ را به تومان وارد کنید؛ به درگاه به‌صورت ریال (×۱۰) ارسال می‌شود.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          بروزرسانی
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <p className="text-xs text-slate-500 mb-4">
        سفارش‌های از قبل ساخته‌شده با مبلغ همان لحظه تسویه می‌شوند؛ قیمت جدید فقط برای خریدهای بعدی است.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : plans.length === 0 ? (
        <p className="text-sm text-slate-500">پلنی پیدا نشد.</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const draft = drafts[plan.id] || toDraft(plan);
            const rial = Math.round(Number(draft.amount_toman || 0) * 10);
            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800" dir="ltr">
                      {plan.id}
                    </p>
                    <p className="text-xs text-slate-400">
                      آخرین تغییر: {formatFaDateTime(plan.updated_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs",
                      draft.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {draft.is_active ? "فعال در فروش" : "غیرفعال"}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">عنوان</label>
                    <input
                      value={draft.label}
                      onChange={(e) => patchDraft(plan.id, { label: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      مدت (روز)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draft.duration_days}
                      onChange={(e) =>
                        patchDraft(plan.id, { duration_days: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      مبلغ (تومان)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draft.amount_toman}
                      onChange={(e) =>
                        patchDraft(plan.id, { amount_toman: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-slate-400 mt-1" dir="ltr">
                      = {rial.toLocaleString("fa-IR")} ریال
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ترتیب</label>
                    <input
                      type="number"
                      value={draft.sort_order}
                      onChange={(e) =>
                        patchDraft(plan.id, { sort_order: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) =>
                        patchDraft(plan.id, { is_active: e.target.checked })
                      }
                      className="accent-orange-500"
                    />
                    نمایش در صفحه خرید
                  </label>
                  <button
                    type="button"
                    disabled={savingId === plan.id}
                    onClick={() => void handleSave(plan)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {savingId === plan.id && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    ذخیره
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
