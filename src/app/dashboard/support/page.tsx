"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  Headphones,
  Mail,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  Phone,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = getAuthToken();

    if (!authToken) {
      router.push("/");
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setSubmitError("لطفاً موضوع و پیام را وارد کنید");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // TODO: ارسال به API پشتیبانی
      // const response = await supportApi.sendTicket({ subject, message });

      // شبیه‌سازی ارسال
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitSuccess(true);
      setSubject("");
      setMessage("");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error submitting support ticket:", error);
      setSubmitError(error.message || "خطا در ارسال پیام");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
          />
        </div>
      </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              پنل پشتیبانی
            </h1>
            <p className="text-slate-500">
              در صورت بروز مشکل یا سوال، با ما در ارتباط باشید
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-800 font-medium">
                پیام شما با موفقیت ارسال شد. در اسرع وقت پاسخ داده خواهد شد.
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-800 font-medium">{submitError}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Contact Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">تلگرام</h3>
              <p className="text-slate-600 text-sm mb-4">
                پشتیبانی سریع از طریق تلگرام
              </p>
              <a
                href="https://t.me/mjsoltani2001"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2"
              >
                <span dir="ltr">@mjsoltani2001</span>
                <Send className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">تماس تلفنی</h3>
              <p className="text-slate-600 text-sm mb-4">
                تماس مستقیم با پشتیبانی
              </p>
              <a
                href="tel:09162628099"
                className="text-green-600 hover:text-green-700 font-bold flex items-center gap-2"
                dir="ltr"
              >
                <Phone className="w-4 h-4" />
                <span>09162628099</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">تیکت پشتیبانی</h3>
              <p className="text-slate-600 text-sm mb-4">
                ارسال تیکت از طریق فرم زیر
              </p>
              <p className="text-slate-400 text-xs">
                پاسخ در کمتر از 24 ساعت
              </p>
            </motion.div>
          </div>

          {/* Support Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Headphones className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                ارسال تیکت پشتیبانی
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  موضوع
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: مشکل در ویرایش محصولات"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  پیام
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="توضیحات خود را اینجا بنویسید..."
                  rows={8}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                  isSubmitting
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                )}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>در حال ارسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>ارسال پیام</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      </DashboardLayout>
    </AuthGuard>
  );
}

