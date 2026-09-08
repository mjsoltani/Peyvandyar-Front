"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api";
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncUserRow = {
  user_id?: number;
  vendor_id?: string;
  success?: boolean;
  total?: number;
  updated?: number;
  unchanged?: number;
  failed?: number;
  error?: string;
};

function AdminDigikalaSyncPage() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("user_id") || "";

  const [scope, setScope] = useState<"all" | "one">(presetId ? "one" : "all");
  const [userId, setUserId] = useState(presetId);
  const [fields, setFields] = useState<"price" | "stock" | "all">("price");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<SyncUserRow[]>([]);
  const [summary, setSummary] = useState<{
    users_total?: number;
    users_synced?: number;
    users_failed?: number;
  }>({});

  const canRun = useMemo(() => {
    if (running) return false;
    if (scope === "one" && !userId.trim()) return false;
    return true;
  }, [running, scope, userId]);

  const handleRun = async () => {
    try {
      setRunning(true);
      setError("");
      setMessage("");
      setRows([]);
      const body: { user_id?: number; fields: string } = { fields };
      if (scope === "one") {
        const id = Number(userId);
        if (Number.isNaN(id)) {
          setError("user_id نامعتبر است");
          setRunning(false);
          return;
        }
        body.user_id = id;
      }
      const response: any = await adminApi.digikalaSync(body);
      const data = response?.data ?? response;
      setMessage(data?.message || "سینک تمام شد");
      setSummary({
        users_total: data?.users_total,
        users_synced: data?.users_synced,
        users_failed: data?.users_failed,
      });
      setRows(Array.isArray(data?.users) ? data.users : []);
    } catch (err: any) {
      setError(err?.message || "خطا در سینک دیجی‌کالا");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">سینک دیجی‌کالا</h1>
          <p className="text-sm text-slate-500">
            ممکن است چند دقیقه طول بکشد؛ صفحه را نبندید.
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
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={scope === "all"}
              onChange={() => setScope("all")}
              className="accent-orange-500"
            />
            همه کاربران دارای لینک
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={scope === "one"}
              onChange={() => setScope("one")}
              className="accent-orange-500"
            />
            یک کاربر
          </label>
        </div>
        {scope === "one" && (
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user_id"
            dir="ltr"
            className="w-full max-w-xs px-3 py-2.5 border rounded-xl text-sm"
          />
        )}
        <div>
          <p className="text-xs text-slate-500 mb-2">فیلدها</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {(["price", "stock", "all"] as const).map((item) => (
              <label key={item} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={fields === item}
                  onChange={() => setFields(item)}
                  className="accent-orange-500"
                />
                {item === "price"
                  ? "قیمت"
                  : item === "stock"
                    ? "موجودی"
                    : "هر دو"}
              </label>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!canRun}
          onClick={() => void handleRun()}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2"
        >
          {running && <Loader2 className="w-4 h-4 animate-spin" />}
          {running ? "در حال سینک…" : "اجرای سینک"}
        </button>
      </div>

      {(summary.users_total != null || rows.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b text-sm text-slate-600">
            {summary.users_synced != null && (
              <span>
                موفق: {Number(summary.users_synced).toLocaleString("fa-IR")}
              </span>
            )}
            {summary.users_failed != null && Number(summary.users_failed) > 0 && (
              <span className="mr-3 text-red-600">
                ناموفق: {Number(summary.users_failed).toLocaleString("fa-IR")}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-right">user_id</th>
                  <th className="px-4 py-2 text-right">وضعیت</th>
                  <th className="px-4 py-2 text-right">به‌روز</th>
                  <th className="px-4 py-2 text-right">خطا</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, idx) => (
                  <tr key={`${row.user_id}-${idx}`}>
                    <td className="px-4 py-2" dir="ltr">
                      {row.user_id ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs",
                          row.success
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {row.success ? "موفق" : "ناموفق"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {row.updated != null
                        ? Number(row.updated).toLocaleString("fa-IR")
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-red-600">{row.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminDigikalaSyncRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <AdminDigikalaSyncPage />
    </Suspense>
  );
}
