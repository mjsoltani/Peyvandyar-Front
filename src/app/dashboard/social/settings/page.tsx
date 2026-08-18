"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  socialApi,
  SocialPlatform,
  SocialStatus,
  SOCIAL_PLATFORM_LABELS,
  DEFAULT_SOCIAL_TEMPLATE,
  ApiError,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  Share2,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  History,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = Object.keys(SOCIAL_PLATFORM_LABELS) as SocialPlatform[];

function isNotConfigured(err: unknown) {
  if (err instanceof ApiError) {
    return (
      err.code === "NOT_CONFIGURED" ||
      err.statusCode === 404 ||
      /NOT_CONFIGURED|هنوز اتصال|تنظیم نشده/i.test(err.message)
    );
  }
  const msg = (err as any)?.message || "";
  return /NOT_CONFIGURED|هنوز اتصال|تنظیم نشده/i.test(msg);
}

function renderTemplatePreview(template: string) {
  return template
    .replaceAll("{price}", "۱٬۲۵۰٬۰۰۰")
    .replaceAll("{title}", "کفش اسپرت مردانه")
    .replaceAll("{description}", "سایزبندی ۴۰ تا ۴۵، ارسال رایگان");
}

function platformLabel(platform?: string) {
  if (!platform) return "—";
  return SOCIAL_PLATFORM_LABELS[platform as SocialPlatform] || platform;
}

export default function SocialSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [platform, setPlatform] = useState<SocialPlatform>("eitaa");
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [chatId, setChatId] = useState("");
  const [template, setTemplate] = useState(DEFAULT_SOCIAL_TEMPLATE);

  const preview = useMemo(() => renderTemplatePreview(template), [template]);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await socialApi.getStatus();
      const data = response.data ?? response;
      setConfigured(true);
      setStatus(data);
      if (data.platform) setPlatform(data.platform as SocialPlatform);
      if (data.template) setTemplate(String(data.template));
      setEditing(false);
      setBotToken("");
    } catch (err: any) {
      if (isNotConfigured(err)) {
        setConfigured(false);
        setStatus(null);
        setEditing(true);
      } else {
        setError(err.message || "خطا در دریافت وضعیت سوشیال");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !chatId.trim()) {
      setError("توکن ربات و آیدی کانال الزامی است");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response: any = await socialApi.setup({
        platform,
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        template: template.trim() || undefined,
      });
      const data = response.data ?? response;
      if (data.success === false) {
        setError(data.error || data.message || "ذخیره ناموفق بود");
        return;
      }
      setSuccess("اتصال سوشیال ذخیره شد");
      setBotToken("");
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "خطا در ذخیره اتصال");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <button
            type="button"
            onClick={() => router.push("/dashboard/social")}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به شبکه‌های اجتماعی
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Share2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">دیدن و تنظیمات</h1>
                <p className="text-sm text-slate-500">
                  وضعیت اتصال و تنظیم پلتفرم، توکن و کانال
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/social/logs")}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-orange-300 inline-flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              تاریخچه
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-slate-500 bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال بارگذاری وضعیت...
            </div>
          ) : (
            <>
              {configured && status && !editing && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">وضعیت اتصال</p>
                      <p className="font-bold text-green-700">
                        {status.isActive === false ? "غیرفعال" : "فعال"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
                    >
                      ویرایش اتصال
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">پلتفرم</p>
                      <p className="font-medium text-slate-800">
                        {platformLabel(String(status.platform))}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">آخرین به‌روزرسانی</p>
                      <p className="font-medium text-slate-800">
                        {status.updatedAt
                          ? new Date(String(status.updatedAt)).toLocaleString("fa-IR")
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {status.template && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">قالب فعلی</p>
                      <pre className="text-xs bg-slate-50 rounded-lg p-3 whitespace-pre-wrap text-slate-700">
                        {String(status.template)}
                      </pre>
                    </div>
                  )}
                  <p className="text-sm text-slate-500">
                    برای انتشار، از صفحه{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/products")}
                      className="text-orange-600 underline"
                    >
                      مدیریت محصولات
                    </button>{" "}
                    روی هر ردیف دکمه «انتشار» را بزنید.
                  </p>
                </div>
              )}

              {(editing || !configured) && (
                <form
                  onSubmit={handleSave}
                  className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
                >
                  <h2 className="font-bold text-slate-800">
                    {configured ? "ویرایش اتصال" : "تنظیم اتصال سوشیال"}
                  </h2>
                  {!configured && (
                    <p className="text-sm text-slate-500">
                      هنوز اتصالی تنظیم نشده. پلتفرم، توکن ربات و آیدی کانال را وارد کنید.
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      پلتفرم
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {SOCIAL_PLATFORM_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      توکن ربات (botToken)
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder={
                          configured
                            ? "برای تغییر، توکن جدید را وارد کنید"
                            : "توکن ربات پلتفرم"
                        }
                        className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                        dir="ltr"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      آیدی کانال / چت (chatId)
                    </label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="@mychannel"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      قالب کپشن
                    </label>
                    <textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 font-mono text-sm"
                      dir="rtl"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Placeholderها: {"{title}"} {"{description}"} {"{price}"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">پیش‌نمایش زنده</p>
                    <pre className="text-sm bg-slate-50 border border-slate-100 rounded-xl p-4 whitespace-pre-wrap text-slate-700">
                      {preview}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 min-w-[140px] py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl inline-flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          در حال ذخیره...
                        </>
                      ) : (
                        "ذخیره اتصال"
                      )}
                    </button>
                    {configured && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setError("");
                          setBotToken("");
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600"
                      >
                        انصراف
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
