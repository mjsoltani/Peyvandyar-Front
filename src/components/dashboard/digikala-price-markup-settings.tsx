"use client";

import { useCallback, useEffect, useState } from "react";
import {
  digikalaApi,
  clampDigikalaMarkup,
  DIGIKALA_MARKUP_MAX,
  DIGIKALA_MARKUP_MIN,
} from "@/lib/api";
import { Loader2, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** مقدار کنترل‌شده؛ اگر ندهید کامپوننت خودش hydrate می‌کند */
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  /** بعد از hydrate/save موفق */
  onLoaded?: (value: number) => void;
};

export function DigikalaPriceMarkupSettings({
  value: controlledValue,
  onChange,
  disabled,
  className,
  onLoaded,
}: Props) {
  const isControlled = controlledValue != null;
  const [internalValue, setInternalValue] = useState(0);
  const [savedValue, setSavedValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const value = isControlled ? controlledValue : internalValue;

  const setValue = (next: number) => {
    const clamped = clampDigikalaMarkup(next);
    if (!isControlled) setInternalValue(clamped);
    onChange?.(clamped);
  };

  const hydrate = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response: any = await digikalaApi.getSyncRule();
      const data = response?.data ?? response;
      const percent = clampDigikalaMarkup(
        Number(data?.price_markup_percent ?? data?.rule?.price_markup_percent ?? 0)
      );
      setSavedValue(percent);
      if (!isControlled) setInternalValue(percent);
      onChange?.(percent);
      onLoaded?.(percent);
    } catch (err: any) {
      setMessage({
        type: "err",
        text: err?.message || "خطا در دریافت تنظیمات قیمت",
      });
    } finally {
      setLoading(false);
    }
  }, [isControlled, onChange, onLoaded]);

  useEffect(() => {
    void hydrate();
    // فقط یک‌بار هنگام mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const percent = clampDigikalaMarkup(Number(value));
    try {
      setSaving(true);
      setMessage(null);
      const response: any = await digikalaApi.updateSyncRule(percent);
      const data = response?.data ?? response;
      if (data?.success === false) {
        setMessage({
          type: "err",
          text: data.message || data.error || "ذخیره ناموفق بود",
        });
        return;
      }
      const applied = clampDigikalaMarkup(
        Number(data?.price_markup_percent ?? percent)
      );
      setSavedValue(applied);
      setValue(applied);
      setMessage({
        type: "ok",
        text: `مارک‌آپ ${applied.toLocaleString("fa-IR")}٪ ذخیره شد`,
      });
    } catch (err: any) {
      setMessage({
        type: "err",
        text: err?.message || "خطا در ذخیره مارک‌آپ",
      });
    } finally {
      setSaving(false);
    }
  };

  const dirty = Number(value) !== Number(savedValue);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <Percent className="w-5 h-5 text-orange-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">
            افزایش قیمت نسبت به دیجی‌کالا (%)
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            هر بار که سینک کنید، قیمت باسلام از روی قیمت فعلی دیجی با این درصد
            محاسبه می‌شود. تغییر درصد محصولات قبلی را فوری عوض نمی‌کند.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-slate-500 mb-1">
            درصد مارک‌آپ ({DIGIKALA_MARKUP_MIN} تا {DIGIKALA_MARKUP_MAX})
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            min={DIGIKALA_MARKUP_MIN}
            max={DIGIKALA_MARKUP_MAX}
            value={value}
            disabled={disabled || loading || saving}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "" || raw === "-") {
                setValue(0);
                return;
              }
              setValue(Number(raw));
            }}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 disabled:bg-slate-50"
            dir="ltr"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || loading || saving || !dirty}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-sm font-bold inline-flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              ذخیره…
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              بارگذاری…
            </>
          ) : (
            "ذخیره قانون"
          )}
        </button>
      </div>

      {value !== 0 && (
        <p className="text-xs text-slate-500" dir="ltr">
          مثال: دیجی ۱۰۰٬۰۰۰ ← باسلام{" "}
          {Math.round(100000 * (1 + Number(value) / 100)).toLocaleString("fa-IR")}{" "}
          تومان
        </p>
      )}

      {message && (
        <p
          className={cn(
            "text-xs",
            message.type === "ok" ? "text-green-700" : "text-red-600"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
