"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { digikalaApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const POLL_MS = 2500;
const STUCK_AT_ZERO_MS = 3 * 60 * 1000;
export const DIGIKALA_IMPORT_JOB_STORAGE_KEY = "digikala_import_job_id";

type Phase = "queued" | "fetching" | "importing" | "done" | "error";

export type ImportJobSummary = {
  successful_imports?: number;
  failed_imports?: number;
  success_rate?: string;
  products_imported?: number;
  products_failed?: number;
  products_created?: number;
  products_replaced?: number;
  products_duplicated?: number;
  skipped_existing_count?: number;
  import_mode?: string;
  message?: string;
};

type Props = {
  jobId: string;
  onDone?: (summary?: ImportJobSummary) => void;
  onDismiss?: () => void;
  className?: string;
};

function unwrapJob(response: any) {
  return response?.job ?? response?.data?.job ?? response;
}

function parseProgress(job: any): {
  done?: number;
  total?: number;
  percent?: number;
  phase: Phase;
} {
  const progress = job?.progress;
  if (progress === "fetching-catalog") {
    return { phase: "fetching" };
  }

  let done =
    typeof job?.progress_done === "number" ? job.progress_done : undefined;
  let total =
    typeof job?.progress_total === "number" ? job.progress_total : undefined;
  let percent =
    typeof job?.progress_percent === "number"
      ? job.progress_percent
      : undefined;

  if (
    (done == null || total == null) &&
    typeof progress === "string" &&
    progress.includes("/")
  ) {
    const [d, t] = progress.split("/").map(Number);
    if (!Number.isNaN(d) && !Number.isNaN(t)) {
      done = d;
      total = t;
      if (percent == null && t > 0) percent = (d / t) * 100;
    }
  }

  const status = String(job?.status || "").toLowerCase();
  if (status === "pending" && done == null) {
    return { phase: "queued", done, total, percent };
  }

  if (done != null || total != null) {
    return { phase: "importing", done, total, percent };
  }

  return { phase: status === "pending" ? "queued" : "importing" };
}

function phaseLabel(
  phase: Phase,
  done?: number,
  total?: number,
  stuckHint?: boolean
): string {
  if (phase === "queued") return "ایمپورت در صف است…";
  if (phase === "fetching") return "در حال آماده‌سازی لیست کالا…";
  if (phase === "importing") {
    if (stuckHint) {
      return "در صف / در حال آپلود عکس — ممکن است طول بکشد";
    }
    if (done != null && total != null) {
      return `ایمپورت ${done.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")}`;
    }
    return "در حال ایمپورت…";
  }
  if (phase === "done") return "تمام شد";
  return "ایمپورت متوقف شد";
}

function extraCountSuffix(summary?: ImportJobSummary) {
  if (!summary) return "";
  const bits: string[] = [];
  if (summary.products_created)
    bits.push(
      `${Number(summary.products_created).toLocaleString("fa-IR")} جدید`
    );
  if (summary.products_replaced)
    bits.push(
      `${Number(summary.products_replaced).toLocaleString("fa-IR")} جایگزین`
    );
  if (summary.products_duplicated)
    bits.push(
      `${Number(summary.products_duplicated).toLocaleString("fa-IR")} کپی`
    );
  if (summary.skipped_existing_count)
    bits.push(
      `${Number(summary.skipped_existing_count).toLocaleString("fa-IR")} ردشده`
    );
  return bits.length ? ` — ${bits.join("، ")}` : "";
}

export function ImportJobStatusBar({
  jobId,
  onDone,
  onDismiss,
  className,
}: Props) {
  const [phase, setPhase] = useState<Phase>("queued");
  const [done, setDone] = useState<number | undefined>();
  const [total, setTotal] = useState<number | undefined>();
  const [percent, setPercent] = useState<number | undefined>();
  const [summary, setSummary] = useState<ImportJobSummary | undefined>();
  const [errorText, setErrorText] = useState("");
  const [stuckHint, setStuckHint] = useState(false);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zeroSinceRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const clearPoll = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  const finishPersist = () => {
    try {
      localStorage.removeItem(DIGIKALA_IMPORT_JOB_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const tick = useCallback(async () => {
    if (finishedRef.current) return;

    try {
      const response: any = await digikalaApi.getJobStatus(jobId);
      const job = unwrapJob(response);
      const status = String(job?.status || "").toLowerCase();
      const parsed = parseProgress(job);

      setPhase(parsed.phase);
      setDone(parsed.done);
      setTotal(parsed.total);
      setPercent(parsed.percent);

      // اگر progress روی 0/N مانده، پیام صبورانه
      if (
        parsed.phase === "importing" &&
        parsed.done === 0 &&
        (parsed.total ?? 0) > 0
      ) {
        if (zeroSinceRef.current == null) zeroSinceRef.current = Date.now();
        setStuckHint(Date.now() - zeroSinceRef.current >= STUCK_AT_ZERO_MS);
      } else {
        zeroSinceRef.current = null;
        setStuckHint(false);
      }

      if (status === "completed" || status === "success") {
        finishedRef.current = true;
        clearPoll();
        finishPersist();
        const results = job?.results || {};
        const sum: ImportJobSummary = {
          ...(response?.summary || {}),
          products_imported:
            results.products_imported ?? response?.summary?.successful_imports,
          products_failed:
            results.products_failed ?? response?.summary?.failed_imports,
          successful_imports:
            response?.summary?.successful_imports ?? results.products_imported,
          failed_imports:
            response?.summary?.failed_imports ?? results.products_failed,
          success_rate: response?.summary?.success_rate,
          products_created: results.products_created,
          products_replaced: results.products_replaced,
          products_duplicated: results.products_duplicated,
          skipped_existing_count: results.skipped_existing_count,
          import_mode: results.import_mode,
        };
        setSummary(sum);
        setPhase("done");
        onDone?.(sum);
        return;
      }

      if (status === "failed" || status === "error") {
        finishedRef.current = true;
        clearPoll();
        finishPersist();
        const msg = String(job?.error || job?.message || "ایمپورت ناموفق بود");
        setErrorText(msg);
        setPhase("error");
        onDone?.({ message: msg });
        return;
      }

      pollRef.current = setTimeout(() => {
        void tick();
      }, POLL_MS);
    } catch (err: any) {
      finishedRef.current = true;
      clearPoll();
      finishPersist();
      const msg = err?.message || "خطا در پیگیری وضعیت ایمپورت";
      setErrorText(msg);
      setPhase("error");
      onDone?.({ message: msg });
    }
  }, [jobId, onDone]);

  useEffect(() => {
    finishedRef.current = false;
    zeroSinceRef.current = null;
    setPhase("queued");
    setDone(undefined);
    setTotal(undefined);
    setPercent(undefined);
    setSummary(undefined);
    setErrorText("");
    setStuckHint(false);
    void tick();
    return () => clearPoll();
  }, [jobId, tick]);

  const handleDismiss = () => {
    clearPoll();
    // بستن کارت جاب بک‌اند را کنسل نمی‌کند؛ فقط UI را جمع می‌کند
    onDismiss?.();
  };

  const barPercent =
    percent != null && !Number.isNaN(percent)
      ? Math.max(0, Math.min(100, percent))
      : done != null && total != null && total > 0
        ? Math.max(0, Math.min(100, (done / total) * 100))
        : phase === "done"
          ? 100
          : phase === "fetching" || phase === "queued"
            ? 8
            : 0;

  const successCount =
    summary?.successful_imports ?? summary?.products_imported;
  const failCount = summary?.failed_imports ?? summary?.products_failed;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border bg-white p-4 shadow-lg",
        phase === "done" && "border-green-200",
        phase === "error" && "border-red-200",
        phase !== "done" && phase !== "error" && "border-orange-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {phase === "done" ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          ) : phase === "error" ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-500" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">ایمپورت دیجی‌کالا</p>
            <p className="text-xs text-slate-500 truncate">
              {phase === "queued" && "ایمپورت در پس‌زمینه شروع شد"}
              {phase !== "queued" &&
                phaseLabel(phase, done, total, stuckHint)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="بستن"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {phase !== "done" && phase !== "error" && (
        <>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${barPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {done != null && total != null
                ? `${done.toLocaleString("fa-IR")} / ${total.toLocaleString("fa-IR")}`
                : phase === "fetching"
                  ? "آماده‌سازی کاتالوگ"
                  : "در حال پردازش"}
            </span>
            <span>
              {percent != null
                ? `${Number(percent).toLocaleString("fa-IR", {
                    maximumFractionDigits: 1,
                  })}٪`
                : ""}
            </span>
          </div>
        </>
      )}

      {phase === "done" && (
        <p className="text-sm text-green-800">
          تمام شد
          {successCount != null &&
            ` — ${Number(successCount).toLocaleString("fa-IR")} موفق`}
          {failCount != null && Number(failCount) > 0
            ? `، ${Number(failCount).toLocaleString("fa-IR")} ناموفق`
            : ""}
          {extraCountSuffix(summary)}
          {summary?.success_rate ? ` (${summary.success_rate})` : ""}
        </p>
      )}

      {phase === "error" && (
        <p className="text-sm text-red-700">{errorText || "ایمپورت متوقف شد"}</p>
      )}
    </div>
  );
}
