"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { setAuthToken, BASALAM_SSO_URL } from "@/lib/auth";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("در حال پردازش...");
  const [userData, setUserData] = useState<{
    username?: string;
    vendor_title?: string;
  } | null>(null);

  useEffect(() => {
    // چک کردن اگر توکن مستقیم در URL هست
    const token = searchParams.get("token");
    const encryptedToken = searchParams.get("encrypted_token");
    
    // اگر توکن در URL هست
    if (token || encryptedToken) {
      const finalToken = token || encryptedToken;
      setAuthToken(finalToken!);
      
      setStatus("success");
      setMessage("ورود موفقیت‌آمیز! در حال انتقال به داشبورد...");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return;
    }

    // چک کردن اگر داده JSON در URL هست (از بکند)
    // بعضی بکندها داده رو به صورت base64 یا JSON string می‌فرستن
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        if (parsed.encrypted_token) {
          setAuthToken(parsed.encrypted_token);
          setUserData(parsed.user);
          
          setStatus("success");
          setMessage("ورود موفقیت‌آمیز! در حال انتقال به داشبورد...");
          
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
          return;
        }
      } catch {
        // Parse failed, continue
      }
    }

    // اگر هیچکدوم نبود، خطا نشون بده
    // شاید کاربر مستقیم اومده این صفحه
    const code = searchParams.get("code");
    if (code) {
      // کد OAuth هست، باید به بکند بفرستیم
      setMessage("در حال تأیید با باسلام...");
      
      // Fetch از بکند برای گرفتن توکن
      fetch(`https://peyvandyar.amintvk.ir/api/webhook/oauth?code=${code}&state=${searchParams.get("state") || ""}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.encrypted_token) {
            setAuthToken(data.encrypted_token);
            setUserData(data.user);
            
            setStatus("success");
            setMessage(`خوش آمدید ${data.user?.vendor_title || data.user?.username || ""}!`);
            
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          } else {
            setStatus("error");
            setMessage(data.message || "خطا در احراز هویت");
          }
        })
        .catch(() => {
          setStatus("error");
          setMessage("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
        });
      return;
    }

    // اگر هیچ پارامتری نبود
    setStatus("error");
    setMessage("اطلاعات احراز هویت یافت نشد. لطفاً دوباره تلاش کنید.");
  }, [searchParams, router]);

  return (
    <div 
      dir="rtl" 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center p-8 max-w-md"
      >
        {/* Logo */}
        <div className="mb-8">
          <svg
            viewBox="0 0 120 80"
            className="w-24 h-16 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="chainGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff5722" />
                <stop offset="100%" stopColor="#ff7043" />
              </linearGradient>
              <linearGradient id="chainGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff7043" />
                <stop offset="100%" stopColor="#ff5722" />
              </linearGradient>
            </defs>
            <ellipse
              cx="38"
              cy="40"
              rx="22"
              ry="14"
              fill="none"
              stroke="url(#chainGradient1)"
              strokeWidth="10"
              strokeLinecap="round"
              transform="rotate(-35 38 40)"
            />
            <ellipse
              cx="82"
              cy="40"
              rx="22"
              ry="14"
              fill="none"
              stroke="url(#chainGradient2)"
              strokeWidth="10"
              strokeLinecap="round"
              transform="rotate(35 82 40)"
            />
          </svg>
        </div>

        {/* Status Icon */}
        <div className="mb-6">
          {status === "loading" && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto border-4 border-orange-200 border-t-orange-500 rounded-full"
            />
          )}
          {status === "success" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          {status === "loading" && "در حال احراز هویت"}
          {status === "success" && "ورود موفق"}
          {status === "error" && "خطا در ورود"}
        </h1>
        <p className="text-slate-500 mb-2">{message}</p>
        
        {/* User Info */}
        {userData && status === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-orange-50 rounded-xl"
          >
            <p className="text-orange-700 font-medium">
              {userData.vendor_title || userData.username}
            </p>
          </motion.div>
        )}

        {/* Retry Button for Error */}
        {status === "error" && (
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            href={BASALAM_SSO_URL}
            className="inline-block mt-6 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
          >
            تلاش مجدد
          </motion.a>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full"
        />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
