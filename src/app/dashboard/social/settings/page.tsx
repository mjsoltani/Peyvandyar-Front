"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SocialAccountForm } from "@/components/dashboard/social-account-form";
import {
  socialApi,
  SocialAccount,
  SocialPlatform,
  SOCIAL_PLATFORM_LABELS,
  DEFAULT_SOCIAL_TEMPLATE,
  socialAccountId,
  isSocialNotConfigured,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  Share2,
  AlertCircle,
  Loader2,
  CheckCircle,
  History,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

function platformLabel(platform?: string) {
  if (!platform) return "—";
  return SOCIAL_PLATFORM_LABELS[platform as SocialPlatform] || platform;
}

function accountTitle(account: SocialAccount) {
  const platform = platformLabel(String(account.platform || ""));
  const chatId = account.chatId ? String(account.chatId) : "";
  return chatId ? `${platform} · ${chatId}` : platform;
}

export default function SocialSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [formMode, setFormMode] = useState<"hidden" | "create" | "edit">("hidden");
  const [editing, setEditing] = useState<SocialAccount | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const list = await socialApi.listAccounts();
      setAccounts(list);
      setFormMode(list.length === 0 ? "create" : "hidden");
      setEditing(null);
    } catch (err: unknown) {
      if (isSocialNotConfigured(err)) {
        setAccounts([]);
        setFormMode("create");
        setEditing(null);
      } else {
        setError(
          err instanceof Error ? err.message : "خطا در دریافت اکانت‌های سوشیال"
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const closeForm = () => {
    setFormMode(accounts.length === 0 ? "create" : "hidden");
    setEditing(null);
    setError("");
  };

  const handleCreate = async (values: {
    platform: SocialPlatform;
    botToken: string;
    chatId: string;
    template: string;
  }) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response: any = await socialApi.addAccount(
        {
          platform: values.platform,
          botToken: values.botToken,
          chatId: values.chatId,
          template: values.template || undefined,
        },
        accounts
      );
      const data = response?.data ?? response;
      if (data?.success === false) {
        setError(data.error || data.message || "ذخیره ناموفق بود");
        return;
      }
      setSuccess("اکانت سوشیال اضافه شد");
      await loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در افزودن اکانت");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (values: {
    platform: SocialPlatform;
    botToken: string;
    chatId: string;
    template: string;
  }) => {
    if (!editing) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response: any = await socialApi.updateAccount(socialAccountId(editing), {
        platform: values.platform,
        chatId: values.chatId,
        botToken: values.botToken || undefined,
        template: values.template || undefined,
      });
      const data = response?.data ?? response;
      if (data?.success === false) {
        setError(data.error || data.message || "ذخیره ناموفق بود");
        return;
      }
      setSuccess("اکانت سوشیال به‌روز شد");
      await loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ویرایش اکانت");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (account: SocialAccount) => {
    const ok = window.confirm(`اکانت «${accountTitle(account)}» حذف شود؟`);
    if (!ok) return;
    const id = socialAccountId(account);
    try {
      setRemovingId(id ?? "legacy");
      setError("");
      setSuccess("");
      await socialApi.removeAccount(id);
      setSuccess("اکانت حذف شد");
      await loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در حذف اکانت");
    } finally {
      setRemovingId(null);
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
                <h1 className="text-2xl font-bold text-slate-800">اکانت‌های سوشیال</h1>
                <p className="text-sm text-slate-500">
                  هر تعداد کانال ایتا، بله، تلگرام و بقیه پلتفرم‌ها را اضافه کنید
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/social/logs")}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-orange-300 inline-flex items-center gap-1.5"
              >
                <History className="w-4 h-4" />
                تاریخچه
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setEditing(null);
                  setError("");
                  setSuccess("");
                }}
                className="px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                افزودن اکانت
              </button>
            </div>
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
              در حال بارگذاری اکانت‌ها...
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.length > 0 && (
                <div className="space-y-3">
                  {accounts.map((account, index) => {
                    const id = socialAccountId(account);
                    const isRemoving = removingId != null && removingId === (id ?? "legacy");
                    return (
                      <div
                        key={String(id ?? `${account.platform}-${account.chatId}-${index}`)}
                        className="bg-white rounded-xl border border-slate-200 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-800">
                              {accountTitle(account)}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {account.isActive === false ? "غیرفعال" : "فعال"}
                              {account.updatedAt
                                ? ` · ${new Date(String(account.updatedAt)).toLocaleString("fa-IR")}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(account);
                                setFormMode("edit");
                                setError("");
                                setSuccess("");
                              }}
                              className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-orange-300 inline-flex items-center gap-1.5"
                            >
                              <Pencil className="w-4 h-4" />
                              ویرایش
                            </button>
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => handleRemove(account)}
                              className="px-3 py-2 rounded-lg border border-red-100 text-red-600 text-sm hover:bg-red-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              حذف
                            </button>
                          </div>
                        </div>
                        {account.template && (
                          <pre className="mt-3 text-xs bg-slate-50 rounded-lg p-3 whitespace-pre-wrap text-slate-700">
                            {String(account.template)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {accounts.length > 0 && formMode === "hidden" && (
                <p className="text-sm text-slate-500">
                  انتشار محصول از صفحه{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/products")}
                    className="text-orange-600 underline"
                  >
                    مدیریت محصولات
                  </button>{" "}
                  روی همه اکانت‌های متصل ارسال می‌شود.
                </p>
              )}

              {formMode === "create" && (
                <SocialAccountForm
                  key="create"
                  title={accounts.length ? "افزودن اکانت جدید" : "افزودن اولین اکانت"}
                  description={
                    accounts.length
                      ? "این اکانت به لیست قبلی اضافه می‌شود و جایگزین بقیه نمی‌شود."
                      : "پلتفرم، توکن ربات و آیدی کانال را وارد کنید. بعداً می‌توانید اکانت‌های بیشتری اضافه کنید."
                  }
                  requireToken
                  saving={saving}
                  submitLabel="افزودن اکانت"
                  onSubmit={handleCreate}
                  onCancel={accounts.length ? closeForm : undefined}
                />
              )}

              {formMode === "edit" && editing && (
                <SocialAccountForm
                  key={String(socialAccountId(editing) ?? "edit")}
                  title="ویرایش اکانت"
                  initialPlatform={editing.platform}
                  initialChatId={editing.chatId ? String(editing.chatId) : ""}
                  initialTemplate={
                    editing.template
                      ? String(editing.template)
                      : DEFAULT_SOCIAL_TEMPLATE
                  }
                  requireToken={
                    !socialApi.hasAccountsCollection() ||
                    socialAccountId(editing) == null
                  }
                  tokenPlaceholder={
                    socialAccountId(editing) != null
                      ? "برای تغییر، توکن جدید را وارد کنید"
                      : "توکن ربات پلتفرم"
                  }
                  saving={saving}
                  submitLabel="ذخیره تغییرات"
                  onSubmit={handleUpdate}
                  onCancel={closeForm}
                />
              )}
            </div>
          )}
        </motion.div>
      </main>
    </DashboardLayout>
  );
}
