"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api";
import { formatFaDateTime } from "@/lib/admin";
import { AlertCircle, Archive, CheckCircle, Loader2 } from "lucide-react";

const POLL_MS = 2500;

function unwrapJob(response: any) {
  return response?.job ?? response?.data?.job ?? response;
}

function AdminArchiveVendorPage() {
  const searchParams = useSearchParams();
  const [vendorId, setVendorId] = useState(searchParams.get("vendor_id") || "");
  const [vendorToken, setVendorToken] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState("");
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  const loadJobs = useCallback(async (id: string) => {
    try {
      const response: any = await adminApi.archiveJobs(id);
      const list =
        response?.jobs ??
        response?.data?.jobs ??
        response?.basalam_jobs ??
        [];
      setJobs(Array.isArray(list) ? list : []);
    } catch {
      /* لیست جاب اختیاری است */
    }
  }, []);

  useEffect(() => {
    return () => clearPoll();
  }, []);

  const pollJob = async (id: string) => {
    clearPoll();
    const tick = async () => {
      try {
        const response: any = await adminApi.jobStatus(id);
        const job = unwrapJob(response);
        const status = String(job?.status || "").toLowerCase();
        const progress = job?.progress || {};
        setJobStatus(status);
        if (typeof progress.products_submitted === "number") {
          setSubmitted(progress.products_submitted);
        }
        if (status === "completed" || status === "success") {
          setMessage("جاب آرشیو تمام شد");
          setBusy(false);
          return;
        }
        if (status === "failed" || status === "error") {
          setError(String(job?.error || job?.message || "جاب ناموفق بود"));
          setBusy(false);
          return;
        }
        pollRef.current = setTimeout(tick, POLL_MS);
      } catch (err: any) {
        setError(err?.message || "خطا در پیگیری جاب");
        setBusy(false);
      }
    };
    await tick();
  };

  const handleRun = async () => {
    if (!vendorId.trim()) {
      setError("vendor_id لازم است");
      return;
    }
    if (
      !confirm(
        "همه محصولات این غرفه غیرفعال می‌شوند (وضعیت منتشرنشده). ادامه می‌دهید؟"
      )
    ) {
      return;
    }
    try {
      setBusy(true);
      setError("");
      setMessage("");
      setJobId(null);
      setJobStatus("");
      setSubmitted(null);
      const body: {
        vendor_id: string;
        vendor_token?: string;
        only_published?: boolean;
      } = {
        vendor_id: vendorId.trim(),
        only_published: onlyPublished,
      };
      if (vendorToken.trim()) body.vendor_token = vendorToken.trim();
      const response: any = await adminApi.archiveVendor(body);
      const data = response?.data ?? response;
      const returnedJob = data?.job_id || data?.jobId;
      if (returnedJob) {
        setJobId(String(returnedJob));
        setMessage("جاب در صف قرار گرفت");
        await pollJob(String(returnedJob));
      } else {
        setMessage(data?.message || "درخواست آرشیو ارسال شد");
        setBusy(false);
      }
      await loadJobs(vendorId.trim());
    } catch (err: any) {
      setError(err?.message || "خطا در آرشیو غرفه");
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
          <Archive className="w-6 h-6 text-slate-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">آرشیو غرفه</h1>
          <p className="text-sm text-slate-500">
            محصولات published به وضعیت منتشرنشده (۳۷۹۰) می‌روند.
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
        <div>
          <label className="block text-xs text-slate-500 mb-1">vendor_id</label>
          <input
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            dir="ltr"
            className="w-full max-w-md px-3 py-2.5 border rounded-xl text-sm"
            placeholder="1563824"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            توکن غرفه (اختیاری، اگر در دیتابیس نباشد)
          </label>
          <input
            value={vendorToken}
            onChange={(e) => setVendorToken(e.target.value)}
            dir="ltr"
            className="w-full max-w-md px-3 py-2.5 border rounded-xl text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyPublished}
            onChange={(e) => setOnlyPublished(e.target.checked)}
            className="accent-orange-500"
          />
          فقط منتشرشده‌ها
        </label>
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRun()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            غیرفعال‌کردن محصولات غرفه
          </button>
        </div>
        {jobId && (
          <div className="text-sm text-slate-600">
            جاب: <span dir="ltr">{jobId}</span>
            {jobStatus && ` — ${jobStatus}`}
            {submitted != null &&
              ` — ارسال‌شده: ${submitted.toLocaleString("fa-IR")}`}
            {busy && (
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden max-w-md">
                <div className="h-full w-1/3 bg-orange-500 animate-pulse" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">جاب‌های باسلام این غرفه</h2>
          <button
            type="button"
            onClick={() => vendorId.trim() && void loadJobs(vendorId.trim())}
            className="text-sm text-orange-700 hover:underline"
          >
            بارگذاری لیست
          </button>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">لیستی بارگذاری نشده یا خالی است.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {jobs.map((job, idx) => (
              <li
                key={String(job.id ?? job.job_id ?? idx)}
                className="border border-slate-100 rounded-lg p-3"
              >
                <span dir="ltr">{String(job.id ?? job.job_id ?? "—")}</span>
                {job.status && ` — ${job.status}`}
                {job.created_at && ` — ${formatFaDateTime(job.created_at)}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function AdminArchiveVendorRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <AdminArchiveVendorPage />
    </Suspense>
  );
}
