"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { paymentApi } from "@/lib/api";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "unverified" | "pending">("loading");
  const [message, setMessage] = useState<string>("");
  const [details, setDetails] = useState<{
    amount?: number;
    reference_id?: string;
  }>({});

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // دریافت پارامترهای callback
        const callbackStatus = searchParams.get("status");
        const hashId = searchParams.get("hash_id");

        if (!callbackStatus || !hashId) {
          setStatus("failed");
          setMessage("اطلاعات پرداخت ناقص است");
          return;
        }

        // بررسی وضعیت اولیه
        if (callbackStatus === "failed") {
          setStatus("failed");
          setMessage("پرداخت ناموفق بود. لطفا دوباره تلاش کنید.");
          return;
        }

        // دریافت وضعیت نهایی از سرور
        const response = await paymentApi.getPaymentStatus(hashId);

        if (response.success && response.status) {
          setStatus(response.status);
          setMessage(
            response.message ||
              (response.status === "success"
                ? "پرداخت با موفقیت انجام شد و اشتراک شما فعال گردید"
                : response.status === "failed"
                ? "پرداخت ناموفق بود"
                : "وضعیت پرداخت نامشخص است")
          );
          setDetails({
            amount: response.amount,
            reference_id: response.reference_id,
          });
        } else {
          setStatus("failed");
          setMessage(response.message || response.error || "خطا در بررسی وضعیت پرداخت");
        }
      } catch (error: any) {
        console.error("Payment callback error:", error);
        setStatus("failed");
        setMessage(error.message || "خطا در بررسی وضعیت پرداخت");
      }
    };

    handleCallback();
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleGoToSubscription = () => {
    router.push("/subscription");
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white flex items-center justify-center p-4">
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Status Icon */}
          <div
            className={`px-6 py-8 flex flex-col items-center justify-center ${
              status === "success"
                ? "bg-gradient-to-b from-green-50 to-white"
                : status === "failed"
                ? "bg-gradient-to-b from-red-50 to-white"
                : status === "unverified"
                ? "bg-gradient-to-b from-amber-50 to-white"
                : "bg-gradient-to-b from-slate-50 to-white"
            }`}
          >
            {status === "loading" && (
              <Loader2 className="w-16 h-16 text-slate-500 animate-spin mb-4" />
            )}
            {status === "success" && (
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            )}
            {status === "failed" && (
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
            )}
            {(status === "unverified" || status === "pending") && (
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
            )}

            <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
              {status === "loading"
                ? "در حال بررسی پرداخت..."
                : status === "success"
                ? "پرداخت موفق"
                : status === "failed"
                ? "پرداخت ناموفق"
                : status === "pending"
                ? "در انتظار تایید"
                : "وضعیت نامشخص"}
            </h1>

            <p className="text-slate-600 text-center">{message}</p>
          </div>

          {/* Details */}
          {status !== "loading" && (
            <div className="px-6 py-6 space-y-4">
              {details.reference_id && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">شماره پیگیری</div>
                  <div className="font-mono text-slate-800 font-semibold">
                    {details.reference_id}
                  </div>
                </div>
              )}

              {details.amount && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">مبلغ پرداختی</div>
                  <div className="text-slate-800 font-semibold">
                    {(details.amount / 10).toLocaleString("fa-IR")} تومان
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                {status === "success" && (
                  <button
                    onClick={handleGoToDashboard}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold"
                  >
                    ورود به داشبورد
                  </button>
                )}
                {status === "failed" && (
                  <button
                    onClick={handleGoToSubscription}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold"
                  >
                    تلاش مجدد
                  </button>
                )}
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
                >
                  بازگشت به صفحه اصلی
                </button>
              </div>

              {/* Support Info */}
              {(status === "failed" || status === "unverified" || status === "pending") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>نیاز به کمک دارید؟</strong>
                    <br />
                    با پشتیبانی تماس بگیرید:{" "}
                    <a
                      href="https://t.me/mjsoltani2001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      @mjsoltani2001
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-8 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white">
              <Loader2 className="w-16 h-16 text-slate-500 animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                در حال بررسی پرداخت...
              </h1>
            </div>
          </div>
        </div>
      </main>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
