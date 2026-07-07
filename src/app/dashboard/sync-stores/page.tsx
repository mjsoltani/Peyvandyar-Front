"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { userApi, syncBoothsApi, ApiError, type ChildStore } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Phone,
  ShieldCheck,
  RefreshCw,
  Package,
  Clock,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

interface ParentInfo {
  basalam_vendor_id: number;
  vendor_title: string;
}

type AddStep = "phone" | "code" | "success";

function toFarsiNumber(n: number | string): string {
  return Number(n).toLocaleString("fa-IR");
}

function formatJalali(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "—";
  }
}

// نگاشت خطاهای API اتصال غرفه به پیام فارسی
function mapInitiateError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "BOOTH_NOT_REGISTERED") {
      return "این شماره در پیوندیار ثبت نشده است. صاحب غرفه مقصد ابتدا باید در پیوندیار ثبت‌نام کند.";
    }
    if (err.code === "RATE_LIMITED") {
      const wait = err.retryAfter
        ? ` لطفا ${toFarsiNumber(Math.ceil(err.retryAfter / 60) || 1)} دقیقه دیگر تلاش کنید.`
        : " لطفا کمی بعد دوباره تلاش کنید.";
      return `تعداد درخواست‌های ارسال کد بیش از حد مجاز است.${wait}`;
    }
    if (err.statusCode === 400) {
      return "شماره موبایل وارد شده معتبر نیست.";
    }
    return err.message;
  }
  return "خطای نامشخص در ارسال کد تایید";
}

function mapConfirmError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "NO_PENDING_LINK") {
      return "درخواست اتصالی برای این شماره ثبت نشده است. لطفا از ابتدا شروع کنید.";
    }
    if (err.code === "CHILD_TOKEN_EXPIRED") {
      return "توکن غرفه مقصد در پیوندیار معتبر نیست. صاحب غرفه باید دوباره وارد پیوندیار شود.";
    }
    if (err.code === "ALREADY_LINKED" || err.statusCode === 409) {
      return "این غرفه از قبل به‌عنوان غرفه فرزند متصل شده است.";
    }
    if (err.statusCode === 410) {
      return "کد تایید منقضی شده است. لطفا کد جدید دریافت کنید.";
    }
    if (err.statusCode === 429) {
      return "تعداد تلاش‌های مجاز به پایان رسیده است. لطفا کد جدید دریافت کنید.";
    }
    if (err.statusCode === 400) {
      return "کد وارد شده اشتباه است.";
    }
    return err.message;
  }
  return "خطای نامشخص در تایید کد";
}

function HealthBadge({ health }: { health?: ChildStore["sync_health"] }) {
  const status = health?.status || "active";
  const config =
    {
      healthy: { label: "سالم", cls: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
      warning: { label: "هشدار", cls: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
      critical: { label: "نیاز به توجه", cls: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
    }[status] || { label: "فعال", cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
      {health?.last_activity && <span className="font-normal opacity-80">· {health.last_activity}</span>}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-800 font-bold text-xs">{value}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-8 bg-slate-100 rounded-lg mb-2" />
      ))}
    </div>
  );
}

export default function SyncStoresPage() {
  const router = useRouter();

  const [parent, setParent] = useState<ParentInfo | null>(null);
  const [children, setChildren] = useState<ChildStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // فلوی افزودن غرفه فرزند
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newChildTitle, setNewChildTitle] = useState("");

  // پیگیری job کپی اولیه محصولات
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const jobPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // حذف غرفه فرزند
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<ChildStore | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileRes = await userApi.getProfile();
      const user = (
        profileRes as { user?: { basalam_vendor_id: number; vendor_title?: string } }
      )?.user;
      if (!profileRes.success || !user?.basalam_vendor_id) {
        throw new Error("اطلاعات غرفه شما دریافت نشد");
      }
      setParent({
        basalam_vendor_id: user.basalam_vendor_id,
        vendor_title: user.vendor_title || "",
      });

      const childrenRes = await syncBoothsApi.getChildren(user.basalam_vendor_id);
      if (childrenRes.success && Array.isArray(childrenRes.children)) {
        setChildren(childrenRes.children);
      } else {
        setChildren([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/");
      return;
    }
    fetchData();
  }, [router, fetchData]);

  // پیگیری وضعیت job کپی اولیه — هر ۳ ثانیه تا اتمام
  useEffect(() => {
    if (!syncJobId) return;

    const poll = async () => {
      try {
        const res = await syncBoothsApi.getJobStatus(syncJobId);
        const status = String(
          res.status || (res as { job?: { status?: string } })?.job?.status || ""
        );
        setJobStatus(status);
        if (["completed", "success", "failed", "error"].includes(status)) {
          if (jobPollRef.current) clearInterval(jobPollRef.current);
          jobPollRef.current = null;
        }
      } catch {
        // خطای موقت در پیگیری job مانع فلو نمی‌شود
      }
    };

    poll();
    jobPollRef.current = setInterval(poll, 3000);
    return () => {
      if (jobPollRef.current) clearInterval(jobPollRef.current);
      jobPollRef.current = null;
    };
  }, [syncJobId]);

  const resetAddFlow = () => {
    setAddStep("phone");
    setPhoneNumber("");
    setMaskedPhone("");
    setCode("");
    setAddError(null);
    setNewChildTitle("");
    setSyncJobId(null);
    setJobStatus(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetAddFlow();
    // بعد از اتصال موفق، لیست را تازه کن
    if (addStep === "success") {
      fetchData();
    }
  };

  const handleInitiate = async () => {
    const normalized = phoneNumber.trim();
    if (!/^09\d{9}$/.test(normalized)) {
      setAddError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }

    setSubmitting(true);
    setAddError(null);
    try {
      const res = await syncBoothsApi.initiate(normalized);
      if (!res.success) {
        throw new Error(res.error || "خطا در ارسال کد تایید");
      }
      setMaskedPhone(res.maskedPhone || normalized);
      setAddStep("code");
      setCode("");
    } catch (e) {
      setAddError(mapInitiateError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!code.trim()) {
      setAddError("لطفا کد تایید را وارد کنید.");
      return;
    }

    setSubmitting(true);
    setAddError(null);
    try {
      const res = await syncBoothsApi.confirm(phoneNumber.trim(), code.trim());
      if (!res.success) {
        throw new Error(res.error || "خطا در تایید کد");
      }
      setNewChildTitle(res.childVendor?.title || "غرفه جدید");
      if (res.initialSyncJobId) {
        setSyncJobId(res.initialSyncJobId);
      }
      setAddStep("success");
    } catch (e) {
      setAddError(mapConfirmError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveChild = async (child: ChildStore) => {
    setRemovingId(child.relation_id);
    try {
      await syncBoothsApi.removeChild(child.relation_id);
      setConfirmRemove(null);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در حذف غرفه فرزند");
    } finally {
      setRemovingId(null);
    }
  };

  const jobFinished = jobStatus && ["completed", "success"].includes(jobStatus);
  const jobFailed = jobStatus && ["failed", "error"].includes(jobStatus);

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">سینک غرفه‌ها</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  همگام‌سازی محصولات غرفه شما با غرفه‌های دیگر در باسلام
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                resetAddFlow();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              اتصال غرفه جدید
            </button>
          </div>

          {/* توضیح فلو */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Link2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 leading-6">
              غرفه مبدأ به صورت خودکار همین غرفه فعلی شماست. کافیست شماره موبایل صاحب غرفه مقصد را وارد کنید؛
              بعد از تایید کد پیامکی، تمام محصولات به غرفه مقصد کپی می‌شوند و از آن به بعد موجودی، قیمت و
              اطلاعات محصولات به صورت خودکار همگام می‌مانند.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={fetchData} className="text-xs text-red-600 underline">
                تلاش مجدد
              </button>
            </div>
          ) : (
            <>
              {/* غرفه مبدأ */}
              {parent && (
                <div className="bg-white rounded-2xl border-2 border-orange-200 p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">غرفه مبدأ (غرفه شما)</p>
                      <p className="font-bold text-slate-800">{parent.vendor_title || "—"}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    شناسه غرفه:{" "}
                    <span className="font-bold text-slate-700">
                      {toFarsiNumber(parent.basalam_vendor_id)}
                    </span>
                  </div>
                </div>
              )}

              {/* لیست غرفه‌های مقصد */}
              {children.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">
                    هنوز غرفه‌ای متصل نکرده‌اید
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">
                    با اتصال غرفه مقصد، محصولات شما به صورت خودکار در آن غرفه هم قرار می‌گیرند و همگام می‌مانند.
                  </p>
                  <button
                    onClick={() => {
                      resetAddFlow();
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    اتصال اولین غرفه
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {children.map((child) => (
                    <motion.div
                      key={child.relation_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Store className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {child.child_vendor_info?.vendor_title ||
                                `غرفه ${child.child_vendor_id}`}
                            </p>
                            {child.child_vendor_info?.vendor_identifier && (
                              <p className="text-xs text-slate-400" dir="ltr">
                                @{child.child_vendor_info.vendor_identifier}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmRemove(child)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="حذف اتصال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <HealthBadge health={child.sync_health} />
                      </div>

                      <div className="space-y-2">
                        <StatRow
                          label="محصولات همگام"
                          value={toFarsiNumber(child.sync_statistics?.synced_products_count ?? 0)}
                        />
                        <StatRow
                          label="نرخ موفقیت سینک"
                          value={child.sync_statistics?.success_rate || "—"}
                        />
                        <StatRow
                          label="تاریخ اتصال"
                          value={formatJalali(child.created_at)}
                        />
                      </div>

                      {/* فعالیت اخیر */}
                      {child.recent_sync_activity && child.recent_sync_activity.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            آخرین فعالیت‌ها
                          </p>
                          <div className="space-y-1.5">
                            {child.recent_sync_activity.slice(0, 3).map((activity, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                                  {activity.status === "success" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{activity.product_name}</span>
                                </span>
                                <span className="text-slate-400 flex-shrink-0 mr-2">
                                  {activity.time_ago}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* مودال افزودن غرفه فرزند */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeAddModal}
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      {addStep === "phone" && <Phone className="w-5 h-5 text-white" />}
                      {addStep === "code" && <ShieldCheck className="w-5 h-5 text-white" />}
                      {addStep === "success" && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">اتصال غرفه مقصد</h3>
                      <p className="text-white/80 text-xs">
                        {addStep === "phone" && "مرحله ۱ از ۲ — شماره موبایل غرفه مقصد"}
                        {addStep === "code" && "مرحله ۲ از ۲ — تایید کد پیامکی"}
                        {addStep === "success" && "اتصال با موفقیت انجام شد"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeAddModal}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors text-white text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {addStep === "phone" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-6">
                      شماره موبایلی که صاحب غرفه مقصد با آن در پیوندیار ثبت‌نام کرده را وارد کنید.
                      یک کد تایید برای آن شماره پیامک می‌شود.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        شماره موبایل
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && !submitting && handleInitiate()}
                        placeholder="09123456789"
                        maxLength={11}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-left"
                        dir="ltr"
                        autoFocus
                      />
                    </div>

                    {addError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-600 text-xs leading-5">{addError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleInitiate}
                      disabled={submitting}
                      className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          در حال ارسال کد...
                        </span>
                      ) : (
                        "ارسال کد تایید"
                      )}
                    </button>
                  </div>
                )}

                {addStep === "code" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-6">
                      کد تایید به شماره{" "}
                      <span className="font-bold text-slate-800" dir="ltr">
                        {maskedPhone}
                      </span>{" "}
                      پیامک شد. کد را از صاحب غرفه مقصد بگیرید و وارد کنید.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        کد تایید
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && !submitting && handleConfirm()}
                        placeholder="- - - -"
                        maxLength={6}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg text-center tracking-[0.5em] font-bold"
                        dir="ltr"
                        autoFocus
                      />
                    </div>

                    {addError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-600 text-xs leading-5">{addError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          در حال تایید...
                        </span>
                      ) : (
                        "تایید و اتصال"
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setAddStep("phone");
                        setCode("");
                        setAddError(null);
                      }}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors py-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      تغییر شماره یا دریافت کد جدید
                    </button>
                  </div>
                )}

                {addStep === "success" && (
                  <div className="space-y-4 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-1">
                        «{newChildTitle}» متصل شد
                      </h4>
                      <p className="text-sm text-slate-500 leading-6">
                        از این به بعد موجودی، قیمت و اطلاعات محصولات به صورت خودکار با این غرفه
                        همگام می‌مانند.
                      </p>
                    </div>

                    {/* وضعیت کپی اولیه محصولات */}
                    {syncJobId && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center justify-center gap-2 ${
                          jobFinished
                            ? "bg-green-50 border-green-200 text-green-700"
                            : jobFailed
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        {jobFinished ? (
                          <>
                            <Package className="w-4 h-4" />
                            کپی اولیه محصولات با موفقیت انجام شد
                          </>
                        ) : jobFailed ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            کپی اولیه محصولات با خطا مواجه شد — سینک بعدی به صورت خودکار تلاش می‌کند
                          </>
                        ) : (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            در حال کپی اولیه محصولات به غرفه مقصد...
                          </>
                        )}
                      </div>
                    )}

                    <button
                      onClick={closeAddModal}
                      className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm font-bold"
                    >
                      مشاهده لیست غرفه‌ها
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال تایید حذف */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmRemove(null)}
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">حذف اتصال غرفه</h3>
              <p className="text-sm text-slate-500 text-center leading-6 mb-6">
                اتصال «
                {confirmRemove.child_vendor_info?.vendor_title ||
                  `غرفه ${confirmRemove.child_vendor_id}`}
                » حذف شود؟ سینک خودکار محصولات با این غرفه متوقف می‌شود.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRemoveChild(confirmRemove)}
                  disabled={removingId === confirmRemove.relation_id}
                  className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm font-bold"
                >
                  {removingId === confirmRemove.relation_id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال حذف...
                    </span>
                  ) : (
                    "بله، حذف شود"
                  )}
                </button>
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
