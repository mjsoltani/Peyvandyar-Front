"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api";
import { formatFaDateTime } from "@/lib/admin";
import { AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";

export default function AdminTrialCleanupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const handleRun = async () => {
    if (
      !confirm(
        "کاربرانی که اشتراک‌شان منقضی شده غیرفعال می‌شوند. ادامه می‌دهید؟"
      )
    ) {
      return;
    }
    try {
      setBusy(true);
      setError("");
      setMessage("");
      const response: any = await adminApi.trialCleanup();
      const data = response?.data ?? response;
      setMessage(data?.message || "پاکسازی انجام شد");
      setCount(
        typeof data?.deactivated_users === "number"
          ? data.deactivated_users
          : null
      );
      setTimestamp(data?.timestamp ?? null);
    } catch (err: any) {
      setError(err?.message || "خطا در پاکسازی trial");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">پاکسازی trial</h1>
          <p className="text-sm text-slate-500">
            کاربران منقضی‌شده را is_active=false می‌کند.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div className="text-sm text-green-800">
            <p>{message}</p>
            {count != null && (
              <p className="mt-1">
                غیرفعال‌شده: {count.toLocaleString("fa-IR")}
              </p>
            )}
            {timestamp && (
              <p className="mt-1 text-green-700">
                {formatFaDateTime(timestamp)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleRun()}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          اجرای پاکسازی
        </button>
      </div>
    </>
  );
}
